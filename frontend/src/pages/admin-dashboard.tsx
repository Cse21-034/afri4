import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/ui/navbar";
import { Users, Package, DollarSign, AlertTriangle, TrendingUp, FileText, MessageSquare, Settings, CheckCircle, XCircle, Clock, Eye } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [userFilters, setUserFilters] = useState({ role: 'all', verified: 'all', hasDocuments: 'all' });
  const [disputeFilters, setDisputeFilters] = useState({ status: 'all' });

  // Mock data for now
  const dashboardData = {
    stats: {
      totalUsers: 1247,
      truckingCompanies: 789,
      shippingEntities: 458,
      totalJobs: 3456,
      activeJobs: 234,
      completedJobs: 3122,
      monthlyRevenue: 234567
    }
  };
  const isLoading = false;

  const usersData = {
    users: [
      {
        id: 1,
        companyName: "Swift Transport Ltd",
        email: "admin@swifttransport.co.za",
        role: "trucking_company",
        verified: true,
        documents: [{filename: "license.pdf"}],
        createdAt: "2024-01-15T10:00:00Z"
      },
      {
        id: 2,
        companyName: "African Logistics Co",
        email: "info@africanlogistics.bw",
        role: "shipping_entity",
        verified: false,
        documents: [],
        createdAt: "2024-02-10T14:30:00Z"
      },
      {
        id: 3,
        companyName: "Botswana Freight Services",
        email: "contact@bwfreight.co.bw",
        role: "trucking_company",
        verified: true,
        documents: [{filename: "permit.pdf"}, {filename: "insurance.pdf"}],
        createdAt: "2024-01-28T08:15:00Z"
      }
    ]
  };
  const usersLoading = false;

  const pendingDocumentsData = {
    users: [
      {
        id: 4,
        companyName: "Namibian Trucking Corp",
        email: "admin@namtrucking.na",
        documents: [{filename: "business_license.pdf"}, {filename: "vehicle_permit.pdf"}],
        updatedAt: "2024-03-10T16:45:00Z"
      },
      {
        id: 5,
        companyName: "Zimbabwe Transport Solutions",
        email: "info@zimtransport.zw",
        documents: [{filename: "operating_license.pdf"}],
        updatedAt: "2024-03-12T09:30:00Z"
      }
    ]
  };
  const pendingLoading = false;

  const disputesData = {
    disputes: [
      {
        id: 1,
        jobId: 123,
        title: "Payment Dispute",
        description: "Carrier claims payment was not received for completed delivery from Gaborone to Cape Town.",
        status: "open",
        createdAt: "2024-03-14T12:00:00Z",
        adminId: null,
        resolution: null
      },
      {
        id: 2,
        jobId: 456,
        title: "Delivery Delay Complaint",
        description: "Shipper reports that goods arrived 3 days late, causing business disruption.",
        status: "in_review",
        createdAt: "2024-03-13T15:30:00Z",
        adminId: user?.id,
        resolution: null
      },
      {
        id: 3,
        jobId: 789,
        title: "Damaged Goods Claim",
        description: "Electronics shipment arrived with water damage, insurance claim disputed.",
        status: "resolved",
        createdAt: "2024-03-10T11:15:00Z",
        adminId: 1,
        resolution: "Insurance claim approved for BWP 15,000. Carrier found not liable due to weather conditions beyond control."
      }
    ]
  };
  const disputesLoading = false;

  // Mock mutation handlers
  const verifyDocumentsMutation = {
    mutate: ({ userId, approved }: { userId: number; approved: boolean }) => {
      toast({ title: approved ? "Documents approved successfully" : "Documents rejected" });
    },
    isPending: false
  };

  const assignDisputeMutation = {
    mutate: (disputeId: number) => {
      toast({ title: "Dispute assigned successfully" });
    },
    isPending: false
  };

  const resolveDisputeMutation = {
    mutate: ({ disputeId, resolution }: { disputeId: number; resolution: string }) => {
      toast({ title: "Dispute resolved successfully" });
    },
    isPending: false
  };

  if (!user || (user.role !== 'super_admin' && user.role !== 'customer_support')) {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized</div>;
  }

  const stats = dashboardData?.stats || {};

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="admin-title">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Platform management and oversight tools</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-total-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? "..." : stats.totalUsers?.toLocaleString() || "0"}
                  </p>
                  <p className="text-sm text-green-600 mt-1">↗ +24 today</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-jobs">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? "..." : stats.activeJobs?.toLocaleString() || "0"}
                  </p>
                  <p className="text-sm text-green-600 mt-1">↗ +8 today</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-monthly-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-foreground">
                    BWP {isLoading ? "..." : (stats.monthlyRevenue || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 mt-1">↗ +12% vs last month</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-support-tickets">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Support Tickets</p>
                  <p className="text-3xl font-bold text-foreground">23</p>
                  <p className="text-sm text-accent mt-1">5 urgent</p>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-overview">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2" data-testid="tab-verification">
              <FileText className="h-4 w-4" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="disputes" className="flex items-center gap-2" data-testid="tab-disputes">
              <MessageSquare className="h-4 w-4" />
              Disputes
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2" data-testid="tab-system">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6" data-testid="overview-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Swift Logistics Ltd</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Pending Verification
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">African Freight Co</p>
                          <p className="text-xs text-muted-foreground">5 hours ago</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Verified
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-800 text-sm">Payment Gateway Issue</p>
                          
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <FileText className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800 text-sm">High Document Queue</p>
                          <p className="text-xs text-yellow-600">47 documents awaiting verification</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Settings className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800 text-sm">Scheduled Maintenance</p>
                          <p className="text-xs text-blue-600">Database backup scheduled for 2 AM GMT</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Statistics */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {stats.truckingCompanies || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Trucking Companies</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {stats.shippingEntities || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Shipping Entities</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {stats.totalJobs || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {stats.completedJobs || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6" data-testid="users-content">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex gap-2">
                    <Select value={userFilters.role} onValueChange={(value) => setUserFilters({...userFilters, role: value})}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="trucking_company">Trucking Companies</SelectItem>
                        <SelectItem value="shipping_entity">Shipping Entities</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={userFilters.verified} onValueChange={(value) => setUserFilters({...userFilters, verified: value})}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="true">Verified</SelectItem>
                        <SelectItem value="false">Unverified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.users?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.companyName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'trucking_company' ? 'default' : 'secondary'}>
                              {user.role === 'trucking_company' ? 'Trucking' : 'Shipping'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.verified ? 'default' : 'destructive'}>
                              {user.verified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.documents && user.documents.length > 0 ? (
                              <Badge variant="secondary">{user.documents.length} files</Badge>
                            ) : (
                              <span className="text-muted-foreground">No documents</span>
                            )}
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="mt-6" data-testid="verification-content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Verification Queue
                  {pendingDocumentsData?.users?.length > 0 && (
                    <Badge variant="destructive">{pendingDocumentsData.users.length} pending</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading pending documents...</p>
                  </div>
                ) : pendingDocumentsData?.users?.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">
                      No documents pending verification.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingDocumentsData.users.map((user: any) => (
                      <Card key={user.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{user.companyName}</h3>
                              <p className="text-muted-foreground">{user.email}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Submitted: {new Date(user.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="bg-orange-100 text-orange-800">Pending Review</Badge>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Uploaded Documents:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {user.documents?.map((doc: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm">{doc.filename}</span>
                                  <Button variant="ghost" size="sm" className="ml-auto">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => verifyDocumentsMutation.mutate({ userId: user.id, approved: true })}
                              disabled={verifyDocumentsMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`approve-documents-${user.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => verifyDocumentsMutation.mutate({ userId: user.id, approved: false })}
                              disabled={verifyDocumentsMutation.isPending}
                              variant="destructive"
                              data-testid={`reject-documents-${user.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
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

          <TabsContent value="disputes" className="mt-6" data-testid="disputes-content">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Dispute Resolution
                  </CardTitle>
                  <Select value={disputeFilters.status} onValueChange={(value) => setDisputeFilters({...disputeFilters, status: value})}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
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
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading disputes...</p>
                  </div>
                ) : disputesData?.disputes?.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Disputes Found</h3>
                    <p className="text-muted-foreground">
                      No disputes match your current filters.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {disputesData.disputes.map((dispute: any) => (
                      <Card key={dispute.id} className={`border-l-4 ${
                        dispute.status === 'open' ? 'border-l-red-500' :
                        dispute.status === 'in_review' ? 'border-l-yellow-500' :
                        dispute.status === 'resolved' ? 'border-l-green-500' :
                        'border-l-gray-500'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
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
                              dispute.status === 'in_review' ? 'default' :
                              dispute.status === 'resolved' ? 'default' :
                              'secondary'
                            }>
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
                                <Clock className="h-4 w-4 mr-2" />
                                Assign to Me
                              </Button>
                            )}
                            {dispute.status === 'in_review' && dispute.adminId === user?.id && (
                              <Button
                                onClick={() => {
                                  const resolution = prompt('Enter resolution:');
                                  if (resolution) {
                                    resolveDisputeMutation.mutate({ disputeId: dispute.id, resolution });
                                  }
                                }}
                                disabled={resolveDisputeMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                                data-testid={`resolve-dispute-${dispute.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Resolve Dispute
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

          <TabsContent value="system" className="mt-6" data-testid="system-content">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">System Monitoring</h3>
                  <p className="text-muted-foreground">
                    View system logs, performance metrics, and security events.
                  </p>
                  <Button className="mt-4" data-testid="view-logs">
                    View System Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
