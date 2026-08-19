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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Navbar from "@/components/ui/navbar";
import { JobListItem } from "@/components/job-list-item";
import { AdvisoriesCard } from "@/components/advisories-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";

import { Search, Truck, User as UserIcon, SlidersHorizontal, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";

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

const TRUCK_TYPE_OPTIONS = [
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
  const [truckTypeFilter, setTruckTypeFilter] = useState("all");
  const [jobModeFilter, setJobModeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [capTruckTypes, setCapTruckTypes] = useState<string[]>([]);
  const [capCountries, setCapCountries] = useState<string[]>([]);
  const [capCrossBorder, setCapCrossBorder] = useState(false);
  const [capHazmat, setCapHazmat] = useState(false);
  const [capFeatures, setCapFeatures] = useState("");
  const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);

  const { data: capabilitiesData } = useQuery({
    queryKey: ["/api/carrier/capabilities"],
    queryFn: async () => (await apiRequest("GET", "/api/carrier/capabilities")).json(),
  });

  // Seed the editable form state from the server once, the first time it loads --
  // subsequent refetches (e.g. after saving) shouldn't stomp on what the user is mid-editing.
  useEffect(() => {
    if (capabilitiesLoaded) return;
    const c = capabilitiesData?.capabilities;
    if (c) {
      setCapTruckTypes(c.truckTypes || []);
      setCapCountries(c.countries || []);
      setCapCrossBorder(!!c.crossBorder);
      setCapHazmat(!!c.hazmatCertified);
      setCapFeatures((c.features || []).join(", "));
      setCapabilitiesLoaded(true);
    } else if (capabilitiesData) {
      setCapabilitiesLoaded(true);
    }
  }, [capabilitiesData, capabilitiesLoaded]);

  const saveCapabilitiesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", "/api/carrier/capabilities", {
        truckTypes: capTruckTypes,
        countries: capCountries,
        crossBorder: capCrossBorder,
        hazmatCertified: capHazmat,
        features: capFeatures.split(",").map((f) => f.trim()).filter(Boolean),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carrier/capabilities"] });
      toast({ title: "Capabilities saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Fetch available jobs (server-side filtered by cargo type / country / truck type / mode)
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/jobs", cargoTypeFilter, pickupCountryFilter, deliveryCountryFilter, truckTypeFilter, jobModeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (cargoTypeFilter !== "all") params.append("cargoType", cargoTypeFilter);
      if (pickupCountryFilter !== "all") params.append("pickupCountry", pickupCountryFilter);
      if (deliveryCountryFilter !== "all") params.append("deliveryCountry", deliveryCountryFilter);
      if (truckTypeFilter !== "all") params.append("truckType", truckTypeFilter);
      if (jobModeFilter !== "all") params.append("jobMode", jobModeFilter);
      params.append("page", String(page));
      params.append("limit", String(PAGE_SIZE));
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

  const releaseJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiRequest("PATCH", `/api/jobs/${jobId}/release`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/my"] });
      toast({ title: "Job released", description: "It's back in the available pool for another carrier." });
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

  const handleReleaseJob = (jobId: number) => {
    releaseJobMutation.mutate(jobId);
  };

  if (!user || user.role !== "trucking_company") {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized</div>;
  }

  const availableJobs: Job[] = jobsData?.jobs || [];
  const myJobs: Job[] = myJobsData?.jobs || [];
  const totalJobs: number = jobsData?.total ?? availableJobs.length;
  const hasMore: boolean = jobsData?.hasMore ?? false;

  const displayedJobs = availableJobs
    .filter((job) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        job.cargoType?.toLowerCase().includes(q) ||
        job.pickupAddress?.toLowerCase().includes(q) ||
        job.deliveryAddress?.toLowerCase().includes(q) ||
        job.industry?.toLowerCase().includes(q)
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

  const filtersActive = cargoTypeFilter !== "all" || pickupCountryFilter !== "all" || deliveryCountryFilter !== "all" || truckTypeFilter !== "all" || jobModeFilter !== "all";

  const filterFields = (
    <>
      <div>
        <h3 className="font-semibold text-sm mb-2 text-primary">Cargo Type</h3>
        <Select value={cargoTypeFilter} onValueChange={(v) => { setCargoTypeFilter(v); setPage(1); }}>
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
        <h3 className="font-semibold text-sm mb-2 text-primary">Truck Type</h3>
        <Select value={truckTypeFilter} onValueChange={(v) => { setTruckTypeFilter(v); setPage(1); }}>
          <SelectTrigger data-testid="filter-truck-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any truck type</SelectItem>
            {TRUCK_TYPE_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-2 text-primary">Job Type</h3>
        <Select value={jobModeFilter} onValueChange={(v) => { setJobModeFilter(v); setPage(1); }}>
          <SelectTrigger data-testid="filter-job-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Fixed loads & tenders</SelectItem>
            <SelectItem value="fixed">Fixed loads only</SelectItem>
            <SelectItem value="tender">Tenders only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-2 text-primary">Pickup Country</h3>
        <Select value={pickupCountryFilter} onValueChange={(v) => { setPickupCountryFilter(v); setPage(1); }}>
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
        <Select value={deliveryCountryFilter} onValueChange={(v) => { setDeliveryCountryFilter(v); setPage(1); }}>
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
            setTruckTypeFilter("all");
            setJobModeFilter("all");
            setPage(1);
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
            <TabsTrigger value="capabilities" className="flex items-center gap-2" data-testid="tab-capabilities">
              <Settings2 className="h-4 w-4" /> Capabilities
            </TabsTrigger>
          </TabsList>

          {/* BROWSE JOBS TAB */}
          <TabsContent value="browse" data-testid="jobs-content">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-6 items-start">
              {/* Left: Profile + Fleet (desktop only -- mobile keeps just the job list; profile is reachable via the navbar) */}
              <div className="hidden lg:block space-y-6">
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
                        {user.cargoTypes.map((type: string) => (
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
                  <Badge variant="secondary" data-testid="jobs-found-count">{totalJobs} jobs found</Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search jobs..."
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

                {!jobsLoading && (totalJobs > PAGE_SIZE) && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      data-testid="prev-page-button"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {page}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!hasMore}
                      data-testid="next-page-button"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Right: Job Filter (desktop only -- mobile uses the Sheet drawer) */}
              <div className="hidden lg:flex lg:flex-col gap-6">
                <Card data-testid="job-filter-card">
                  <CardContent className="p-5 space-y-5">
                    {filterFields}
                  </CardContent>
                </Card>
                <AdvisoriesCard />
              </div>
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
                    onReleaseJob={handleReleaseJob}
                    isLoading={releaseJobMutation.isPending}
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

          {/* CAPABILITIES TAB */}
          <TabsContent value="capabilities" data-testid="capabilities-content">
            <div className="max-w-2xl">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Fleet & Reach</h2>
                    <p className="text-sm text-muted-foreground">
                      Declare what your fleet can actually run -- this lets shippers and the job filters match you to the right loads instead of a phone call.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm mb-2">Truck Types You Operate</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TRUCK_TYPE_OPTIONS.map((t) => (
                        <div key={t.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cap-truck-${t.value}`}
                            checked={capTruckTypes.includes(t.value)}
                            onCheckedChange={(checked) => setCapTruckTypes((prev) => checked ? [...prev, t.value] : prev.filter((v) => v !== t.value))}
                            data-testid={`checkbox-cap-truck-${t.value}`}
                          />
                          <Label htmlFor={`cap-truck-${t.value}`} className="text-sm font-normal">{t.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm mb-2">Countries You Operate In</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {COUNTRY_OPTIONS.map((c) => (
                        <div key={c.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cap-country-${c.value}`}
                            checked={capCountries.includes(c.value)}
                            onCheckedChange={(checked) => setCapCountries((prev) => checked ? [...prev, c.value] : prev.filter((v) => v !== c.value))}
                            data-testid={`checkbox-cap-country-${c.value}`}
                          />
                          <Label htmlFor={`cap-country-${c.value}`} className="text-sm font-normal">{c.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cap-cross-border"
                        checked={capCrossBorder}
                        onCheckedChange={(checked) => setCapCrossBorder(!!checked)}
                        data-testid="checkbox-cap-cross-border"
                      />
                      <Label htmlFor="cap-cross-border" className="text-sm font-normal">Cross-border capable</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cap-hazmat"
                        checked={capHazmat}
                        onCheckedChange={(checked) => setCapHazmat(!!checked)}
                        data-testid="checkbox-cap-hazmat"
                      />
                      <Label htmlFor="cap-hazmat" className="text-sm font-normal">Hazmat certified</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cap-features" className="text-sm font-medium">Other Features</Label>
                    <Input
                      id="cap-features"
                      value={capFeatures}
                      onChange={(e) => setCapFeatures(e.target.value)}
                      placeholder="Comma-separated, e.g. pole pockets, tautliner curtains"
                      data-testid="input-cap-features"
                    />
                  </div>

                  <Button
                    onClick={() => saveCapabilitiesMutation.mutate()}
                    disabled={saveCapabilitiesMutation.isPending}
                    data-testid="save-capabilities-button"
                  >
                    {saveCapabilitiesMutation.isPending ? "Saving..." : "Save Capabilities"}
                  </Button>
                </CardContent>
              </Card>
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
