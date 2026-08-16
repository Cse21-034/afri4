import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/ui/navbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, Package, Clock as ClockIcon, AlertTriangle, TrendingUp, FileText, MessageSquare,
  Settings, CheckCircle, XCircle, Clock, Eye, UserPlus, Plus
} from "lucide-react";

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
  { value: "AGO", label: "Angola" }, { value: "BWA", label: "Botswana" },
  { value: "COM", label: "Comoros" }, { value: "COD", label: "DR Congo" },
  { value: "SWZ", label: "Eswatini" }, { value: "LSO", label: "Lesotho" },
  { value: "MDG", label: "Madagascar" }, { value: "MWI", label: "Malawi" },
  { value: "MUS", label: "Mauritius" }, { value: "MOZ", label: "Mozambique" },
  { value: "NAM", label: "Namibia" }, { value: "SYC", label: "Seychelles" },
  { value: "ZAF", label: "South Africa" }, { value: "TZA", label: "Tanzania" },
  { value: "ZMB", label: "Zambia" }, { value: "ZWE", label: "Zimbabwe" },
];

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character");

const registerUserSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  password: passwordSchema,
  contactPersonName: z.string().min(1, "Contact person name is required"),
  companyName: z.string().min(1, "Company name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  physicalAddress: z.string().min(1, "Physical address is required"),
  businessRegistrationNumber: z.string().optional(),
  fleetSize: z.number().optional(),
  cargoTypes: z.array(z.string()).optional(),
  country: z.string().default("BWA"),
});
type RegisterUserFormData = z.infer<typeof registerUserSchema>;

const jobSchema = z.object({
  shipperId: z.string().min(1, "Select a shipping entity"),
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [userFilters, setUserFilters] = useState({ role: 'all', verified: 'all' });
  const [usersPage, setUsersPage] = useState(1);
  const USERS_PAGE_SIZE = 20;
  const [disputeFilters, setDisputeFilters] = useState({ status: 'all' });
  const [registerType, setRegisterType] = useState<'trucking' | 'shipping' | 'staff'>('trucking');
  const [staffRole, setStaffRole] = useState<'super_admin' | 'customer_support'>('customer_support');
  const [selectedCargoTypes, setSelectedCargoTypes] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [jobFilters, setJobFilters] = useState({ status: 'all', search: '' });
  const [jobsPage, setJobsPage] = useState(1);
  const JOBS_PAGE_SIZE = 20;

  const isAuthorized = !!user && (user.role === 'super_admin' || user.role === 'customer_support');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: async () => (await apiRequest('GET', '/api/admin/dashboard')).json(),
    enabled: isAuthorized,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users', userFilters, usersPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userFilters.role !== 'all') params.append('role', userFilters.role);
      if (userFilters.verified !== 'all') params.append('verified', userFilters.verified);
      params.append('page', String(usersPage));
      params.append('limit', String(USERS_PAGE_SIZE));
      return (await apiRequest('GET', `/api/admin/users?${params.toString()}`)).json();
    },
    enabled: isAuthorized,
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/admin/jobs', jobFilters, jobsPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (jobFilters.status !== 'all') params.append('status', jobFilters.status);
      if (jobFilters.search) params.append('search', jobFilters.search);
      params.append('page', String(jobsPage));
      params.append('limit', String(JOBS_PAGE_SIZE));
      return (await apiRequest('GET', `/api/admin/jobs?${params.toString()}`)).json();
    },
    enabled: isAuthorized,
  });

  const { data: shippingEntitiesData } = useQuery({
    queryKey: ['/api/admin/users', 'shipping_entity'],
    queryFn: async () => (await apiRequest('GET', '/api/admin/users?role=shipping_entity')).json(),
    enabled: isAuthorized,
  });

  const { data: pendingDocumentsData, isLoading: pendingLoading } = useQuery({
    queryKey: ['/api/admin/users/pending-documents'],
    queryFn: async () => (await apiRequest('GET', '/api/admin/users/pending-documents')).json(),
    enabled: isAuthorized,
  });

  const { data: disputesData, isLoading: disputesLoading } = useQuery({
    queryKey: ['/api/admin/disputes', disputeFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (disputeFilters.status !== 'all') params.append('status', disputeFilters.status);
      return (await apiRequest('GET', `/api/admin/disputes?${params.toString()}`)).json();
    },
    enabled: isAuthorized,
  });

  const verifyDocumentsMutation = useMutation({
    mutationFn: async ({ userId, approved }: { userId: number; approved: boolean }) => {
      return (await apiRequest('POST', `/api/admin/users/${userId}/verify-documents`, { approved })).json();
    },
    onSuccess: (data) => {
      toast({ title: data.message });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/pending-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const assignDisputeMutation = useMutation({
    mutationFn: async (disputeId: number) => (await apiRequest('POST', `/api/admin/disputes/${disputeId}/assign`)).json(),
    onSuccess: () => {
      toast({ title: "Dispute assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disputes'] });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ disputeId, resolution }: { disputeId: number; resolution: string }) =>
      (await apiRequest('POST', `/api/admin/disputes/${disputeId}/resolve`, { resolution })).json(),
    onSuccess: () => {
      toast({ title: "Dispute resolved successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disputes'] });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const editUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: any }) =>
      (await apiRequest('PATCH', `/api/admin/users/${userId}`, data)).json(),
    onSuccess: () => {
      toast({ title: "User updated" });
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => toast({ title: "Update failed", description: error.message, variant: "destructive" }),
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, suspended }: { userId: number; suspended: boolean }) =>
      (await apiRequest('POST', `/api/admin/users/${userId}/suspend`, { suspended })).json(),
    onSuccess: (data) => {
      toast({ title: data.message });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) =>
      (await apiRequest('POST', `/api/admin/users/${userId}/reset-password`, { newPassword: password })).json(),
    onSuccess: () => {
      toast({ title: "Password reset successfully" });
      setResetPasswordUser(null);
      setNewPassword("");
    },
    onError: (error: Error) => toast({ title: "Reset failed", description: error.message, variant: "destructive" }),
  });

  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: number) => (await apiRequest('PATCH', `/api/admin/jobs/${jobId}/cancel`)).json(),
    onSuccess: () => {
      toast({ title: "Job cancelled" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const registerForm = useForm<RegisterUserFormData>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: { country: "BWA" },
  });

  const registerUserMutation = useMutation({
    mutationFn: async (data: RegisterUserFormData) => {
      const payload = registerType === 'staff'
        ? { type: 'staff', staffRole, contactPersonName: data.contactPersonName, phoneNumber: data.phoneNumber, password: data.password, email: data.email, physicalAddress: data.physicalAddress }
        : { ...data, type: registerType };
      return (await apiRequest('POST', '/api/admin/register-user', payload)).json();
    },
    onSuccess: (data) => {
      toast({ title: "User registered", description: data.message });
      registerForm.reset({ country: "BWA" });
      setSelectedCargoTypes([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    },
    onError: (error: Error) => toast({ title: "Registration failed", description: error.message, variant: "destructive" }),
  });

  const jobForm = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: { pickupCountry: "BWA", deliveryCountry: "BWA", insuranceRequired: false },
  });

  const postJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => (await apiRequest('POST', '/api/jobs', data)).json(),
    onSuccess: () => {
      toast({ title: "Job posted successfully" });
      jobForm.reset({ pickupCountry: "BWA", deliveryCountry: "BWA", insuranceRequired: false });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    },
    onError: (error: Error) => toast({ title: "Failed to post job", description: error.message, variant: "destructive" }),
  });

  const handleCargoTypeToggle = (type: string, checked: boolean) => {
    const next = checked ? [...selectedCargoTypes, type] : selectedCargoTypes.filter((t) => t !== type);
    setSelectedCargoTypes(next);
    registerForm.setValue("cargoTypes", next);
  };

  // /uploads requires a Bearer token a plain <a href> can't attach, and the relative
  // path resolves against the frontend's own origin, not the backend that serves it --
  // apiRequest fixes both (correct origin via VITE_API_URL, and the auth header).
  const openDocument = async (fileUrl: string) => {
    try {
      const res = await apiRequest('GET', fileUrl);
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast({ title: "Couldn't open document", description: error.message, variant: "destructive" });
    }
  };

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized</div>;
  }

  const stats: any = dashboardData?.stats || {};
  const recentUsers = (usersData?.users || []).slice(0, 5);

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" data-testid="admin-title">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Platform management and oversight tools</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card data-testid="stat-total-users">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? "..." : (stats.totalUsers ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-jobs">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? "..." : (stats.activeJobs ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-jobs">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? "..." : (stats.totalJobs ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-pending-verification">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verification</p>
                  <p className="text-3xl font-bold text-foreground">
                    {pendingLoading ? "..." : (pendingDocumentsData?.users?.length ?? 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="admin-tabs">
          <TabsList className="flex flex-wrap h-auto gap-1 justify-start">
            <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-overview">
              <TrendingUp className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2" data-testid="tab-verification">
              <FileText className="h-4 w-4" /> Verification
            </TabsTrigger>
            <TabsTrigger value="disputes" className="flex items-center gap-2" data-testid="tab-disputes">
              <MessageSquare className="h-4 w-4" /> Disputes
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2" data-testid="tab-jobs-admin">
              <Package className="h-4 w-4" /> Jobs
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2" data-testid="tab-register">
              <UserPlus className="h-4 w-4" /> Register User
            </TabsTrigger>
            <TabsTrigger value="post-job" className="flex items-center gap-2" data-testid="tab-post-job">
              <Plus className="h-4 w-4" /> Post Job
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2" data-testid="tab-system">
              <Settings className="h-4 w-4" /> System
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-6" data-testid="overview-content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Recent Registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : recentUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No users yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{u.companyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={u.verified ? 'default' : 'secondary'} className="flex-shrink-0">
                          {u.verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-8">
              <CardHeader><CardTitle>Platform Statistics</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{stats.truckingCompanies || 0}</p>
                    <p className="text-sm text-muted-foreground">Trucking Companies</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{stats.shippingEntities || 0}</p>
                    <p className="text-sm text-muted-foreground">Shipping Entities</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{stats.totalJobs || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{stats.completedJobs || 0}</p>
                    <p className="text-sm text-muted-foreground">Completed Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users" className="mt-6" data-testid="users-content">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex gap-2">
                    <Select value={userFilters.role} onValueChange={(v) => setUserFilters({ ...userFilters, role: v })}>
                      <SelectTrigger className="w-[160px]" data-testid="filter-user-role"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="trucking_company">Trucking</SelectItem>
                        <SelectItem value="shipping_entity">Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={userFilters.verified} onValueChange={(v) => setUserFilters({ ...userFilters, verified: v })}>
                      <SelectTrigger className="w-[140px]" data-testid="filter-user-verified"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="true">Verified</SelectItem>
                        <SelectItem value="false">Unverified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {usersLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading users...</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead>Docs</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(usersData?.users || []).map((u: any) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.companyName}</TableCell>
                            <TableCell>{u.email || u.phoneNumber}</TableCell>
                            <TableCell>
                              <Badge variant={u.role === 'trucking_company' ? 'default' : 'secondary'}>
                                {u.role === 'trucking_company' ? 'Trucking' : u.role === 'shipping_entity' ? 'Shipping' : u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant={u.verified ? 'default' : 'destructive'}>
                                  {u.verified ? 'Verified' : 'Unverified'}
                                </Badge>
                                {u.accountLocked && <Badge variant="destructive">Suspended</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="capitalize">{u.subscriptionStatus || '-'}</TableCell>
                            <TableCell>
                              {u.documents?.length > 0 ? (
                                <Badge variant="secondary">{u.documents.length} files</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">None</span>
                              )}
                            </TableCell>
                            <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => { setEditingUser(u); setEditForm({ ...u }); }}
                                  data-testid={`edit-user-${u.id}`}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => setResetPasswordUser(u)}
                                  data-testid={`reset-password-${u.id}`}
                                >
                                  Reset PW
                                </Button>
                                <Button
                                  size="sm"
                                  variant={u.accountLocked ? "default" : "destructive"}
                                  onClick={() => suspendUserMutation.mutate({ userId: u.id, suspended: !u.accountLocked })}
                                  disabled={suspendUserMutation.isPending}
                                  data-testid={`suspend-user-${u.id}`}
                                >
                                  {u.accountLocked ? 'Reactivate' : 'Suspend'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline" size="sm"
                        disabled={usersPage === 1}
                        onClick={() => setUsersPage((p) => p - 1)}
                        data-testid="users-prev-page"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">Page {usersPage}</span>
                      <Button
                        variant="outline" size="sm"
                        disabled={(usersData?.users?.length || 0) < USERS_PAGE_SIZE}
                        onClick={() => setUsersPage((p) => p + 1)}
                        data-testid="users-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
              <DialogContent data-testid="edit-user-dialog">
                <DialogHeader><DialogTitle>Edit {editingUser?.companyName}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input value={editForm.companyName || ''} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Contact Person</Label>
                    <Input value={editForm.contactPersonName || ''} onChange={(e) => setEditForm({ ...editForm, contactPersonName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={editForm.phoneNumber || ''} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} />
                  </div>
                  <div>
                    <Label>Physical Address</Label>
                    <Textarea value={editForm.physicalAddress || ''} onChange={(e) => setEditForm({ ...editForm, physicalAddress: e.target.value })} />
                  </div>
                  <div>
                    <Label>Subscription Status</Label>
                    <Select value={editForm.subscriptionStatus} onValueChange={(v) => setEditForm({ ...editForm, subscriptionStatus: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Use "Active" here to manually mark a bank-transfer payment as paid.</p>
                  </div>
                  <Button
                    className="w-full"
                    disabled={editUserMutation.isPending}
                    onClick={() => editUserMutation.mutate({
                      userId: editingUser.id,
                      data: {
                        companyName: editForm.companyName,
                        contactPersonName: editForm.contactPersonName,
                        phoneNumber: editForm.phoneNumber,
                        physicalAddress: editForm.physicalAddress,
                        subscriptionStatus: editForm.subscriptionStatus,
                      }
                    })}
                    data-testid="save-edit-user"
                  >
                    {editUserMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
              <DialogContent data-testid="reset-password-dialog">
                <DialogHeader><DialogTitle>Reset Password: {resetPasswordUser?.companyName}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>New Password</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
                  </div>
                  <Button
                    className="w-full"
                    disabled={resetPasswordMutation.isPending || newPassword.length < 8}
                    onClick={() => resetPasswordMutation.mutate({ userId: resetPasswordUser.id, password: newPassword })}
                    data-testid="confirm-reset-password"
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* VERIFICATION */}
          <TabsContent value="verification" className="mt-6" data-testid="verification-content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Document Verification Queue
                  {(pendingDocumentsData?.users?.length ?? 0) > 0 && (
                    <Badge variant="destructive">{pendingDocumentsData.users.length} pending</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : (pendingDocumentsData?.users?.length ?? 0) === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">No documents pending verification.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingDocumentsData.users.map((u: any) => (
                      <Card key={u.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{u.companyName}</h3>
                              <p className="text-muted-foreground">{u.email || u.phoneNumber}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Submitted: {new Date(u.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="bg-orange-100 text-orange-800 w-fit">Pending Review</Badge>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Uploaded Documents:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {u.documents?.map((doc: any, i: number) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => openDocument(doc.fileUrl)}
                                  className="flex items-center gap-2 p-2 bg-muted/30 rounded hover:bg-muted/50 text-left"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm truncate">{doc.filename}</span>
                                  <Eye className="h-4 w-4 ml-auto flex-shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => verifyDocumentsMutation.mutate({ userId: u.id, approved: true })}
                              disabled={verifyDocumentsMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`approve-documents-${u.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" /> Approve
                            </Button>
                            <Button
                              onClick={() => verifyDocumentsMutation.mutate({ userId: u.id, approved: false })}
                              disabled={verifyDocumentsMutation.isPending}
                              variant="destructive"
                              data-testid={`reject-documents-${u.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DISPUTES */}
          <TabsContent value="disputes" className="mt-6" data-testid="disputes-content">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" /> Dispute Resolution
                  </CardTitle>
                  <Select value={disputeFilters.status} onValueChange={(v) => setDisputeFilters({ ...disputeFilters, status: v })}>
                    <SelectTrigger className="w-[160px]" data-testid="filter-dispute-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Disputes</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {disputesLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading disputes...</p>
                ) : (disputesData?.disputes?.length ?? 0) === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Disputes Found</h3>
                    <p className="text-muted-foreground">No disputes match your current filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {disputesData.disputes.map((dispute: any) => (
                      <Card key={dispute.id} className={`border-l-4 ${
                        dispute.status === 'open' ? 'border-l-red-500' :
                        dispute.status === 'in_review' ? 'border-l-yellow-500' :
                        dispute.status === 'resolved' ? 'border-l-green-500' : 'border-l-gray-500'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                            <div>
                              <h3 className="font-semibold">{dispute.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Dispute #{dispute.id} • Job #{dispute.jobId}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Created: {new Date(dispute.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={
                              dispute.status === 'open' ? 'destructive' :
                              dispute.status === 'resolved' ? 'default' : 'secondary'
                            } className="w-fit">
                              {dispute.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>

                          <p className="text-sm mb-3">{dispute.description}</p>

                          {dispute.status === 'resolved' && dispute.resolution && (
                            <div className="bg-green-50 p-3 rounded mb-3">
                              <p className="text-sm font-medium text-green-800">Resolution:</p>
                              <p className="text-sm text-green-700">{dispute.resolution}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {dispute.status === 'open' && (
                              <Button
                                onClick={() => assignDisputeMutation.mutate(dispute.id)}
                                disabled={assignDisputeMutation.isPending}
                                data-testid={`assign-dispute-${dispute.id}`}
                              >
                                <Clock className="h-4 w-4 mr-2" /> Assign to Me
                              </Button>
                            )}
                            {dispute.status === 'in_review' && dispute.adminId === user?.id && (
                              <Button
                                onClick={() => {
                                  const resolution = prompt('Enter resolution:');
                                  if (resolution) resolveDisputeMutation.mutate({ disputeId: dispute.id, resolution });
                                }}
                                disabled={resolveDisputeMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                                data-testid={`resolve-dispute-${dispute.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" /> Resolve
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* JOBS */}
          <TabsContent value="jobs" className="mt-6" data-testid="jobs-admin-content">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" /> All Jobs
                  </CardTitle>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search cargo/address..."
                      value={jobFilters.search}
                      onChange={(e) => { setJobFilters({ ...jobFilters, search: e.target.value }); setJobsPage(1); }}
                      className="w-[200px]"
                      data-testid="job-admin-search"
                    />
                    <Select value={jobFilters.status} onValueChange={(v) => { setJobFilters({ ...jobFilters, status: v }); setJobsPage(1); }}>
                      <SelectTrigger className="w-[150px]" data-testid="filter-job-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="taken">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {jobsLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading jobs...</p>
                ) : (jobsData?.jobs?.length ?? 0) === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No jobs match your filters.</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Shipper</TableHead>
                          <TableHead>Carrier</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Posted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(jobsData?.jobs || []).map((j: any) => (
                          <TableRow key={j.id}>
                            <TableCell className="font-medium capitalize">
                              {j.cargoType || 'Not specified'}{j.cargoWeight ? ` (${j.cargoWeight}kg)` : ''}
                            </TableCell>
                            <TableCell>{j.shipperName || '-'}</TableCell>
                            <TableCell>{j.carrierName || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={`${j.pickupAddress || '?'} → ${j.deliveryAddress || '?'}`}>
                              {j.pickupAddress || 'Not specified'} &rarr; {j.deliveryAddress || 'Not specified'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                j.status === 'available' ? 'default' :
                                j.status === 'taken' ? 'secondary' :
                                j.status === 'cancelled' ? 'destructive' : 'outline'
                              }>
                                {j.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(j.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {(j.status === 'available' || j.status === 'taken') && (
                                <Button
                                  size="sm" variant="destructive"
                                  onClick={() => cancelJobMutation.mutate(j.id)}
                                  disabled={cancelJobMutation.isPending}
                                  data-testid={`cancel-job-${j.id}`}
                                >
                                  Cancel
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline" size="sm"
                        disabled={jobsPage === 1}
                        onClick={() => setJobsPage((p) => p - 1)}
                        data-testid="jobs-prev-page"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">Page {jobsPage}</span>
                      <Button
                        variant="outline" size="sm"
                        disabled={(jobsData?.jobs?.length || 0) < JOBS_PAGE_SIZE}
                        onClick={() => setJobsPage((p) => p + 1)}
                        data-testid="jobs-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REGISTER USER */}
          <TabsContent value="register" className="mt-6" data-testid="register-content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" /> Register a New User
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  For phone/in-person intake. Skips email verification -- the account is usable immediately.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Button
                    type="button"
                    variant={registerType === 'trucking' ? 'default' : 'outline'}
                    onClick={() => setRegisterType('trucking')}
                    data-testid="register-type-trucking"
                  >
                    Trucking Company
                  </Button>
                  <Button
                    type="button"
                    variant={registerType === 'shipping' ? 'default' : 'outline'}
                    onClick={() => setRegisterType('shipping')}
                    data-testid="register-type-shipping"
                  >
                    Shipping Entity
                  </Button>
                  {user?.role === 'super_admin' && (
                    <Button
                      type="button"
                      variant={registerType === 'staff' ? 'default' : 'outline'}
                      onClick={() => setRegisterType('staff')}
                      data-testid="register-type-staff"
                    >
                      Staff (Admin/Support)
                    </Button>
                  )}
                </div>

                {registerType === 'staff' ? (
                  <div className="space-y-6 max-w-lg">
                    <div>
                      <Label>Staff Role</Label>
                      <Select value={staffRole} onValueChange={(v) => setStaffRole(v as any)}>
                        <SelectTrigger data-testid="select-staff-role"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer_support">Customer Support</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="staff-name">Full Name</Label>
                      <Input id="staff-name" {...registerForm.register("contactPersonName")} data-testid="input-staff-name" />
                    </div>
                    <div>
                      <Label htmlFor="staff-phone">Phone Number</Label>
                      <Input id="staff-phone" {...registerForm.register("phoneNumber")} placeholder="+267 xxx xxxx" data-testid="input-staff-phone" />
                    </div>
                    <div>
                      <Label htmlFor="staff-email">Email (Optional)</Label>
                      <Input id="staff-email" type="email" {...registerForm.register("email")} data-testid="input-staff-email" />
                    </div>
                    <div>
                      <Label htmlFor="staff-password">Temporary Password</Label>
                      <Input id="staff-password" type="password" {...registerForm.register("password")} data-testid="input-staff-password" />
                    </div>
                    <Button
                      onClick={() => registerUserMutation.mutate(registerForm.getValues())}
                      disabled={registerUserMutation.isPending}
                      data-testid="submit-register-staff"
                    >
                      {registerUserMutation.isPending ? "Creating..." : "Create Staff Account"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Full name, phone number, and an 8+ character password are required (checked on submit).
                    </p>
                  </div>
                ) : (
                <form onSubmit={registerForm.handleSubmit((data) => registerUserMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="admin-company-name">Company Name</Label>
                      <Input id="admin-company-name" {...registerForm.register("companyName")} data-testid="input-admin-company-name" />
                      {registerForm.formState.errors.companyName && (
                        <p className="text-destructive text-sm mt-1">{registerForm.formState.errors.companyName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="admin-contact-person">Contact Person</Label>
                      <Input id="admin-contact-person" {...registerForm.register("contactPersonName")} data-testid="input-admin-contact-person" />
                      {registerForm.formState.errors.contactPersonName && (
                        <p className="text-destructive text-sm mt-1">{registerForm.formState.errors.contactPersonName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="admin-email">Email Address (Optional)</Label>
                      <Input id="admin-email" type="email" {...registerForm.register("email")} data-testid="input-admin-email" />
                      {registerForm.formState.errors.email && (
                        <p className="text-destructive text-sm mt-1">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="admin-phone">Phone Number</Label>
                      <Input id="admin-phone" {...registerForm.register("phoneNumber")} placeholder="+267 xxx xxxx" data-testid="input-admin-phone" />
                      {registerForm.formState.errors.phoneNumber && (
                        <p className="text-destructive text-sm mt-1">{registerForm.formState.errors.phoneNumber.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="admin-password">Temporary Password</Label>
                      <Input id="admin-password" type="password" {...registerForm.register("password")} data-testid="input-admin-password" />
                      {registerForm.formState.errors.password && (
                        <p className="text-destructive text-sm mt-1">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="admin-country">Country</Label>
                      <Select onValueChange={(v) => registerForm.setValue("country", v)} defaultValue="BWA">
                        <SelectTrigger id="admin-country" data-testid="select-admin-country"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="admin-address">Physical Address</Label>
                      <Textarea id="admin-address" {...registerForm.register("physicalAddress")} data-testid="textarea-admin-address" />
                      {registerForm.formState.errors.physicalAddress && (
                        <p className="text-destructive text-sm mt-1">{registerForm.formState.errors.physicalAddress.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="admin-reg-number">Business Registration Number {registerType === 'shipping' && '(Optional)'}</Label>
                      <Input id="admin-reg-number" {...registerForm.register("businessRegistrationNumber")} data-testid="input-admin-reg-number" />
                    </div>
                    {registerType === 'trucking' && (
                      <div>
                        <Label htmlFor="admin-fleet-size">Fleet Size</Label>
                        <Input
                          id="admin-fleet-size"
                          type="number"
                          {...registerForm.register("fleetSize", { valueAsNumber: true })}
                          data-testid="input-admin-fleet-size"
                        />
                      </div>
                    )}
                  </div>

                  {registerType === 'trucking' && (
                    <div>
                      <Label className="mb-3 block">Cargo Types</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {CARGO_TYPE_OPTIONS.map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`admin-cargo-${type.value}`}
                              checked={selectedCargoTypes.includes(type.value)}
                              onCheckedChange={(checked) => handleCargoTypeToggle(type.value, !!checked)}
                            />
                            <Label htmlFor={`admin-cargo-${type.value}`} className="text-sm font-normal">{type.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={registerUserMutation.isPending} data-testid="submit-register-user">
                    {registerUserMutation.isPending ? "Registering..." : "Register User"}
                  </Button>
                </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* POST JOB */}
          <TabsContent value="post-job" className="mt-6" data-testid="post-job-content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Post a Job on Behalf of a Shipping Entity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={jobForm.handleSubmit((data) => postJobMutation.mutate(data))} className="space-y-6">
                  <div>
                    <Label htmlFor="job-shipper">Shipping Entity</Label>
                    <Select onValueChange={(v) => jobForm.setValue("shipperId", v)}>
                      <SelectTrigger id="job-shipper" data-testid="select-job-shipper">
                        <SelectValue placeholder="Select a shipping entity" />
                      </SelectTrigger>
                      <SelectContent>
                        {(shippingEntitiesData?.users || []).map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {jobForm.formState.errors.shipperId && (
                      <p className="text-destructive text-sm mt-1">{jobForm.formState.errors.shipperId.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job-cargo-type">Cargo Type</Label>
                      <Select onValueChange={(v) => jobForm.setValue("cargoType", v)}>
                        <SelectTrigger id="job-cargo-type" data-testid="select-job-cargo-type"><SelectValue placeholder="Select cargo type" /></SelectTrigger>
                        <SelectContent>
                          {CARGO_TYPE_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {jobForm.formState.errors.cargoType && (
                        <p className="text-destructive text-sm mt-1">{jobForm.formState.errors.cargoType.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="job-industry">Industry</Label>
                      <Select onValueChange={(v) => jobForm.setValue("industry", v)}>
                        <SelectTrigger id="job-industry" data-testid="select-job-industry"><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="mining">Mining</SelectItem>
                          <SelectItem value="logistics">Logistics</SelectItem>
                          <SelectItem value="construction">Construction</SelectItem>
                        </SelectContent>
                      </Select>
                      {jobForm.formState.errors.industry && (
                        <p className="text-destructive text-sm mt-1">{jobForm.formState.errors.industry.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="job-weight">Weight (kg)</Label>
                      <Input id="job-weight" type="number" {...jobForm.register("cargoWeight", { valueAsNumber: true })} data-testid="input-job-weight" />
                      {jobForm.formState.errors.cargoWeight && (
                        <p className="text-destructive text-sm mt-1">{jobForm.formState.errors.cargoWeight.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="job-volume">Volume (m³)</Label>
                      <Input id="job-volume" type="number" step="0.1" {...jobForm.register("cargoVolume", { valueAsNumber: true })} data-testid="input-job-volume" />
                      {jobForm.formState.errors.cargoVolume && (
                        <p className="text-destructive text-sm mt-1">{jobForm.formState.errors.cargoVolume.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="job-pickup-country">Pickup Country</Label>
                      <Select onValueChange={(v) => jobForm.setValue("pickupCountry", v)} defaultValue="BWA">
                        <SelectTrigger id="job-pickup-country" data-testid="select-job-pickup-country"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="job-delivery-country">Delivery Country</Label>
                      <Select onValueChange={(v) => jobForm.setValue("deliveryCountry", v)} defaultValue="BWA">
                        <SelectTrigger id="job-delivery-country" data-testid="select-job-delivery-country"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="job-pickup-address">Pickup Address</Label>
                    <Textarea id="job-pickup-address" {...jobForm.register("pickupAddress")} data-testid="textarea-job-pickup-address" />
                    {jobForm.formState.errors.pickupAddress && (
                      <p className="text-destructive text-sm mt-1">{jobForm.formState.errors.pickupAddress.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="job-delivery-address">Delivery Address</Label>
                    <Textarea id="job-delivery-address" {...jobForm.register("deliveryAddress")} data-testid="textarea-job-delivery-address" />
                    {jobForm.formState.errors.deliveryAddress && (
                      <p className="text-destructive text-sm mt-1">{jobForm.formState.errors.deliveryAddress.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job-pickup-date">Pickup Date</Label>
                      <Input id="job-pickup-date" type="date" {...jobForm.register("pickupDate")} data-testid="input-job-pickup-date" />
                      {jobForm.formState.errors.pickupDate && (
                        <p className="text-destructive text-sm mt-1">{jobForm.formState.errors.pickupDate.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="job-deadline">Delivery Deadline</Label>
                      <Input id="job-deadline" type="date" {...jobForm.register("deliveryDeadline")} data-testid="input-job-deadline" />
                      {jobForm.formState.errors.deliveryDeadline && (
                        <p className="text-destructive text-sm mt-1">{jobForm.formState.errors.deliveryDeadline.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="job-insurance"
                      onCheckedChange={(checked) => jobForm.setValue("insuranceRequired", !!checked)}
                      data-testid="checkbox-job-insurance"
                    />
                    <Label htmlFor="job-insurance" className="text-sm font-normal">Insurance Required</Label>
                  </div>

                  <div>
                    <Label htmlFor="job-notes">Additional Notes</Label>
                    <Textarea id="job-notes" {...jobForm.register("notes")} data-testid="textarea-job-notes" />
                  </div>

                  <Button type="submit" disabled={postJobMutation.isPending} data-testid="submit-post-job">
                    {postJobMutation.isPending ? "Posting..." : "Post Job"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SYSTEM */}
          <TabsContent value="system" className="mt-6" data-testid="system-content">
            <Card>
              <CardHeader><CardTitle>System</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">System Monitoring</h3>
                  <p className="text-muted-foreground">
                    Logs and performance monitoring aren't wired up yet -- coming later.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
