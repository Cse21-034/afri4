import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';
import { CargoType, Industry, TruckType, RateBasis, JobMode, Country } from '../../shared/schema.js';

const configured = !!process.env.ANTHROPIC_API_KEY;

if (!configured) {
  console.warn('⚠ Anthropic API key not configured. Set ANTHROPIC_API_KEY to enable job-post extraction.');
}

// Lazy-constructed: the SDK throws at instantiation time if no key/credential is resolvable,
// so building it eagerly at import time would crash the whole server on boot when unconfigured.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export function isClaudeConfigured() {
  return configured;
}

const cargoTypeValues = Object.values(CargoType) as [string, ...string[]];
const industryValues = Object.values(Industry) as [string, ...string[]];
const truckTypeValues = Object.values(TruckType) as [string, ...string[]];
const rateBasisValues = Object.values(RateBasis) as [string, ...string[]];
const jobModeValues = Object.values(JobMode) as [string, ...string[]];
const countryValues = Object.values(Country) as [string, ...string[]];

// Mirrors exactly what POST /api/jobs (admin on-behalf path) accepts, so a confirmed
// extraction can be submitted through the existing create-job route with zero translation.
const extractedJobSchema = z.object({
  shipperId: z.number().nullable(),
  jobMode: z.enum(jobModeValues),
  cargoType: z.enum(cargoTypeValues).nullable(),
  cargoWeight: z.number().nullable(),
  cargoVolume: z.number().nullable(),
  industry: z.enum(industryValues).nullable(),
  pickupAddress: z.string().nullable(),
  deliveryAddress: z.string().nullable(),
  pickupCountry: z.enum(countryValues).nullable(),
  deliveryCountry: z.enum(countryValues).nullable(),
  pickupDate: z.string().nullable(),
  deliveryDeadline: z.string().nullable(),
  truckType: z.enum(truckTypeValues).nullable(),
  truckRequirements: z.array(z.string()),
  rateAmount: z.number().nullable(),
  rateBasis: z.enum(rateBasisValues),
  rateCurrency: z.string().nullable(),
  paymentTerms: z.string().nullable(),
  dieselOnAccount: z.boolean(),
  quantity: z.number(),
  totalQuantity: z.number().nullable(),
  quantityUnit: z.string().nullable(),
  distanceKm: z.number().nullable(),
  requiresHazmat: z.boolean(),
  requiresTrec: z.boolean(),
  requiresPlacards: z.boolean(),
  permits: z.array(z.string()),
  insuranceRequired: z.boolean(),
  specialHandling: z.string().nullable(),
  notes: z.string().nullable(),
  stops: z.array(z.object({
    sequence: z.number(),
    stopType: z.enum(['pickup', 'delivery']),
    address: z.string(),
    country: z.enum(countryValues).nullable(),
  })),
});

const shipperMatchSchema = z.object({
  shipperId: z.number().nullable(),
  matchedName: z.string().nullable(),
  confidence: z.enum(['high', 'low', 'none']),
  reason: z.string(),
});

const jobMetaSchema = z.object({
  sourceText: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  shipperMatch: shipperMatchSchema,
  warnings: z.array(z.string()),
  nullFields: z.array(z.string()),
});

const extractionResultSchema = z.object({
  jobs: z.array(z.object({
    job: extractedJobSchema,
    meta: jobMetaSchema,
  })),
  excluded: z.array(z.object({
    reason: z.string(),
    snippet: z.string(),
  })),
});

export type ExtractedJob = z.infer<typeof extractedJobSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

export interface ShippingEntityRef {
  id: number;
  name: string;
  aliases: string[];
  phones: string[];
}

// Copied verbatim from the job-extraction-agent spec.
const SYSTEM_PROMPT = `You are a freight-post extraction agent for LoadX Africa, a freight-matching
platform in Southern/East Africa. You convert a pasted broker/WhatsApp message
into structured job records. You output STRICT JSON only — no prose, no markdown,
no code fences.

## Inputs (provided in the user message)
- RAW_MESSAGE: pasted text. It may contain zero, one, or many separate loads,
  mixed with non-load noise (greetings, border notices, shared map links, phone
  numbers, follower counts, timestamps).
- SHIPPING_ENTITIES: a JSON array of existing shipping entities. This is the ONLY
  valid source of shipperId. You must never output a shipperId that is not an id
  in this array.

## Golden rules
1. EXTRACT ONLY WHAT IS LITERALLY STATED. Never invent, infer, geocode, or guess
   a value the message does not contain. Missing → null (or false for booleans,
   [] for arrays). A city name alone does NOT let you fill its country — only set
   a country if the country name/demonym is written in the text.
2. One paste can contain several distinct loads. Emit one job object per load.
   A block listing two routes with two rates = two jobs.
3. Non-load messages are not jobs. Put them in "excluded" with a short reason.
   Never fabricate a job from a notice or a greeting.
4. Output must be valid JSON matching the exact shape shown under OUTPUT. No text
   before or after it.

## Field extraction

pickupAddress / deliveryAddress: the origin and final destination as written.
For a multi-stop route, pickupAddress = first pickup, deliveryAddress = final
drop; put intermediate stops in "stops".

pickupCountry / deliveryCountry: ONLY if the country is named in the text. Map to
this enum (name → code):
  South Africa/RSA→ZAF, Zambia→ZMB, DRC/Congo/Kinshasa→COD, Malawi→MWI,
  Botswana→BWA, Zimbabwe→ZWE, Mozambique→MOZ, Namibia→NAM, Tanzania→TZA,
  Angola→AGO, Lesotho→LSO, Eswatini/Swaziland→SWZ, Madagascar→MDG,
  Mauritius→MUS, Comoros→COM, Seychelles→SYC.
  Not named → null.

cargoType (pick the single closest; else null): general, refrigerated, hazardous,
bulk, containers, livestock, agricultural, mining, construction, vehicles,
electronics, textiles, pharmaceuticals, perishables, oversized, liquids.
Guidance: acids/chemicals→hazardous; fertilizer→agricultural; poles/planks/
timber→construction; granite/stone→construction; ore/coal→mining;
fuel/oil→liquids. If a load is both hazardous and liquid, choose hazardous.

industry (else null): agriculture, manufacturing, retail, mining, logistics,
construction.

cargoWeight (kg, integer) / cargoVolume (m³): only if a number is stated. Convert
tons to kg (1 ton = 1000 kg) for cargoWeight ONLY on fixed single-load jobs. For
tenders, leave cargoWeight null and use totalQuantity/quantityUnit instead.

truckType (else null): tri_axle, superlink, link, tautliner, flat_deck, pantech,
tanker, tipper, lowbed, reefer, side_tipper, other.
Guidance: "tri-axle/triaxle"→tri_axle; "superlink"→superlink; "link/FD link/flat
deck link"→link (or flat_deck if a rigid flat deck, not a link); "tautliner"→
tautliner; "pantech/pantechnicon/closed-body"→pantech; acid/fuel in bulk→tanker.

truckRequirements (array; [] if none): normalise phrases to tags, e.g.
"pockets/pole pockets"→"pole_pockets", "closed-body"→"closed_body",
"hazmat-compliant"→"hazmat". Keep unknown but clearly-stated requirements as
lowercase snake_case.

rateAmount / rateBasis / rateCurrency:
- "R500 per ton" → rateAmount 500, rateBasis "per_ton", rateCurrency "ZAR".
- "R8000" flat → rateAmount 8000, rateBasis "flat".
- "R15000 ... 2 loads" → rateAmount 15000, rateBasis "per_load", quantity 2.
- "please quote / enquire / rate?" or a tender → rateAmount null, rateBasis
  "quote".
- Currency: "R"→ZAR, "USD/$"→USD, "K"(Kwacha)→ZMW/MWK only if unambiguous, else
  ZAR default when an "R" figure is present; null if no figure at all.
rateBasis enum: flat, per_ton, per_km, per_load, quote.

paymentTerms: capture the phrase verbatim if present — "COD", "30 days",
"15th and month-end on ePOD", "50/50". Else null.

dieselOnAccount: true only if the text says diesel is available/on account. Else
false.

quantity: number of identical loads for a fixed job (default 1). "2 loads" → 2.

jobMode + tender fields:
Set jobMode "tender" when the message is a QUOTE/RATE REQUEST rather than a fixed
load — signals include: "quote request", "rate & availability request", "please
provide rates", asking "how much of the allocation you can complete", "available
weekly capacity", "period required", large tonnage to be split across carriers,
or soliciting capacity with no fixed rate. For tenders: rateBasis "quote",
rateAmount null, and set totalQuantity (e.g. 4000) + quantityUnit ("tons" or
"loads"). Otherwise jobMode "fixed", totalQuantity null, quantityUnit null.

Compliance (only when stated; else false / []):
- requiresHazmat: true if hazardous cargo or "hazmat-compliant" is mentioned.
- requiresTrec: true if "TREC" is mentioned.
- requiresPlacards: true if "placards"/"Hazchem placards" mentioned.
- permits: array of named permits/docs, e.g. ["RIT","Agri Permit","MPR Manifest"].

distanceKm: integer if a distance is stated ("200km" → 200). Else null.

pickupDate / deliveryDeadline: ISO 8601 ONLY when a concrete date is given
("Thursday 6 August 2026" → "2026-08-06", "2026-08-06" → same). Vague timing
("ASAP", "weekend or Monday", "this week") is NOT a date — leave the date null
and copy the phrase into notes.

specialHandling: hazardous/handling instructions and clearing responsibilities
(e.g. "Transit clearing for transporter account; exit/entry by exporter/importer").

notes: catch-all for anything meaningful not mapped elsewhere — vague loading
timing, "book to secure slot", capacity questions on a tender, multi-stop summary
if stops can't be structured.

stops (array; [] if single origin→dest): for multi-stop routes, list
intermediate/ordered stops as { "sequence": 1, "stopType": "pickup"|"dropoff",
"address": "...", "country": <code|null> }. Also summarise them in notes so the
admin sees them even without a stops UI.

insuranceRequired: true only if insurance is explicitly required. Else false.

## Shipper matching (shipperId)
Match RAW_MESSAGE against SHIPPING_ENTITIES:
- Strong: a company name or alias from the list appears in the text → use that id,
  shipperMatch.confidence "high".
- Weak: only a phone number matches an entity's phones → confidence "low".
- None: no match, or only a generic broker number with no company named →
  shipperId null, confidence "none".
NEVER output an id not in SHIPPING_ENTITIES. If confidence is "low" or "none", set
job.shipperId to null (the admin will choose). Always fill meta.shipperMatch with
your reasoning.

## Excluding non-loads
Border/customs notices, weighbridge updates, greetings, follower counts, standalone
phone numbers, and shared map links with no cargo are NOT jobs. Add each to
"excluded" as { "reason": "...", "snippet": "first ~80 chars" }. If the whole paste
is noise, return "jobs": [] with the items in "excluded".

## Confidence + meta
For each job set meta.confidence: "high" (route + truck + rate all clear),
"medium" (some core fields inferred/ambiguous), "low" (sparse or messy). List any
assumptions as short strings in meta.warnings and every field left null in
meta.nullFields.`;

/**
 * Parses a pasted broker/WhatsApp message into structured job records.
 * Uses structured outputs (a JSON schema constraint the API enforces) rather than
 * prompting-and-hoping -- the response is guaranteed to parse and every enum field
 * is guaranteed to be one of the values above, so there's no markdown-fence or
 * malformed-JSON handling to write. shipperId is the one thing structured outputs
 * can't constrain (the valid ID set is per-request, not part of the schema), so the
 * caller must still cross-check it against shippingEntities -- see routes.ts.
 */
export async function extractJobsFromText(
  rawMessage: string,
  shippingEntities: ShippingEntityRef[]
): Promise<ExtractionResult> {
  const userMessage = `SHIPPING_ENTITIES:\n${JSON.stringify(shippingEntities)}\n\nRAW_MESSAGE:\n"""\n${rawMessage}\n"""`;

  const response = await getClient().messages.parse({
    // Sonnet is deliberately not the newest/priciest tier here -- this is a
    // single well-specified extraction call, not open-ended agentic work.
    model: 'claude-sonnet-5',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    output_config: {
      format: zodOutputFormat(extractionResultSchema),
    },
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Extraction was declined by the model. Try pasting a smaller portion of the message.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('The paste produced too much output to finish parsing. Try splitting it into smaller batches.');
  }
  if (!response.parsed_output) {
    throw new Error('Failed to parse a structured result from the extraction. Please try again.');
  }

  return response.parsed_output;
}
