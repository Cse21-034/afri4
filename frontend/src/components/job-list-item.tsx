import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, MapPin, Calendar, MessageSquare, CheckCircle, Weight, Fuel, Truck, ShieldAlert, Undo2, Pencil, Gavel } from "lucide-react";
import { Link } from "wouter";

interface Job {
  id: number;
  cargoType?: string | null;
  cargoWeight?: number | null;
  cargoVolume?: number | null;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  pickupCountry?: string | null;
  deliveryCountry?: string | null;
  industry?: string | null;
  status: string;
  createdAt: string;
  pickupDate?: string | null;
  deliveryDeadline?: string | null;
  specialHandling?: string;
  insuranceRequired: boolean;
  notes?: string;
  completedAt?: string | null;
  quantity?: number | null;
  distanceKm?: number | null;
  truckType?: string | null;
  truckRequirements?: string[] | null;
  requiresHazmat?: boolean | null;
  requiresTrec?: boolean | null;
  requiresPlacards?: boolean | null;
  permits?: string[] | null;
  rateAmount?: string | null;
  rateBasis?: string | null;
  rateCurrency?: string | null;
  paymentTerms?: string | null;
  dieselOnAccount?: boolean | null;
  jobMode?: string | null;
  totalQuantity?: number | null;
  quantityUnit?: string | null;
}

interface JobListItemProps {
  job: Job;
  userRole: 'trucking_company' | 'shipping_entity';
  onTakeJob?: (jobId: number) => void;
  onCompleteJob?: (jobId: number) => void;
  onReleaseJob?: (jobId: number) => void;
  onEditJob?: (job: Job) => void;
  showManageActions?: boolean;
  isLoading?: boolean;
}

const COUNTRY_NAMES: Record<string, string> = {
  AGO: "Angola", BWA: "Botswana", COM: "Comoros", COD: "DR Congo",
  SWZ: "Eswatini", LSO: "Lesotho", MDG: "Madagascar", MWI: "Malawi",
  MUS: "Mauritius", MOZ: "Mozambique", NAM: "Namibia", SYC: "Seychelles",
  ZAF: "South Africa", TZA: "Tanzania", ZMB: "Zambia", ZWE: "Zimbabwe",
};

const RATE_BASIS_LABELS: Record<string, string> = {
  flat: 'flat', per_ton: '/ton', per_km: '/km', per_load: '/load', quote: 'quote',
};

function getCountryName(code?: string | null) {
  if (!code) return 'Not specified';
  return COUNTRY_NAMES[code] || code;
}

function formatCargoType(type?: string | null) {
  if (!type) return 'Cargo type not specified';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function humanize(value?: string | null) {
  if (!value) return '';
  return value.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRate(job: Job) {
  if (!job.rateAmount || job.rateBasis === 'quote') return 'Rate on request';
  const amount = Number(job.rateAmount).toLocaleString();
  const currency = job.rateCurrency || '';
  const suffix = job.rateBasis && job.rateBasis !== 'flat' ? RATE_BASIS_LABELS[job.rateBasis] : '';
  return `${currency} ${amount}${suffix}`.trim();
}

function getStatusMeta(status: string) {
  switch (status) {
    case 'available':
      return { label: 'Open', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' };
    case 'taken':
      return { label: 'In Progress', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' };
    case 'completed':
      return { label: 'Completed', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' };
  }
}

function BidsPanel({ job }: { job: Job }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bidsQueryKey = [`/api/jobs/${job.id}/bids`];

  const { data, isLoading } = useQuery({
    queryKey: bidsQueryKey,
    queryFn: async () => (await apiRequest('GET', `/api/jobs/${job.id}/bids`)).json(),
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: number; status: 'accepted' | 'rejected' }) =>
      (await apiRequest('PATCH', `/api/jobs/${job.id}/bids/${bidId}`, { status })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bidsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/my'] });
      toast({ title: "Bid updated" });
    },
    onError: (error: Error) => toast({ title: "Failed to update bid", description: error.message, variant: "destructive" }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Loading bids...</p>;

  const bids = data?.bids || [];
  const capacityCovered = data?.capacityCovered || 0;
  const totalQuantity = data?.totalQuantity;

  return (
    <div className="space-y-3">
      {totalQuantity && (
        <p className="text-sm text-muted-foreground">
          {capacityCovered} / {totalQuantity} {job.quantityUnit || 'units'} covered by accepted bids
        </p>
      )}
      {bids.length === 0 && <p className="text-sm text-muted-foreground py-2">No bids yet.</p>}
      {bids.map((bid: any) => (
        <div key={bid.id} className="border border-border rounded-lg p-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {bid.rateAmount ? `${Number(bid.rateAmount).toLocaleString()} ${RATE_BASIS_LABELS[bid.rateBasis] || ''}` : 'No rate given'}
            </span>
            <Badge variant={bid.status === 'accepted' ? 'default' : bid.status === 'rejected' ? 'destructive' : 'secondary'}>
              {bid.status}
            </Badge>
          </div>
          {bid.capacityOffered && <p className="text-muted-foreground">Offering {bid.capacityOffered} {job.quantityUnit || 'units'}</p>}
          {bid.weeklyCapacity && <p className="text-muted-foreground">Weekly capacity: {bid.weeklyCapacity}</p>}
          {bid.message && <p className="text-foreground/80">"{bid.message}"</p>}
          {bid.status === 'pending' && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => decisionMutation.mutate({ bidId: bid.id, status: 'accepted' })} disabled={decisionMutation.isPending}>
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => decisionMutation.mutate({ bidId: bid.id, status: 'rejected' })} disabled={decisionMutation.isPending}>
                Reject
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SubmitBidForm({ job, onDone }: { job: Job; onDone: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rateAmount, setRateAmount] = useState('');
  const [rateBasis, setRateBasis] = useState('per_ton');
  const [capacityOffered, setCapacityOffered] = useState('');
  const [weeklyCapacity, setWeeklyCapacity] = useState('');
  const [message, setMessage] = useState('');

  const bidMutation = useMutation({
    mutationFn: async () => (await apiRequest('POST', `/api/jobs/${job.id}/bids`, {
      rateAmount: rateAmount || undefined,
      rateBasis,
      capacityOffered: capacityOffered ? Number(capacityOffered) : undefined,
      weeklyCapacity: weeklyCapacity ? Number(weeklyCapacity) : undefined,
      message: message || undefined,
    })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({ title: "Bid submitted" });
      onDone();
    },
    onError: (error: Error) => toast({ title: "Failed to submit bid", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3 border border-border rounded-lg p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Your Rate</Label>
          <Input value={rateAmount} onChange={(e) => setRateAmount(e.target.value)} placeholder="e.g. 500" data-testid="input-bid-rate" />
        </div>
        <div>
          <Label className="text-xs">Basis</Label>
          <Select value={rateBasis} onValueChange={setRateBasis}>
            <SelectTrigger data-testid="select-bid-rate-basis"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="per_ton">Per ton</SelectItem>
              <SelectItem value="per_km">Per km</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="per_load">Per load</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Capacity You Can Cover ({job.quantityUnit || 'units'})</Label>
          <Input type="number" value={capacityOffered} onChange={(e) => setCapacityOffered(e.target.value)} data-testid="input-bid-capacity" />
        </div>
        <div>
          <Label className="text-xs">Weekly Capacity</Label>
          <Input type="number" value={weeklyCapacity} onChange={(e) => setWeeklyCapacity(e.target.value)} data-testid="input-bid-weekly-capacity" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Message (optional)</Label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} data-testid="textarea-bid-message" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={() => bidMutation.mutate()} disabled={bidMutation.isPending} data-testid="submit-bid-button">
          {bidMutation.isPending ? "Submitting..." : "Submit Bid"}
        </Button>
      </div>
    </div>
  );
}

export function JobListItem({
  job,
  userRole,
  onTakeJob,
  onCompleteJob,
  onReleaseJob,
  onEditJob,
  showManageActions = false,
  isLoading = false
}: JobListItemProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [bidFormOpen, setBidFormOpen] = useState(false);
  const status = getStatusMeta(job.status);
  const isTender = job.jobMode === 'tender';

  const title = `${formatCargoType(job.cargoType)}${job.cargoWeight ? ` - ${job.cargoWeight}kg` : ''}`;
  const metaParts = [
    job.industry ? job.industry.charAt(0).toUpperCase() + job.industry.slice(1) : null,
    (job.pickupCountry || job.deliveryCountry) ? `${getCountryName(job.pickupCountry)} to ${getCountryName(job.deliveryCountry)}` : null,
    formatDate(job.createdAt),
  ].filter(Boolean);
  const meta = metaParts.join(' · ');
  const snippet = job.notes || job.specialHandling || job.pickupAddress;

  return (
    <>
      <div
        className="flex items-start gap-4 p-4 border border-border rounded-xl hover:shadow-sm transition-shadow bg-card"
        data-testid={`job-item-${job.id}`}
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Package className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-foreground truncate" data-testid="job-title">{title}</h3>
            <div className="flex gap-1.5 flex-shrink-0">
              {isTender && <Badge variant="outline" className="border-purple-300 text-purple-700">Tender</Badge>}
              <Badge className={status.className} data-testid="job-status">{status.label}</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">{meta}</p>
          {snippet && (
            <p className="text-sm text-foreground/80 mt-1.5 line-clamp-1">{snippet}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="secondary" className="font-medium" data-testid="job-rate">{formatRate(job)}</Badge>
            {job.truckType && <Badge variant="outline"><Truck className="h-3 w-3 mr-1" />{humanize(job.truckType)}</Badge>}
            {job.dieselOnAccount && <Badge variant="outline"><Fuel className="h-3 w-3 mr-1" />Diesel on account</Badge>}
            {(job.requiresHazmat || job.requiresTrec || job.requiresPlacards) && (
              <Badge variant="outline" className="border-amber-300 text-amber-700"><ShieldAlert className="h-3 w-3 mr-1" />Compliance required</Badge>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <Weight className="h-4 w-4 text-muted-foreground" />
              {job.cargoWeight ? `${job.cargoWeight}kg` : 'Weight n/a'}{job.cargoVolume ? ` · ${job.cargoVolume}m³` : ''}
            </div>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setDetailsOpen(true)}
              data-testid="view-job-button"
            >
              View
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={(open) => { setDetailsOpen(open); if (!open) setBidFormOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="job-details-dialog">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>{title}</DialogTitle>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="font-semibold text-base" data-testid="job-detail-rate">{formatRate(job)}</p>
              {job.paymentTerms && <p className="text-muted-foreground">Terms: {job.paymentTerms}</p>}
              {job.dieselOnAccount && <p className="text-muted-foreground flex items-center gap-1"><Fuel className="h-3 w-3" /> Diesel on account</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Cargo</p>
                <p className="font-medium">
                  {formatCargoType(job.cargoType)}
                  {job.cargoWeight ? `, ${job.cargoWeight}kg` : ''}
                  {job.cargoVolume ? `, ${job.cargoVolume}m³` : ''}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Industry</p>
                <p className="font-medium capitalize">{job.industry || 'Not specified'}</p>
              </div>
              {job.truckType && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Truck Type</p>
                  <p className="font-medium">{humanize(job.truckType)}</p>
                </div>
              )}
              {job.distanceKm && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Distance</p>
                  <p className="font-medium">{job.distanceKm}km</p>
                </div>
              )}
            </div>

            {job.truckRequirements && job.truckRequirements.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.truckRequirements.map((req) => <Badge key={req} variant="outline">{humanize(req)}</Badge>)}
              </div>
            )}

            {(job.requiresHazmat || job.requiresTrec || job.requiresPlacards || (job.permits && job.permits.length > 0)) && (
              <div>
                <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Compliance</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiresHazmat && <Badge variant="outline" className="border-amber-300 text-amber-700">Hazmat</Badge>}
                  {job.requiresTrec && <Badge variant="outline" className="border-amber-300 text-amber-700">TREC</Badge>}
                  {job.requiresPlacards && <Badge variant="outline" className="border-amber-300 text-amber-700">Placards</Badge>}
                  {job.permits?.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
                </div>
              </div>
            )}

            <div>
              <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Pickup</p>
              <p className="font-medium">{job.pickupAddress || 'Not specified'}{job.pickupCountry ? `, ${getCountryName(job.pickupCountry)}` : ''}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Delivery</p>
              <p className="font-medium">{job.deliveryAddress || 'Not specified'}{job.deliveryCountry ? `, ${getCountryName(job.deliveryCountry)}` : ''}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Pickup Date</p>
                <p className="font-medium">{formatDate(job.pickupDate)}</p>
              </div>
              {job.deliveryDeadline && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Deadline</p>
                  <p className="font-medium">{formatDate(job.deliveryDeadline)}</p>
                </div>
              )}
            </div>

            {job.specialHandling && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Special Handling</p>
                <p className="font-medium">{job.specialHandling}</p>
              </div>
            )}
            {job.insuranceRequired && (
              <Badge variant="outline">Insurance Required</Badge>
            )}
            {job.notes && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Notes</p>
                <p className="font-medium">{job.notes}</p>
              </div>
            )}
            {job.completedAt && (
              <div className="flex items-center gap-1 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>Completed {formatDate(job.completedAt)}</span>
              </div>
            )}

            {isTender && userRole === 'trucking_company' && job.status === 'available' && (
              bidFormOpen ? (
                <SubmitBidForm job={job} onDone={() => setBidFormOpen(false)} />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setBidFormOpen(true)} data-testid="open-bid-form-button">
                  <Gavel className="h-4 w-4 mr-1" /> Submit a Bid
                </Button>
              )
            )}

            {isTender && showManageActions && userRole === 'shipping_entity' && (
              <div>
                <p className="text-muted-foreground text-xs mb-2">Bids</p>
                <BidsPanel job={job} />
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-border">
              {!isTender && userRole === 'trucking_company' && job.status === 'available' && onTakeJob && (
                <Button onClick={() => onTakeJob(job.id)} disabled={isLoading} data-testid="take-job-button">
                  {isLoading ? "Taking..." : "Take Job"}
                </Button>
              )}
              {userRole === 'trucking_company' && job.status === 'taken' && onReleaseJob && (
                <Button variant="outline" onClick={() => onReleaseJob(job.id)} disabled={isLoading} data-testid="release-job-button">
                  <Undo2 className="h-4 w-4 mr-1" />
                  {isLoading ? "Releasing..." : "Release Job"}
                </Button>
              )}
              {showManageActions && job.status === 'available' && userRole === 'shipping_entity' && onEditJob && (
                <Button variant="outline" onClick={() => onEditJob(job)} data-testid="edit-job-button">
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {showManageActions && job.status === 'taken' && userRole === 'shipping_entity' && onCompleteJob && (
                <Button variant="outline" onClick={() => onCompleteJob(job.id)} disabled={isLoading} data-testid="complete-job-button">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {isLoading ? "Completing..." : "Mark Complete"}
                </Button>
              )}
              {(job.status === 'taken' || job.status === 'completed') && (
                <Link href={`/chat/${job.id}`}>
                  <Button variant="outline" data-testid="chat-button">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
