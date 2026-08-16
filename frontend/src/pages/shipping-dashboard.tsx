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
}

const jobSchema = z.object({
  cargoType: z.string().optional(),
  cargoWeight: z.number().optional(),
  cargoVolume: z.number().optional(),
  industry: z.string().optional(),
  pickupAddress: z.string().optional(),
  deliveryAddress: z.string().optional(),
  pickupCountry: z.string().optional(),
  deliveryCountry: z.string().optional(),
  pickupDate: z.string().optional(),
  deliveryDeadline: z.string().optional(),
  specialHandling: z.string().optional(),
  insuranceRequired: z.boolean().default(false),
  notes: z.string().optional(),
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

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      pickupCountry: "BWA",
      deliveryCountry: "BWA",
      insuranceRequired: false,
    },
  });

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
    createJobMutation.mutate(data);
  };

  const handleCompleteJob = (jobId: number) => {
    completeJobMutation.mutate(jobId);
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
              <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="post-job-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="job-dialog">
                  <DialogHeader>
                    <DialogTitle>Post a New Job</DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Cargo Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Cargo Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cargoType">Cargo Type</Label>
                          <Select onValueChange={(value) => form.setValue("cargoType", value)}>
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
                          <Select onValueChange={(value) => form.setValue("industry", value)}>
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
                            <Select onValueChange={(value) => form.setValue("pickupCountry", value)} defaultValue="BWA">
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
                            <Select onValueChange={(value) => form.setValue("deliveryCountry", value)} defaultValue="BWA">
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
                      <Button type="button" variant="outline" onClick={() => setIsJobDialogOpen(false)} data-testid="cancel-job">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        disabled={createJobMutation.isPending}
                        data-testid="publish-job"
                      >
                        {createJobMutation.isPending ? "Publishing..." : "Publish Job"}
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
          <Card className="hidden lg:block" data-testid="job-filter-card">
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
