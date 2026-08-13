import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, MapPin, Calendar, MessageSquare, CheckCircle, Weight } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

interface Job {
  id: number;
  cargoType: string;
  cargoWeight: number;
  cargoVolume?: number;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCountry: string;
  deliveryCountry: string;
  industry: string;
  status: string;
  createdAt: string;
  pickupDate: string;
  deliveryDeadline?: string | null;
  specialHandling?: string;
  insuranceRequired?: boolean;
  notes?: string;
  completedAt?: string | null;
}

interface JobListItemProps {
  job: Job;
  userRole: 'trucking_company' | 'shipping_entity';
  onTakeJob?: (jobId: number) => void;
  onCompleteJob?: (jobId: number) => void;
  showManageActions?: boolean;
  isLoading?: boolean;
}

const COUNTRY_NAMES: Record<string, string> = {
  AGO: "Angola", BWA: "Botswana", COM: "Comoros", COD: "DR Congo",
  SWZ: "Eswatini", LSO: "Lesotho", MDG: "Madagascar", MWI: "Malawi",
  MUS: "Mauritius", MOZ: "Mozambique", NAM: "Namibia", SYC: "Seychelles",
  ZAF: "South Africa", TZA: "Tanzania", ZMB: "Zambia", ZWE: "Zimbabwe",
};

function getCountryName(code: string) {
  return COUNTRY_NAMES[code] || code;
}

function formatCargoType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusMeta(status: string) {
  switch (status) {
    case 'available':
      return { label: 'Open', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' };
    case 'taken':
      return { label: 'In Progress', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' };
    case 'completed':
      return { label: 'Completed', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' };
  }
}

export function JobListItem({
  job,
  userRole,
  onTakeJob,
  onCompleteJob,
  showManageActions = false,
  isLoading = false
}: JobListItemProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const status = getStatusMeta(job.status);

  const title = `${formatCargoType(job.cargoType)} Shipment - ${job.cargoWeight}kg`;
  const meta = `${job.industry.charAt(0).toUpperCase() + job.industry.slice(1)} · ${getCountryName(job.pickupCountry)} to ${getCountryName(job.deliveryCountry)} · ${formatDate(job.createdAt)}`;
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
            <Badge className={`flex-shrink-0 ${status.className}`} data-testid="job-status">{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">{meta}</p>
          {snippet && (
            <p className="text-sm text-foreground/80 mt-1.5 line-clamp-1">{snippet}</p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <Weight className="h-4 w-4 text-muted-foreground" />
              {job.cargoWeight}kg{job.cargoVolume ? ` · ${job.cargoVolume}m³` : ''}
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg" data-testid="job-details-dialog">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>{title}</DialogTitle>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Cargo</p>
                <p className="font-medium">{formatCargoType(job.cargoType)}, {job.cargoWeight}kg{job.cargoVolume ? `, ${job.cargoVolume}m³` : ''}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Industry</p>
                <p className="font-medium capitalize">{job.industry}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Pickup</p>
              <p className="font-medium">{job.pickupAddress}, {getCountryName(job.pickupCountry)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Delivery</p>
              <p className="font-medium">{job.deliveryAddress}, {getCountryName(job.deliveryCountry)}</p>
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

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              {userRole === 'trucking_company' && job.status === 'available' && onTakeJob && (
                <Button onClick={() => onTakeJob(job.id)} disabled={isLoading} data-testid="take-job-button">
                  {isLoading ? "Taking..." : "Take Job"}
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
