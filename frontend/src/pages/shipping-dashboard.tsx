// Updated frontend/src/pages/shipping-dashboard.tsx
// This adds all cargo types and SADC countries to job posting

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { JobListItem } from "@/components/job-list-item";
import { AdvisoriesCard } from "@/components/advisories-card";
import Navbar from "@/components/ui/navbar";
import { Plus, ShipIcon, Package, Search, User as UserIcon, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UPDATED: All cargo types from registration
const CARGO_TYPES = [
  { value: "general", label: "General Cargo" },
  { value: "refrigerated", label: "Refrigerated Goods" },
  { value: "hazardous", label: "Hazardous Materials" },
  { value: "bulk", label: "Bulk Cargo" },
  { value: "containers", label: "Containers (20ft/40ft)" },
  { value: "livestock", label: "Livestock" },
  { value: "agricultural", label: "Agricultural Products" },
  { value: "mining", label: "Mining Equipment & Minerals" },
  { value: "construction", label: "Construction Materials" },
  { value: "vehicles", label: "Vehicles & Machinery" },
  { value: "electronics", label: "Electronics" },
  { value: "textiles", label: "Textiles & Clothing" },
  { value: "pharmaceuticals", label: "Pharmaceuticals" },
  { value: "perishables", label: "Perishable Goods" },
  { value: "oversized", label: "Oversized/Heavy Machinery" },
  { value: "liquids", label: "Liquids/Tanker" },
];

// UPDATED: All SADC countries
const SADC_COUNTRIES = [
  { value: "AGO", label: "Angola" },
  { value: "BWA", label: "Botswana" },
  { value: "COM", label: "Comoros" },
  { value: "COD", label: "Democratic Republic of Congo" },
  { value: "SWZ", label: "Eswatini" },
  { value: "LSO", label: "Lesotho" },
  { value: "MDG", label: "Madagascar" },
  { value: "MWI", label: "Malawi" },
  { value: "MUS", label: "Mauritius" },
  { value: "MOZ", label: "Mozambique" },
  { value: "NAM", label: "Namibia" },
  { value: "SYC", label: "Seychelles" },
  { value: "ZAF", label: "South Africa" },
  { value: "TZA", label: "Tanzania" },
  { value: "ZMB", label: "Zambia" },
  { value: "ZWE", label: "Zimbabwe" },
];

const statusFilterOptions = [
  { key: 'all', label: 'All Jobs' },
  { key: 'available', label: 'Available' },
  { key: 'taken', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
] as const;

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

const TRUCK_TYPES = [
  { value: "tri_axle", label: "Tri-Axle" },
  { value: "superlink", label: "Superlink" },
  { value: "link", label: "Link" },
  { value: "tautliner", label: "Tautliner" },
  { value: "flat_deck", label: "Flat Deck" },
  { value: "pantech", label: "Pantech" },
  { value: "tanker", label: "Tanker" },
  { value: "tipper", label: "Tipper" },
  { value: "lowbed", label: "Lowbed" },
  { value: "reefer", label: "Reefer" },
  { value: "side_tipper", label: "Side Tipper" },
  { value: "other", label: "Other" },
];

const CURRENCIES = ["ZAR", "BWP", "USD", "ZMW", "NAD", "MZN"];

const jobSchema = z.object({
  cargoType: z.string().optional(),
  cargoWeight: z.number().optional(),
  cargoVolume: z.number().optional(),
  industry: z.string().optional(),
  quantity: z.number().optional(),
  pickupAddress: z.string().optional(),
  deliveryAddress: z.string().optional(),
  pickupCountry: z.string().optional(),
  deliveryCountry: z.string().optional(),
  distanceKm: z.number().optional(),
  pickupDate: z.string().optional(),
  deliveryDeadline: z.string().optional(),
  specialHandling: z.string().optional(),
  insuranceRequired: z.boolean().default(false),
  notes: z.string().optional(),
  truckType: z.string().optional(),
  requiresHazmat: z.boolean().default(false),
  requiresTrec: z.boolean().default(false),
  requiresPlacards: z.boolean().default(false),
  rateAmount: z.string().optional(),
  rateBasis: z.string().default("flat"),
  rateCurrency: z.string().optional(),
  paymentTerms: z.string().optional(),
  dieselOnAccount: z.boolean().default(false),
  jobMode: z.string().default("fixed"),
  totalQuantity: z.number().optional(),
  quantityUnit: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function ShippingDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { onNewMessage } = useWebSocket();
  
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "taken" | "completed">("all");
  const [editingJobId, setEditingJobId] = useState<number | null>(null);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      pickupCountry: "BWA",
      deliveryCountry: "BWA",
      insuranceRequired: false,
      rateBasis: "flat",
      jobMode: "fixed",
      requiresHazmat: false,
      requiresTrec: false,
      requiresPlacards: false,
      dieselOnAccount: false,
    },
  });

  const jobModeWatch = form.watch("jobMode");

  // Fetch user's jobs
  const { data: myJobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs/my'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/jobs/my');
      return response.json();
    }
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: JobFormData) => {
      const response = await apiRequest('POST', '/api/jobs', jobData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/my'] });
      toast({
        title: "Success",
        description: "Job posted successfully!",
      });
      setIsJobDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Edit job mutation -- only works while the job is still 'available' (enforced server-side)
  const editJobMutation = useMutation({
    mutationFn: async ({ id, jobData }: { id: number; jobData: JobFormData }) => {
      const response = await apiRequest('PATCH', `/api/jobs/${id}`, jobData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/my'] });
      toast({
        title: "Success",
        description: "Job updated successfully!",
      });
      setIsJobDialogOpen(false);
      setEditingJobId(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiRequest('PATCH', `/api/jobs/${jobId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/my'] });
      toast({
        title: "Success",
        description: "Job marked as completed!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // WebSocket listeners
  useEffect(() => {
    onNewMessage(() => {
      toast({
        title: "New Message",
        description: "You have received a new message.",
      });
    });
  }, [onNewMessage, toast]);

  const onSubmit = (data: JobFormData) => {
    if (editingJobId) {
      editJobMutation.mutate({ id: editingJobId, jobData: data });
    } else {
      createJobMutation.mutate(data);
    }
  };

  const handleCompleteJob = (jobId: number) => {
    completeJobMutation.mutate(jobId);
  };

  const handleEditJob = (job: Job) => {
    setEditingJobId(job.id);
    form.reset({
      cargoType: job.cargoType || undefined,
      cargoWeight: job.cargoWeight || undefined,
      cargoVolume: job.cargoVolume || undefined,
      industry: job.industry || undefined,
      pickupAddress: job.pickupAddress || undefined,
      deliveryAddress: job.deliveryAddress || undefined,
      pickupCountry: job.pickupCountry || "BWA",
      deliveryCountry: job.deliveryCountry || "BWA",
      distanceKm: job.distanceKm || undefined,
      pickupDate: job.pickupDate ? job.pickupDate.slice(0, 10) : undefined,
      deliveryDeadline: job.deliveryDeadline ? job.deliveryDeadline.slice(0, 10) : undefined,
      specialHandling: job.specialHandling || undefined,
      insuranceRequired: job.insuranceRequired || false,
      notes: job.notes || undefined,
      truckType: job.truckType || undefined,
      requiresHazmat: job.requiresHazmat || false,
      requiresTrec: job.requiresTrec || false,
      requiresPlacards: job.requiresPlacards || false,
      rateAmount: job.rateAmount || undefined,
      rateBasis: job.rateBasis || "flat",
      rateCurrency: job.rateCurrency || undefined,
      paymentTerms: job.paymentTerms || undefined,
      dieselOnAccount: job.dieselOnAccount || false,
      jobMode: job.jobMode || "fixed",
      totalQuantity: job.totalQuantity || undefined,
      quantityUnit: job.quantityUnit || undefined,
    });
    setIsJobDialogOpen(true);
  };

  const handleJobDialogChange = (open: boolean) => {
    setIsJobDialogOpen(open);
    if (!open) {
      setEditingJobId(null);
      form.reset({
        pickupCountry: "BWA",
        deliveryCountry: "BWA",
        insuranceRequired: false,
        rateBasis: "flat",
        jobMode: "fixed",
        requiresHazmat: false,
        requiresTrec: false,
        requiresPlacards: false,
        dieselOnAccount: false,
      });
    }
  };

  if (!user || user.role !== 'shipping_entity') {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized</div>;
  }

  const allJobs: Job[] = myJobsData?.jobs || [];
  const statusCounts = {
    all: allJobs.length,
    available: allJobs.filter((j) => j.status === 'available').length,
    taken: allJobs.filter((j) => j.status === 'taken').length,
    completed: allJobs.filter((j) => j.status === 'completed').length,
  };

  const displayedJobs = allJobs
    .filter((job) => statusFilter === 'all' || job.status === statusFilter)
    .filter((job) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        job.cargoType?.toLowerCase().includes(q) ||
        job.pickupAddress?.toLowerCase().includes(q) ||
        job.deliveryAddress?.toLowerCase().includes(q) ||
        job.notes?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? -diff : diff;
    });

  return (
    <div className="min-h-screen bg-background" data-testid="shipping-dashboard">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-6 items-start">
          {/* Left: Profile Card (desktop only -- mobile keeps just the job list; profile is reachable via the navbar) */}
          <Card className="hidden lg:block" data-testid="profile-card">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <ShipIcon className="text-secondary-foreground h-8 w-8" />
              </div>
              <h2 className="font-bold text-foreground" data-testid="company-name">{user.companyName}</h2>
              <p className="text-sm text-muted-foreground mb-4">Shipping Entity</p>
              <Link href="/profile">
                <Button variant="outline" className="w-full mb-3" data-testid="edit-profile-button">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              <Dialog open={isJobDialogOpen} onOpenChange={handleJobDialogChange}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="post-job-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="job-dialog">
                  <DialogHeader>
                    <DialogTitle>{editingJobId ? 'Edit Job' : 'Post a New Job'}</DialogTitle>
                  </DialogHeader>

                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Job Mode */}
                    {!editingJobId && (
                      <div>
                        <Label className="text-base font-medium mb-2 block">Posting Type</Label>
                        <Select value={jobModeWatch} onValueChange={(value) => form.setValue("jobMode", value)}>
                          <SelectTrigger data-testid="select-job-mode">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed load -- one carrier takes the whole job</SelectItem>
                            <SelectItem value="tender">Tender -- bulk load, many carriers bid on portions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {jobModeWatch === 'tender' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div>
                          <Label htmlFor="totalQuantity">Total Quantity</Label>
                          <Input
                            id="totalQuantity"
                            type="number"
                            {...form.register("totalQuantity", { valueAsNumber: true })}
                            placeholder="e.g. 4000"
                            data-testid="input-total-quantity"
                          />
                        </div>
                        <div>
                          <Label htmlFor="quantityUnit">Unit</Label>
                          <Input
                            id="quantityUnit"
                            {...form.register("quantityUnit")}
                            placeholder="e.g. tons"
                            data-testid="input-quantity-unit"
                          />
                        </div>
                      </div>
                    )}

                    {/* Commerce */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Rate & Payment</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="rateAmount">Rate</Label>
                          <Input
                            id="rateAmount"
                            {...form.register("rateAmount")}
                            placeholder="Leave blank for 'quote on request'"
                            data-testid="input-rate-amount"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rateBasis">Rate Basis</Label>
                          <Select value={form.watch("rateBasis")} onValueChange={(value) => form.setValue("rateBasis", value)}>
                            <SelectTrigger data-testid="select-rate-basis"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flat">Flat</SelectItem>
                              <SelectItem value="per_ton">Per ton</SelectItem>
                              <SelectItem value="per_km">Per km</SelectItem>
                              <SelectItem value="per_load">Per load</SelectItem>
                              <SelectItem value="quote">Quote on request</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="rateCurrency">Currency</Label>
                          <Select value={form.watch("rateCurrency")} onValueChange={(value) => form.setValue("rateCurrency", value)}>
                            <SelectTrigger data-testid="select-rate-currency"><SelectValue placeholder="Select currency" /></SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label htmlFor="paymentTerms">Payment Terms</Label>
                          <Input
                            id="paymentTerms"
                            {...form.register("paymentTerms")}
                            placeholder='e.g. "COD", "30 days", "15th & month-end ePOD"'
                            data-testid="input-payment-terms"
                          />
                        </div>
                        <div className="flex items-center space-x-2 mt-6">
                          <Checkbox
                            id="dieselOnAccount"
                            checked={form.watch("dieselOnAccount")}
                            onCheckedChange={(checked) => form.setValue("dieselOnAccount", !!checked)}
                            data-testid="checkbox-diesel-on-account"
                          />
                          <Label htmlFor="dieselOnAccount" className="text-sm font-normal">Diesel on account</Label>
                        </div>
                      </div>
                    </div>

                    {/* Equipment */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Equipment</h3>
                      <div>
                        <Label htmlFor="truckType">Truck Type</Label>
                        <Select value={form.watch("truckType")} onValueChange={(value) => form.setValue("truckType", value)}>
                          <SelectTrigger data-testid="select-truck-type"><SelectValue placeholder="Select truck type" /></SelectTrigger>
                          <SelectContent>
                            {TRUCK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Compliance */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Compliance</h3>
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="requiresHazmat"
                            checked={form.watch("requiresHazmat")}
                            onCheckedChange={(checked) => form.setValue("requiresHazmat", !!checked)}
                            data-testid="checkbox-requires-hazmat"
                          />
                          <Label htmlFor="requiresHazmat" className="text-sm font-normal">Hazmat certified required</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="requiresTrec"
                            checked={form.watch("requiresTrec")}
                            onCheckedChange={(checked) => form.setValue("requiresTrec", !!checked)}
                            data-testid="checkbox-requires-trec"
                          />
                          <Label htmlFor="requiresTrec" className="text-sm font-normal">TREC card required</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="requiresPlacards"
                            checked={form.watch("requiresPlacards")}
                            onCheckedChange={(checked) => form.setValue("requiresPlacards", !!checked)}
                            data-testid="checkbox-requires-placards"
                          />
                          <Label htmlFor="requiresPlacards" className="text-sm font-normal">Placards required</Label>
                        </div>
                      </div>
                    </div>
                    {/* Cargo Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Cargo Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cargoType">Cargo Type</Label>
                          <Select onValueChange={(value) => form.setValue("cargoType", value)} value={form.watch("cargoType") || undefined}>
                            <SelectTrigger data-testid="select-cargo-type">
                              <SelectValue placeholder="Select cargo type" />
                            </SelectTrigger>
                            <SelectContent>
                              {CARGO_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.cargoType && (
                            <p className="text-destructive text-sm mt-1">{form.formState.errors.cargoType.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="industry">Industry</Label>
                          <Select onValueChange={(value) => form.setValue("industry", value)} value={form.watch("industry") || undefined}>
                            <SelectTrigger data-testid="select-industry">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agriculture">Agriculture</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="mining">Mining</SelectItem>
                              <SelectItem value="logistics">Logistics</SelectItem>
                              <SelectItem value="construction">Construction</SelectItem>
                            </SelectContent>
                          </Select>
                          {form.formState.errors.industry && (
                            <p className="text-destructive text-sm mt-1">{form.formState.errors.industry.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            {...form.register("cargoWeight", { valueAsNumber: true })}
                            data-testid="input-weight"
                          />
                          {form.formState.errors.cargoWeight && (
                            <p className="text-destructive text-sm mt-1">{form.formState.errors.cargoWeight.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="volume">Volume (m³)</Label>
                          <Input
                            id="volume"
                            type="number"
                            step="0.1"
                            {...form.register("cargoVolume", { valueAsNumber: true })}
                            data-testid="input-volume"
                          />
                          {form.formState.errors.cargoVolume && (
                            <p className="text-destructive text-sm mt-1">{form.formState.errors.cargoVolume.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Location & Schedule</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="pickupCountry">Pickup Country</Label>
                            <Select onValueChange={(value) => form.setValue("pickupCountry", value)} value={form.watch("pickupCountry")}>
                              <SelectTrigger data-testid="select-pickup-country">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SADC_COUNTRIES.map((country) => (
                                  <SelectItem key={country.value} value={country.value}>
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="deliveryCountry">Delivery Country</Label>
                            <Select onValueChange={(value) => form.setValue("deliveryCountry", value)} value={form.watch("deliveryCountry")}>
                              <SelectTrigger data-testid="select-delivery-country">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SADC_COUNTRIES.map((country) => (
                                  <SelectItem key={country.value} value={country.value}>
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="pickupAddress">Pickup Address</Label>
                          <Textarea
                            id="pickupAddress"
                            {...form.register("pickupAddress")}
                            placeholder="Enter full pickup address"
                            data-testid="textarea-pickup-address"
                          />
                          {form.formState.errors.pickupAddress && (
                            <p className="text-destructive text-sm mt-1">{form.formState.errors.pickupAddress.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="deliveryAddress">Delivery Address</Label>
                          <Textarea
                            id="deliveryAddress"
                            {...form.register("deliveryAddress")}
                            placeholder="Enter full delivery address"
                            data-testid="textarea-delivery-address"
                          />
                          {form.formState.errors.deliveryAddress && (
                            <p className="text-destructive text-sm mt-1">{form.formState.errors.deliveryAddress.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="distanceKm">Distance (km, optional)</Label>
                          <Input
                            id="distanceKm"
                            type="number"
                            {...form.register("distanceKm", { valueAsNumber: true })}
                            data-testid="input-distance-km"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="pickupDate">Pickup Date</Label>
                            <Input
                              id="pickupDate"
                              type="date"
                              {...form.register("pickupDate")}
                              data-testid="input-pickup-date"
                            />
                            {form.formState.errors.pickupDate && (
                              <p className="text-destructive text-sm mt-1">{form.formState.errors.pickupDate.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="deliveryDeadline">Delivery Deadline</Label>
                            <Input
                              id="deliveryDeadline"
                              type="date"
                              {...form.register("deliveryDeadline")}
                              data-testid="input-delivery-deadline"
                            />
                            {form.formState.errors.deliveryDeadline && (
                              <p className="text-destructive text-sm mt-1">{form.formState.errors.deliveryDeadline.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Requirements</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="specialHandling">Special Handling Requirements</Label>
                          <Textarea
                            id="specialHandling"
                            {...form.register("specialHandling")}
                            placeholder="Special permits, temperature control, etc."
                            data-testid="textarea-special-handling"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="insuranceRequired"
                            onCheckedChange={(checked) => form.setValue("insuranceRequired", !!checked)}
                            data-testid="checkbox-insurance"
                          />
                          <Label htmlFor="insuranceRequired" className="text-sm">
                            Insurance Required
                          </Label>
                          <span className="text-xs text-muted-foreground ml-2">
                            (LoadX Africa does not provide insurance. You must arrange coverage directly with external providers.)
                          </span>
                        </div>

                        <div>
                          <Label htmlFor="notes">Additional Notes</Label>
                          <Textarea
                            id="notes"
                            {...form.register("notes")}
                            placeholder="Any additional information for carriers"
                            data-testid="textarea-notes"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="outline" onClick={() => handleJobDialogChange(false)} data-testid="cancel-job">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        disabled={createJobMutation.isPending || editJobMutation.isPending}
                        data-testid="publish-job"
                      >
                        {editingJobId
                          ? (editJobMutation.isPending ? "Saving..." : "Save Changes")
                          : (createJobMutation.isPending ? "Publishing..." : "Publish Job")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Middle: My Jobs List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">My Jobs</h1>
              <Badge variant="secondary" data-testid="jobs-found-count">{displayedJobs.length} jobs found</Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your jobs..."
                  className="pl-9 bg-card"
                  data-testid="job-search"
                />
              </div>
              <div className="flex gap-3">
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
                  <SelectTrigger className="flex-1 sm:w-40 sm:flex-none bg-card" data-testid="sort-order">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden flex-shrink-0 bg-card"
                  onClick={() => setIsFilterOpen(true)}
                  data-testid="open-filters-button"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {jobsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : displayedJobs.length > 0 ? (
                displayedJobs.map((job) => (
                  <JobListItem
                    key={job.id}
                    job={job}
                    userRole="shipping_entity"
                    onCompleteJob={handleCompleteJob}
                    onEditJob={handleEditJob}
                    showManageActions={true}
                    isLoading={completeJobMutation.isPending}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">
                      {allJobs.length === 0 ? "No jobs yet" : "No matching jobs"}
                    </h4>
                    <p className="text-muted-foreground mb-4">
                      {allJobs.length === 0
                        ? "Post your first job to start connecting with carriers."
                        : "Try a different search or filter."}
                    </p>
                    {allJobs.length === 0 && (
                      <Button onClick={() => setIsJobDialogOpen(true)} data-testid="post-first-job">
                        Post Your First Job
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right: Job Filter (desktop only -- mobile uses the Sheet drawer below) */}
          <div className="hidden lg:flex lg:flex-col gap-6">
            <Card data-testid="job-filter-card">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-3 text-primary">Status</h3>
                <div className="space-y-1 text-sm">
                  {statusFilterOptions.map((option) => (
                    <div
                      key={option.key}
                      className="flex items-center justify-between cursor-pointer py-1.5 px-1 rounded hover:bg-muted/50"
                      onClick={() => setStatusFilter(option.key)}
                      data-testid={`status-filter-${option.key}`}
                    >
                      <span className="flex items-center gap-2">
                        <Checkbox
                          checked={statusFilter === option.key}
                          onCheckedChange={() => setStatusFilter(option.key)}
                        />
                        {option.label}
                      </span>
                      <span className="text-muted-foreground">{statusCounts[option.key]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <AdvisoriesCard />
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="w-80" data-testid="filter-drawer">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <h3 className="font-semibold text-sm mb-3 text-primary">Status</h3>
            <div className="space-y-1 text-sm">
              {statusFilterOptions.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center justify-between cursor-pointer py-2 px-1 rounded hover:bg-muted/50"
                  onClick={() => setStatusFilter(option.key)}
                  data-testid={`mobile-status-filter-${option.key}`}
                >
                  <span className="flex items-center gap-2">
                    <Checkbox
                      checked={statusFilter === option.key}
                      onCheckedChange={() => setStatusFilter(option.key)}
                    />
                    {option.label}
                  </span>
                  <span className="text-muted-foreground">{statusCounts[option.key]}</span>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating "Post a Job" button (mobile only -- desktop uses the profile card button) */}
      <Button
        className="lg:hidden fixed right-6 bottom-20 md:bottom-6 z-40 h-14 w-14 rounded-full p-0 shadow-lg bg-secondary text-secondary-foreground hover:bg-secondary/90"
        onClick={() => setIsJobDialogOpen(true)}
        data-testid="post-job-fab"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
