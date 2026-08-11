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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { JobCard } from "@/components/job-card";
import Navbar from "@/components/ui/navbar";
import { Plus, ShipIcon, MessageSquare, BarChart3, Package } from "lucide-react";
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

interface Job {
  id: number;
  cargoType: string;
  cargoWeight: number;
  cargoVolume: number;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCountry: string;
  deliveryCountry: string;
  industry: string;
  status: string;
  createdAt: string;
  pickupDate: string;
  deliveryDeadline: string;
  specialHandling?: string;
  insuranceRequired: boolean;
  notes?: string;
}

const jobSchema = z.object({
  cargoType: z.string().min(1, "Cargo type is required"),
  cargoWeight: z.number().min(1, "Weight must be greater than 0"),
  cargoVolume: z.number().min(1, "Volume must be greater than 0"),
  industry: z.string().min(1, "Industry is required"),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  pickupCountry: z.string().min(1, "Pickup country is required"),
  deliveryCountry: z.string().min(1, "Delivery country is required"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  deliveryDeadline: z.string().min(1, "Delivery deadline is required"),
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
  
  const [activeTab, setActiveTab] = useState("jobs");
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);

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

  const activeJobs = myJobsData?.jobs?.filter((job: Job) => job.status !== 'completed') || [];
  const completedJobs = myJobsData?.jobs?.filter((job: Job) => job.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-background" data-testid="shipping-dashboard">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <ShipIcon className="text-secondary-foreground h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground" data-testid="company-name">
                    {user.companyName}
                  </h1>
                  <p className="text-muted-foreground">Active Jobs: {activeJobs.length}</p>
                </div>
              </div>
              <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="post-job-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Post New Job
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
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="dashboard-tabs">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="jobs" className="flex items-center gap-2" data-testid="tab-jobs">
              <Package className="h-4 w-4" />
              My Jobs
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2" data-testid="tab-messages">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-6" data-testid="jobs-content">
            <div className="space-y-6">
              {/* Active Jobs */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Active Jobs ({activeJobs.length})</h3>
                <div className="space-y-4">
                  {activeJobs.length > 0 ? (
                    activeJobs.map((job: Job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        userRole="shipping_entity"
                        onCompleteJob={handleCompleteJob}
                        showManageActions={true}
                        isLoading={completeJobMutation.isPending}
                        data-testid={`job-card-${job.id}`}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="text-lg font-semibold mb-2">No active jobs</h4>
                        <p className="text-muted-foreground mb-4">
                          Post your first job to start connecting with carriers.
                        </p>
                        <Button onClick={() => setIsJobDialogOpen(true)} data-testid="post-first-job">
                          Post Your First Job
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Completed Jobs */}
              {completedJobs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Completed Jobs ({completedJobs.length})</h3>
                  <div className="space-y-4">
                    {completedJobs.map((job: Job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        userRole="shipping_entity"
                        showManageActions={false}
                        data-testid={`completed-job-card-${job.id}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-6" data-testid="messages-content">
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Messages</h3>
                <p className="text-muted-foreground">
                  Communicate with carriers about your jobs and shipments.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6" data-testid="analytics-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Jobs Posted</p>
                      <p className="text-2xl font-bold">{myJobsData?.jobs?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Jobs Completed</p>
                      <p className="text-2xl font-bold">{completedJobs.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold">
                        {myJobsData?.jobs?.length > 0 
                          ? Math.round((completedJobs.length / myJobsData.jobs.length) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
