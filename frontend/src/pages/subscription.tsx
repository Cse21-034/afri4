import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

// This is the PayPal button component
const PayPalButton = ({ onSubscriptionCreated }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSubscription = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/payments/paypal/create-subscription');
      if (!response.ok) throw new Error('Failed to create subscription.');
      const data = await response.json();
      window.location.href = data.approvalUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={createSubscription} disabled={loading} className="w-full">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Subscribe with PayPal
    </Button>
  );
};

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [isSubLoading, setIsSubLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (user?.paypalSubscriptionId) {
        try {
          const response = await apiRequest('GET', `/api/payments/paypal/subscription/${user.paypalSubscriptionId}`);
          if (!response.ok) throw new Error('Failed to fetch subscription.');
          const data = await response.json();
          setSubscription(data.subscription);
        } catch (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
      setIsSubLoading(false);
    };

    if (user) {
      fetchSubscription();
    }
  }, [user, toast]);

  if (isLoading || isSubLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your subscription plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription && subscription.status === 'ACTIVE' ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Subscription is Active</p>
                  <p className="text-sm text-gray-600">Plan: Trucking Company Monthly</p>
                </div>
              </div>
              <Button variant="destructive">Cancel Subscription</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <XCircle className="h-6 w-6 text-gray-500" />
                 <div>
                    <p className="font-medium text-gray-700">No active subscription.</p>
                    <p className="text-sm text-gray-600">BWP 500/month</p>
                </div>
              </div>
              <PayPalButton onSubscriptionCreated={() => {
                // refetch subscription status
              }} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
