import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const CARGO_TYPE_OPTIONS = [
  "general", "refrigerated", "hazardous", "bulk", "containers", "livestock",
  "agricultural", "mining", "construction", "vehicles", "electronics",
  "textiles", "pharmaceuticals", "perishables", "oversized", "liquids",
];
const TRUCK_TYPE_OPTIONS = [
  "tri_axle", "superlink", "link", "tautliner", "flat_deck", "pantech",
  "tanker", "tipper", "lowbed", "reefer", "side_tipper", "other",
];
const COUNTRY_OPTIONS = [
  "AGO", "BWA", "COM", "COD", "SWZ", "LSO", "MDG", "MWI", "MUS", "MOZ",
  "NAM", "SYC", "ZAF", "TZA", "ZMB", "ZWE",
];

interface ExtractedJob {
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

interface ExtractedItem {
  job: ExtractedJob;
  meta: {
    sourceText: string;
    confidence: 'high' | 'medium' | 'low';
    shipperMatch: { shipperId: number | null; matchedName: string | null; confidence: 'high' | 'low' | 'none'; reason: string };
    warnings: string[];
    nullFields: string[];
  };
}

interface ExcludedItem {
  reason: string;
  snippet: string;
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
};

function JobCard({ item, index, shippingEntities, onPosted }: {
  item: ExtractedItem;
  index: number;
  shippingEntities: Array<{ id: number; companyName: string }>;
  onPosted: (index: number) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [job, setJob] = useState<ExtractedJob>(item.job);
  const [posted, setPosted] = useState(false);

  const set = <K extends keyof ExtractedJob>(key: K, value: ExtractedJob[K]) =>
    setJob((prev) => ({ ...prev, [key]: value }));

  const postMutation = useMutation({
    mutationFn: async () => (await apiRequest('POST', '/api/jobs', job)).json(),
    onSuccess: () => {
      toast({ title: "Job posted", description: job.pickupAddress ? `${job.pickupAddress} → ${job.deliveryAddress || '?'}` : undefined });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      setPosted(true);
      onPosted(index);
    },
    onError: (error: Error) => toast({ title: "Failed to post job", description: error.message, variant: "destructive" }),
  });

  return (
    <Card className={posted ? "opacity-60" : ""} data-testid={`extracted-job-${index}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground italic line-clamp-2">"{item.meta.sourceText}"</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {job.jobMode === 'tender' && <Badge variant="outline" className="border-purple-300 text-purple-700">Tender</Badge>}
            <Badge className={CONFIDENCE_STYLE[item.meta.confidence]}>{item.meta.confidence} confidence</Badge>
          </div>
        </div>

        {item.meta.warnings.length > 0 && (
          <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>{item.meta.warnings.join(' · ')}</span>
          </div>
        )}

        <div>
          <Label className="text-xs">Shipping Entity {job.shipperId === null && <span className="text-destructive">(required — {item.meta.shipperMatch.reason})</span>}</Label>
          <Select value={job.shipperId ? String(job.shipperId) : undefined} onValueChange={(v) => set('shipperId', Number(v))}>
            <SelectTrigger data-testid={`extracted-job-shipper-${index}`}><SelectValue placeholder="Select a shipping entity" /></SelectTrigger>
            <SelectContent>
              {shippingEntities.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.companyName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Pickup</Label>
            <Input value={job.pickupAddress || ''} onChange={(e) => set('pickupAddress', e.target.value || null)} data-testid={`extracted-job-pickup-${index}`} />
          </div>
          <div>
            <Label className="text-xs">Delivery</Label>
            <Input value={job.deliveryAddress || ''} onChange={(e) => set('deliveryAddress', e.target.value || null)} data-testid={`extracted-job-delivery-${index}`} />
          </div>
          <div>
            <Label className="text-xs">Pickup Country</Label>
            <Select value={job.pickupCountry || undefined} onValueChange={(v) => set('pickupCountry', v)}>
              <SelectTrigger><SelectValue placeholder="Not stated" /></SelectTrigger>
              <SelectContent>{COUNTRY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Delivery Country</Label>
            <Select value={job.deliveryCountry || undefined} onValueChange={(v) => set('deliveryCountry', v)}>
              <SelectTrigger><SelectValue placeholder="Not stated" /></SelectTrigger>
              <SelectContent>{COUNTRY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cargo Type</Label>
            <Select value={job.cargoType || undefined} onValueChange={(v) => set('cargoType', v)}>
              <SelectTrigger><SelectValue placeholder="Not stated" /></SelectTrigger>
              <SelectContent>{CARGO_TYPE_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Truck Type</Label>
            <Select value={job.truckType || undefined} onValueChange={(v) => set('truckType', v)}>
              <SelectTrigger><SelectValue placeholder="Not stated" /></SelectTrigger>
              <SelectContent>{TRUCK_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Rate</Label>
            <Input type="number" value={job.rateAmount ?? ''} onChange={(e) => set('rateAmount', e.target.value ? Number(e.target.value) : null)} placeholder="Quote on request" />
          </div>
          <div>
            <Label className="text-xs">Rate Basis / Currency</Label>
            <div className="flex gap-2">
              <Select value={job.rateBasis} onValueChange={(v) => set('rateBasis', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['flat', 'per_ton', 'per_km', 'per_load', 'quote'].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="w-20" value={job.rateCurrency || ''} onChange={(e) => set('rateCurrency', e.target.value || null)} placeholder="ZAR" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Payment Terms</Label>
            <Input value={job.paymentTerms || ''} onChange={(e) => set('paymentTerms', e.target.value || null)} />
          </div>
          <div>
            <Label className="text-xs">Job Mode</Label>
            <Select value={job.jobMode} onValueChange={(v) => set('jobMode', v)}>
              <SelectTrigger data-testid={`extracted-job-mode-${index}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed (single load)</SelectItem>
                <SelectItem value="tender">Tender (bidding)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 mt-5">
            <Checkbox checked={job.dieselOnAccount} onCheckedChange={(c) => set('dieselOnAccount', !!c)} />
            <Label className="text-xs font-normal">Diesel on account</Label>
          </div>
        </div>

        {job.jobMode === 'tender' && (
          <div className="grid grid-cols-2 gap-3 text-xs bg-purple-50 border border-purple-200 rounded p-2">
            <div>
              <Label className="text-xs">Total Quantity</Label>
              <Input
                type="number"
                value={job.totalQuantity ?? ''}
                onChange={(e) => set('totalQuantity', e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g. 4000"
                data-testid={`extracted-job-total-quantity-${index}`}
              />
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Input
                value={job.quantityUnit || ''}
                onChange={(e) => set('quantityUnit', e.target.value || null)}
                placeholder="tons / loads"
                data-testid={`extracted-job-quantity-unit-${index}`}
              />
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea className="text-sm" rows={2} value={job.notes || ''} onChange={(e) => set('notes', e.target.value || null)} />
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={posted || !job.shipperId || postMutation.isPending}
            onClick={() => postMutation.mutate()}
            data-testid={`extracted-job-post-${index}`}
          >
            {posted ? <><CheckCircle2 className="h-4 w-4 mr-1" /> Posted</> : postMutation.isPending ? "Posting..." : "Post This Job"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function JobExtractionReview({ shippingEntities }: { shippingEntities: Array<{ id: number; companyName: string }> }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rawMessage, setRawMessage] = useState("");
  const [result, setResult] = useState<{ jobs: ExtractedItem[]; excluded: ExcludedItem[] } | null>(null);

  const parseMutation = useMutation({
    mutationFn: async () => (await apiRequest('POST', '/api/admin/jobs/parse', { rawMessage })).json(),
    onSuccess: (data) => {
      setResult(data);
      // A job with no name/alias match may have been auto-attributed to a newly created
      // account by phone number -- refresh the dropdown so it shows up already selected.
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', 'shipping_entity'] });
      if (data.jobs.length === 0) {
        toast({ title: "No loads found", description: "Nothing extractable — check the excluded items below." });
      } else {
        toast({ title: `Found ${data.jobs.length} job${data.jobs.length === 1 ? '' : 's'}`, description: "Review each before posting." });
      }
    },
    onError: (error: Error) => toast({ title: "Extraction failed", description: error.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5" /> Paste & Parse</h3>
          <p className="text-sm text-muted-foreground">
            Paste a broker/WhatsApp message — one or many loads, mixed with noise. Nothing is posted until you review and confirm each job below.
          </p>
        </div>
        <Textarea
          rows={6}
          value={rawMessage}
          onChange={(e) => setRawMessage(e.target.value)}
          placeholder="Paste the message here..."
          data-testid="textarea-extraction-input"
        />
        <div className="flex justify-end">
          <Button onClick={() => parseMutation.mutate()} disabled={!rawMessage.trim() || parseMutation.isPending} data-testid="button-parse-jobs">
            {parseMutation.isPending ? "Parsing..." : "Parse"}
          </Button>
        </div>

        {result && result.excluded.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Excluded ({result.excluded.length})</p>
            {result.excluded.map((e, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded p-2">
                <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span><span className="italic">"{e.snippet}"</span> — {e.reason}</span>
              </div>
            ))}
          </div>
        )}

        {result && result.jobs.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-medium text-muted-foreground">Extracted Jobs ({result.jobs.length})</p>
            {result.jobs.map((item, i) => (
              <JobCard key={i} item={item} index={i} shippingEntities={shippingEntities} onPosted={() => {}} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
