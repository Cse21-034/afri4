import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Navbar from "@/components/ui/navbar";
import { JobListItem } from "@/components/job-list-item";
import { Link } from "wouter";

import { Search, Truck, User as UserIcon, SlidersHorizontal } from "lucide-react";

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

const CARGO_TYPE_OPTIONS = [
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

const COUNTRY_OPTIONS = [
  { value: "AGO", label: "Angola" },
  { value: "BWA", label: "Botswana" },
  { value: "COM", label: "Comoros" },
  { value: "COD", label: "DR Congo" },
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

function formatCargoLabel(value: string) {
  return CARGO_TYPE_OPTIONS.find((c) => c.value === value)?.label || value;
}

export default function TruckingDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { onJobUpdate, onNewMessage } = useWebSocket();

  const [activeTab, setActiveTab] = useState("browse");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [cargoTypeFilter, setCargoTypeFilter] = useState("all");
  const [pickupCountryFilter, setPickupCountryFilter] = useState("all");
  const [deliveryCountryFilter, setDeliveryCountryFilter] = useState("all");

  // Fetch available jobs (server-side filtered by cargo type / country)
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/jobs", cargoTypeFilter, pickupCountryFilter, deliveryCountryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (cargoTypeFilter !== "all") params.append("cargoType", cargoTypeFilter);
      if (pickupCountryFilter !== "all") params.append("pickupCountry", pickupCountryFilter);
      if (deliveryCountryFilter !== "all") params.append("deliveryCountry", deliveryCountryFilter);
      const response = await apiRequest("GET", `/api/jobs?${params.toString()}`);
      return response.json();
    },
  });

  // Fetch user's taken jobs
  const { data: myJobsData } = useQuery({
    queryKey: ["/api/jobs/my"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/jobs/my");
      return response.json();
    },
  });

  const takeJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiRequest("PATCH", `/api/jobs/${jobId}/take`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/my"] });
      toast({ title: "Success", description: "Job taken successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    onJobUpdate((data) => {
      if (data.type === "new_job") {
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        toast({ title: "New Job Available", description: "A new job matching your criteria has been posted." });
      }
    });
    onNewMessage(() => {
      toast({ title: "New Message", description: "You have received a new message." });
    });
  }, [onJobUpdate, onNewMessage, queryClient, toast]);

  const handleTakeJob = (jobId: number) => {
    if (user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial") {
      toast({
        title: "Subscription Required",
        description: "Please activate your subscription to apply for jobs.",
        variant: "destructive",
      });
      return;
    }
    takeJobMutation.mutate(jobId);
  };

  if (!user || user.role !== "trucking_company") {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized</div>;
  }

  const availableJobs: Job[] = jobsData?.jobs || [];
  const myJobs: Job[] = myJobsData?.jobs || [];

  const displayedJobs = availableJobs
    .filter((job) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        job.cargoType.toLowerCase().includes(q) ||
        job.pickupAddress.toLowerCase().includes(q) ||
        job.deliveryAddress.toLowerCase().includes(q) ||
        job.industry.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

  const subscriptionStatusColor =
    user.subscriptionStatus === "active"
      ? "bg-secondary"
      : user.subscriptionStatus === "trial"
      ? "bg-accent"
      : "bg-destructive";

  const filtersActive = cargoTypeFilter !== "all" || pickupCountryFilter !== "all" || deliveryCountryFilter !== "all";

  const filterFields = (
    <>
      <div>
        <h3 className="font-semibold text-sm mb-2 text-primary">Cargo Type</h3>
        <Select value={cargoTypeFilter} onValueChange={setCargoTypeFilter}>
          <SelectTrigger data-testid="filter-cargo-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cargo types</SelectItem>
            {CARGO_TYPE_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-2 text-primary">Pickup Country</h3>
        <Select value={pickupCountryFilter} onValueChange={setPickupCountryFilter}>
          <SelectTrigger data-testid="filter-pickup-country">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any country</SelectItem>
            {COUNTRY_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-2 text-primary">Delivery Country</h3>
        <Select value={deliveryCountryFilter} onValueChange={setDeliveryCountryFilter}>
          <SelectTrigger data-testid="filter-delivery-country">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any country</SelectItem>
            {COUNTRY_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtersActive && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            setCargoTypeFilter("all");
            setPickupCountryFilter("all");
            setDeliveryCountryFilter("all");
          }}
          data-testid="clear-filters"
        >
          Clear Filters
        </Button>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background" data-testid="trucking-dashboard">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="dashboard-tabs">
          <TabsList className="mb-6">
            <TabsTrigger value="browse" className="flex items-center gap-2" data-testid="tab-browse">
              <Search className="h-4 w-4" /> Browse Jobs
            </TabsTrigger>
            <TabsTrigger value="my-jobs" className="flex items-center gap-2" data-testid="tab-my-jobs">
              <Truck className="h-4 w-4" /> My Jobs
            </TabsTrigger>
          </TabsList>

          {/* BROWSE JOBS TAB */}
          <TabsContent value="browse" data-testid="jobs-content">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-6 items-start">
              {/* Left: Profile + Fleet */}
              <div className="space-y-6">
                <Card data-testid="profile-card">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <Truck className="text-primary-foreground h-8 w-8" />
                    </div>
                    <h2 className="font-bold text-foreground" data-testid="company-name">{user.companyName}</h2>
                    <p className="text-sm text-muted-foreground mb-2">Trucking Company</p>
                    <Badge className={subscriptionStatusColor} data-testid="subscription-status">
                      {user.subscriptionStatus === "active" ? "Active Subscription" : user.subscriptionStatus === "trial" ? "Free Trial" : "Inactive"}
                    </Badge>
                    <Link href="/profile">
                      <Button variant="outline" className="w-full mt-4" data-testid="edit-profile-button">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card data-testid="fleet-card">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-sm mb-3 text-primary">Fleet & Cargo</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Fleet size: <span className="font-medium text-foreground">{user.fleetSize || 'N/A'}</span> trucks
                    </p>
                    {user.cargoTypes && user.cargoTypes.length > 0 ? (
                      <ul className="space-y-1.5 text-sm">
                        {user.cargoTypes.map((type) => (
                          <li key={type} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {formatCargoLabel(type)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No cargo types on file.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Middle: Job List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-foreground">Search Job</h1>
                  <Badge variant="secondary" data-testid="jobs-found-count">{displayedJobs.length} jobs found</Badge>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search jobs..."
                      className="pl-9"
                      data-testid="job-search"
                    />
                  </div>
                  <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
                    <SelectTrigger className="w-full sm:w-40" data-testid="sort-order">
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
                    className="lg:hidden flex-shrink-0"
                    onClick={() => setIsFilterOpen(true)}
                    data-testid="open-filters-button"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3" data-testid="job-listings">
                  {jobsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : displayedJobs.length > 0 ? (
                    displayedJobs.map((job) => (
                      <JobListItem
                        key={job.id}
                        job={job}
                        userRole="trucking_company"
                        onTakeJob={handleTakeJob}
                        isLoading={takeJobMutation.isPending}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your filters or check back later for new opportunities.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Right: Job Filter (desktop only -- mobile uses the Sheet drawer) */}
              <Card className="hidden lg:block" data-testid="job-filter-card">
                <CardContent className="p-5 space-y-5">
                  {filterFields}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* MY JOBS TAB */}
          <TabsContent value="my-jobs" data-testid="my-jobs-content">
            <div className="max-w-3xl space-y-3">
              {myJobs.length > 0 ? (
                myJobs.map((job) => (
                  <JobListItem
                    key={job.id}
                    job={job}
                    userRole="trucking_company"
                    showManageActions={false}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No jobs taken yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Browse available jobs and start building your track record.
                    </p>
                    <Button onClick={() => setActiveTab("browse")} data-testid="browse-jobs-button">
                      Browse Jobs
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile filter drawer */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="w-80" data-testid="filter-drawer">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            {filterFields}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
