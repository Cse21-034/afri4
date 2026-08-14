import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/ui/navbar";
import { BarChart3, TrendingUp, Package, Clock, Target } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Analytics() {
  const { user } = useAuth();

  // Fetch user's jobs for analytics
  const { data: myJobsData, isLoading } = useQuery({
    queryKey: ['/api/jobs/my'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/jobs/my');
      return response.json();
    }
  });

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view analytics.</div>;
  }

  const jobs = myJobsData?.jobs || [];
  const completedJobs = jobs.filter((job: any) => job.status === 'completed');
  const activeJobs = jobs.filter((job: any) => job.status === 'taken');
  const availableJobs = jobs.filter((job: any) => job.status === 'available');

  const completionRate = jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0;

  // Calculate delivery times for trucking companies
  const averageDeliveryTime = user.role === 'trucking_company' && completedJobs.length > 0 
    ? completedJobs.reduce((sum: number, job: any) => {
        if (job.takenAt && job.completedAt) {
          const days = (new Date(job.completedAt).getTime() - new Date(job.takenAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0) / completedJobs.length
    : 0;

  return (
    <div className="min-h-screen bg-background" data-testid="analytics-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" data-testid="analytics-title">
            Analytics & Performance
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">Track your business performance and optimize operations</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* KPI Cards -- 3 across even on mobile; icon/subtext only show once there's room at sm+ */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-8">
              <Card data-testid="kpi-total-jobs">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center gap-2 sm:flex-row sm:items-center sm:justify-between sm:text-left sm:gap-0">
                    <div>
                      <p className="text-[11px] sm:text-sm text-muted-foreground leading-tight">
                        {user.role === 'trucking_company' ? 'Jobs Taken' : 'Jobs Posted'}
                      </p>
                      <p className="text-lg sm:text-3xl font-bold text-foreground">{jobs.length}</p>
                      <p className="hidden sm:block text-sm text-secondary mt-1">
                        {user.role === 'trucking_company' ? 'Total applications' : 'Total listings'}
                      </p>
                    </div>
                    <div className="hidden sm:flex w-12 h-12 bg-primary/10 rounded-lg items-center justify-center">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="kpi-completed">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center gap-2 sm:flex-row sm:items-center sm:justify-between sm:text-left sm:gap-0">
                    <div>
                      <p className="text-[11px] sm:text-sm text-muted-foreground leading-tight">Completed</p>
                      <p className="text-lg sm:text-3xl font-bold text-foreground">{completedJobs.length}</p>
                      <p className="hidden sm:block text-sm text-secondary mt-1">{completionRate.toFixed(1)}% success rate</p>
                    </div>
                    <div className="hidden sm:flex w-12 h-12 bg-secondary/10 rounded-lg items-center justify-center">
                      <Target className="h-6 w-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {user.role === 'trucking_company' && (
                <Card data-testid="kpi-delivery-time">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col items-center text-center gap-2 sm:flex-row sm:items-center sm:justify-between sm:text-left sm:gap-0">
                      <div>
                        <p className="text-[11px] sm:text-sm text-muted-foreground leading-tight">Avg Delivery Time</p>
                        <p className="text-lg sm:text-3xl font-bold text-foreground">{averageDeliveryTime.toFixed(1)}</p>
                        <p className="hidden sm:block text-sm text-secondary mt-1">days per job</p>
                      </div>
                      <div className="hidden sm:flex w-12 h-12 bg-primary/10 rounded-lg items-center justify-center">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {user.role === 'shipping_entity' && (
                <Card data-testid="kpi-active-jobs">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col items-center text-center gap-2 sm:flex-row sm:items-center sm:justify-between sm:text-left sm:gap-0">
                      <div>
                        <p className="text-[11px] sm:text-sm text-muted-foreground leading-tight">Active Jobs</p>
                        <p className="text-lg sm:text-3xl font-bold text-foreground">{activeJobs.length + availableJobs.length}</p>
                        <p className="hidden sm:block text-sm text-secondary mt-1">currently posted</p>
                      </div>
                      <div className="hidden sm:flex w-12 h-12 bg-accent/10 rounded-lg items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
              <Card data-testid="chart-performance">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Job Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-secondary rounded"></div>
                        <span className="text-sm">Completed</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{completedJobs.length}</span>
                        <span className="text-muted-foreground ml-2">
                          ({jobs.length > 0 ? ((completedJobs.length / jobs.length) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-accent rounded"></div>
                        <span className="text-sm">
                          {user.role === 'trucking_company' ? 'In Progress' : 'Taken'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{activeJobs.length}</span>
                        <span className="text-muted-foreground ml-2">
                          ({jobs.length > 0 ? ((activeJobs.length / jobs.length) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </div>

                    {user.role === 'shipping_entity' && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-primary rounded"></div>
                          <span className="text-sm">Available</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{availableJobs.length}</span>
                          <span className="text-muted-foreground ml-2">
                            ({jobs.length > 0 ? ((availableJobs.length / jobs.length) * 100).toFixed(0) : 0}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="chart-trends">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {jobs.slice(0, 5).map((job: any, index: number) => (
                      <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium text-sm truncate">
                            {job.cargoType} - {job.cargoWeight}kg
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            job.status === 'completed' ? 'bg-secondary/10 text-secondary' :
                            job.status === 'taken' ? 'bg-accent/10 text-accent' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Route Performance (if applicable) */}
            {user.role === 'trucking_company' && completedJobs.length > 0 && (
              <Card data-testid="route-performance">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Route Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Route Analytics</h3>
                    <p className="text-muted-foreground">
                      Detailed route performance analytics coming soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Data State */}
            {jobs.length === 0 && (
              <Card data-testid="no-data">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
                  <p className="text-muted-foreground mb-6">
                    {user.role === 'trucking_company' 
                      ? 'Start by taking your first job to see analytics here.'
                      : 'Post your first job to start seeing analytics data.'
                    }
                  </p>
                  <Link href="/dashboard">
                    <Button data-testid="get-started-analytics">
                      {user.role === 'trucking_company' ? 'Browse Jobs' : 'Post a Job'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
