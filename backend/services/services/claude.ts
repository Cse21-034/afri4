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

const UNKNOWN = 'unknown';
const cargoTypeOrUnknown = [...cargoTypeValues, UNKNOWN] as [string, ...string[]];
const industryOrUnknown = [...industryValues, UNKNOWN] as [string, ...string[]];
const truckTypeOrUnknown = [...truckTypeValues, UNKNOWN] as [string, ...string[]];
const countryOrUnknown = [...countryValues, UNKNOWN] as [string, ...string[]];

// The Messages structured-outputs schema has a hard cap of 16 nullable/union-typed
// parameters per request ("too many parameters with union types... exponential compilation
// cost") -- this extraction naturally wants ~23 nullable fields (almost everything is
// "state it if it's there, else nothing"). Rather than trim what gets extracted, every
// nullable field is represented as a single-type field with a sentinel instead:
// enums get an extra 'unknown' member, free-text strings default to '', numbers default to 0
// (real cargo weight/rate/distance is never legitimately zero). This schema has zero
// nullable/union fields and is what's actually sent to the model. normalizeJob/normalizeMeta
// below convert the sentinels back to real null immediately after parsing, so the rest of the
// app (routes.ts, the review UI) sees exactly the nullable shape it always expected.
const anthropicJobSchema = z.object({
  shipperId: z.number(),
  jobMode: z.enum(jobModeValues),
  cargoType: z.enum(cargoTypeOrUnknown),
  cargoWeight: z.number(),
  cargoVolume: z.number(),
  industry: z.enum(industryOrUnknown),
  pickupAddress: z.string(),
  deliveryAddress: z.string(),
  pickupCountry: z.enum(countryOrUnknown),
  deliveryCountry: z.enum(countryOrUnknown),
  pickupDate: z.string(),
  deliveryDeadline: z.string(),
  truckType: z.enum(truckTypeOrUnknown),
  truckRequirements: z.array(z.string()),
  rateAmount: z.number(),
  rateBasis: z.enum(rateBasisValues),
  rateCurrency: z.string(),
  paymentTerms: z.string(),
  dieselOnAccount: z.boolean(),
  quantity: z.number(),
  totalQuantity: z.number(),
  quantityUnit: z.string(),
  distanceKm: z.number(),
  requiresHazmat: z.boolean(),
  requiresTrec: z.boolean(),
  requiresPlacards: z.boolean(),
  permits: z.array(z.string()),
  insuranceRequired: z.boolean(),
  specialHandling: z.string(),
  notes: z.string(),
  stops: z.array(z.object({
    sequence: z.number(),
    stopType: z.enum(['pickup', 'delivery']),
    address: z.string(),
    country: z.enum(countryOrUnknown),
  })),
});

const anthropicShipperMatchSchema = z.object({
  shipperId: z.number(),
  matchedName: z.string(),
  phoneNumber: z.string(),
  confidence: z.enum(['high', 'low', 'none']),
  reason: z.string(),
});

const anthropicMetaSchema = z.object({
  sourceText: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  shipperMatch: anthropicShipperMatchSchema,
  warnings: z.array(z.string()),
  nullFields: z.array(z.string()),
});

const anthropicExtractionSchema = z.object({
  jobs: z.array(z.object({
    job: anthropicJobSchema,
    meta: anthropicMetaSchema,
  })),
  excluded: z.array(z.object({
    reason: z.string(),
    snippet: z.string(),
  })),
});

type AnthropicJob = z.infer<typeof anthropicJobSchema>;
type AnthropicMeta = z.infer<typeof anthropicMetaSchema>;

// Public shape -- what routes.ts and the frontend actually consume. Same field set as the
// on-the-wire schema above, just with real null instead of sentinels.
export interface ExtractedJob {
  shipperId: number | null;
  jobMode: string;
  cargoType: string | null;
  cargoWeight: number | null;
  cargoVolume: number | null;
  industry: string | null;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  pickupCountry: string | null;
  deliveryCountry: string | null;
  pickupDate: string | null;
  deliveryDeadline: string | null;
  truckType: string | null;
  truckRequirements: string[];
  rateAmount: number | null;
  rateBasis: string;
  rateCurrency: string | null;
  paymentTerms: string | null;
  dieselOnAccount: boolean;
  quantity: number;
  totalQuantity: number | null;
  quantityUnit: string | null;
  distanceKm: number | null;
  requiresHazmat: boolean;
  requiresTrec: boolean;
  requiresPlacards: boolean;
  permits: string[];
  insuranceRequired: boolean;
  specialHandling: string | null;
  notes: string | null;
  stops: Array<{ sequence: number; stopType: string; address: string; country: string | null }>;
}

export interface ExtractionResult {
  jobs: Array<{
    job: ExtractedJob;
    meta: {
      sourceText: string;
      confidence: 'high' | 'medium' | 'low';
      shipperMatch: { shipperId: number | null; matchedName: string | null; phoneNumber: string | null; confidence: 'high' | 'low' | 'none'; reason: string };
      warnings: string[];
      nullFields: string[];
    };
  }>;
  excluded: Array<{ reason: string; snippet: string }>;
}

const numOrNull = (n: number) => (n === 0 ? null : n);
const strOrNull = (s: string) => (s === '' ? null : s);
const enumOrNull = (v: string) => (v === UNKNOWN ? null : v);

function normalizeJob(job: AnthropicJob): ExtractedJob {
  return {
    ...job,
    shipperId: numOrNull(job.shipperId),
    cargoType: enumOrNull(job.cargoType),
    cargoWeight: numOrNull(job.cargoWeight),
    cargoVolume: numOrNull(job.cargoVolume),
    industry: enumOrNull(job.industry),
    pickupAddress: strOrNull(job.pickupAddress),
    deliveryAddress: strOrNull(job.deliveryAddress),
    pickupCountry: enumOrNull(job.pickupCountry),
    deliveryCountry: enumOrNull(job.deliveryCountry),
    pickupDate: strOrNull(job.pickupDate),
    deliveryDeadline: strOrNull(job.deliveryDeadline),
    truckType: enumOrNull(job.truckType),
    rateAmount: numOrNull(job.rateAmount),
    rateCurrency: strOrNull(job.rateCurrency),
    paymentTerms: strOrNull(job.paymentTerms),
    totalQuantity: numOrNull(job.totalQuantity),
    quantityUnit: strOrNull(job.quantityUnit),
    distanceKm: numOrNull(job.distanceKm),
    specialHandling: strOrNull(job.specialHandling),
    notes: strOrNull(job.notes),
    stops: job.stops.map((s) => ({ ...s, country: enumOrNull(s.country) })),
  };
}

function normalizeMeta(meta: AnthropicMeta) {
  return {
    ...meta,
    shipperMatch: {
      ...meta.shipperMatch,
      shipperId: numOrNull(meta.shipperMatch.shipperId),
      matchedName: strOrNull(meta.shipperMatch.matchedName),
      phoneNumber: strOrNull(meta.shipperMatch.phoneNumber),
    },
  };
}

export interface ShippingEntityRef {
  id: number;
  name: string;
  aliases: string[];
  phones: string[];
}

// Adapted from the job-extraction-agent spec -- the spec's version used null for every
// unstated field, which this rewrites to sentinels (see "Not stated" convention below) to
// stay under the Messages API's 16-nullable-parameter schema limit. Everything else is verbatim.
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

## "Not stated" convention
The output schema has no null type -- every field always has a concrete value, and
"this wasn't in the message" is represented by a fixed sentinel per field type:
  - number fields → 0 (a real weight/rate/distance/quantity is never legitimately
    zero, so 0 unambiguously means "not stated")
  - free-text string fields → "" (empty string)
  - enum fields (cargoType, industry, truckType, pickupCountry, deliveryCountry,
    stops[].country) → the literal string "unknown", which is always the last
    allowed value for that field
  - boolean fields → false, array fields → []
Never write the word "null", never invent a value to avoid using the sentinel, and
never use a different placeholder like "N/A" or "not specified" -- the exact
sentinel above, every time a value isn't stated.

## Golden rules
1. EXTRACT ONLY WHAT IS LITERALLY STATED. Never invent, infer, geocode, or guess
   a value the message does not contain -- use the sentinel from the section above
   instead. A city name alone does NOT let you fill its country — only set a
   country if the country name/demonym is written in the text.
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
  Not named → "unknown".

cargoType (pick the single closest; else "unknown"): general, refrigerated,
hazardous, bulk, containers, livestock, agricultural, mining, construction,
vehicles, electronics, textiles, pharmaceuticals, perishables, oversized, liquids.
Guidance: acids/chemicals→hazardous; fertilizer→agricultural; poles/planks/
timber→construction; granite/stone→construction; ore/coal→mining;
fuel/oil→liquids. If a load is both hazardous and liquid, choose hazardous.

industry (else "unknown"): agriculture, manufacturing, retail, mining, logistics,
construction.

cargoWeight (kg, integer) / cargoVolume (m³): only if a number is stated. Convert
tons to kg (1 ton = 1000 kg) for cargoWeight ONLY on fixed single-load jobs. For
tenders, leave cargoWeight 0 and use totalQuantity/quantityUnit instead.

truckType (else "unknown"): tri_axle, superlink, link, tautliner, flat_deck,
pantech, tanker, tipper, lowbed, reefer, side_tipper, other.
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
- "please quote / enquire / rate?" (price not stated, single load or a
  tender) → rateAmount 0, rateBasis "quote".
- Currency: "R"→ZAR, "USD/$"→USD, "K"(Kwacha)→ZMW/MWK only if unambiguous, else
  ZAR default when an "R" figure is present; "" if no figure at all.
rateBasis enum: flat, per_ton, per_km, per_load, quote.

paymentTerms: capture the phrase verbatim if present — "COD", "30 days",
"15th and month-end on ePOD", "50/50". Else "".

dieselOnAccount: true only if the text says diesel is available/on account. Else
false.

quantity: number of identical loads for a fixed job (default 1). "2 loads" → 2.

jobMode + tender fields:
Set jobMode "tender" ONLY for a genuine capacity/allocation tender: the message
states a bulk total quantity (tonnage/loads) that needs to be split or allocated
across multiple transporters over a period, and is asking for rates/available
capacity rather than confirming one load — signals: a stated total tonnage or
load count PLUS "per month/week", "how much of the allocation you can
complete", "available weekly capacity", "period required", "rate & availability
request" against that bulk quantity. When jobMode is "tender", totalQuantity
MUST be the real stated total (never 0) with quantityUnit ("tons" or "loads").

A single load / single truck job with just an unstated price ("please quote",
"how much?", "rate?", "enquire") is jobMode "fixed", NOT a tender — an
unspecified price alone is never a tender signal. For these: rateBasis "quote",
rateAmount 0, totalQuantity 0, quantityUnit "".

Compliance (only when stated; else false / []):
- requiresHazmat: true if hazardous cargo or "hazmat-compliant" is mentioned.
- requiresTrec: true if "TREC" is mentioned.
- requiresPlacards: true if "placards"/"Hazchem placards" mentioned.
- permits: array of named permits/docs, e.g. ["RIT","Agri Permit","MPR Manifest"].

distanceKm: integer if a distance is stated ("200km" → 200). Else 0.

pickupDate / deliveryDeadline: ISO 8601 ONLY when a concrete date is given
("Thursday 6 August 2026" → "2026-08-06", "2026-08-06" → same). Vague timing
("ASAP", "weekend or Monday", "this week") is NOT a date — leave the date ""
and copy the phrase into notes.

specialHandling: hazardous/handling instructions and clearing responsibilities
(e.g. "Transit clearing for transporter account; exit/entry by exporter/importer").

notes: catch-all for anything meaningful not mapped elsewhere — vague loading
timing, "book to secure slot", capacity questions on a tender, multi-stop summary
if stops can't be structured.

stops (array; [] if single origin→dest): for multi-stop routes, list
intermediate/ordered stops as { "sequence": 1, "stopType": "pickup"|"delivery",
"address": "...", "country": <code|"unknown"> }. Also summarise them in notes so
the admin sees them even without a stops UI.

insuranceRequired: true only if insurance is explicitly required. Else false.

## Shipper matching (shipperId)
Match RAW_MESSAGE against SHIPPING_ENTITIES:
- Strong: a company name or alias from the list appears in the text → use that id,
  shipperMatch.confidence "high".
- Weak: only a phone number matches an entity's phones → confidence "low".
- None: no match, or only a generic broker number with no company named →
  shipperId 0, confidence "none".
NEVER output an id not in SHIPPING_ENTITIES. If confidence is "low" or "none", set
job.shipperId to 0 (the app will look up or create an account by phone number).
Always fill meta.shipperMatch with your reasoning.

shipperMatch.phoneNumber: the contact phone number for this load, exactly as it
appears in the text (digits, spaces, dashes, "+", parentheses all fine — don't
reformat it). This is independent of whether it matched a SHIPPING_ENTITIES
phone — extract it whenever one is written, even on a "none" match, since it's
how a new account gets created for a shipper who isn't in the system yet.
If the message contains SEVERAL loads but only ONE phone number overall (a
single WhatsApp/broker paste with one sender's contact, usually at the very
end), that phone number belongs to every load in the paste, not just the one
physically closest to it — repeat it on each job's shipperMatch.phoneNumber.
Only leave it "" when no phone number appears anywhere in the message at all.

## Excluding non-loads
Border/customs notices, weighbridge updates, greetings, follower counts, standalone
phone numbers, and shared map links with no cargo are NOT jobs. Add each to
"excluded" as { "reason": "...", "snippet": "first ~80 chars" }. If the whole paste
is noise, return "jobs": [] with the items in "excluded".

## Confidence + meta
For each job set meta.confidence: "high" (route + truck + rate all clear),
"medium" (some core fields inferred/ambiguous), "low" (sparse or messy). List any
assumptions as short strings in meta.warnings and every field left at its "not
stated" sentinel in meta.nullFields (name the field, e.g. "cargoWeight").`;

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
    // Extraction against a fixed schema doesn't benefit from extended reasoning, and thinking
    // is on by default on Sonnet 5 if left unset -- disabling it is most of the ~29s → faster
    // latency win. The usual failure modes of disabled thinking (a tool call written as plain
    // text, <thinking> tags leaking into the response) don't apply here: output_config.format
    // constrains the response to the JSON schema itself, there's no free-text escape hatch for
    // either to leak into.
    thinking: { type: 'disabled' },
    output_config: {
      effort: 'low',
      // anthropicExtractionSchema, not the nullable ExtractionResult shape -- the Messages
      // structured-outputs schema caps nullable/union-typed parameters at 16, and this
      // extraction wants ~23. See the sentinel-based schema comment above.
      format: zodOutputFormat(anthropicExtractionSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
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

  return {
    jobs: response.parsed_output.jobs.map((item) => ({
      job: normalizeJob(item.job),
      meta: normalizeMeta(item.meta),
    })),
    excluded: response.parsed_output.excluded,
  };
}
