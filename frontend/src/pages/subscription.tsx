import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const StripeSubscriptionButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSubscription = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/payments/stripe/create-checkout-session');
      if (!response.ok) throw new Error('Failed to create subscription.');
      const data = await response.json();
      
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (error) {
          throw new Error(error.message);
        }
      }
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
      Subscribe with Stripe
    </Button>
  );
};

function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [isSubLoading, setIsSubLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      // TODO: Implement a way to get subscription status from your backend
      // For now, we'll just use the user's subscription status
      if (user?.subscriptionStatus === 'active') {
        // You might want to fetch more subscription details from your backend
        setSubscription({ status: 'ACTIVE' });
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <StripeSubscriptionButton />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default function SubscriptionPageWrapper() {
  if (!stripeKey) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 py-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800">
                    Stripe payment system is currently unavailable. Please try again later.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <SubscriptionPage />
    </Elements>
  );
}
