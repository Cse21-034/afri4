import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionSuccessPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      const verifySubscription = async () => {
        try {
          // Send this to your backend to verify and update the user's subscription status
          await apiRequest('POST', `/api/payments/stripe/verify-session`, { sessionId });
          
          setStatus('Subscription activated successfully!');
          
          // Invalidate user query to refetch their data with new subscription status
          await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });

          // Redirect to dashboard after a delay
          setTimeout(() => navigate('/trucking-dashboard'), 3000);

        } catch (error) {
          setStatus('Failed to verify subscription.');
          toast({
            title: 'Error',
            description: 'Could not verify your subscription. Please contact support.',
            variant: 'destructive',
          });
        }
      };
      verifySubscription();
    } else {
      setStatus('No session ID found.');
    }
  }, [navigate, toast, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md text-center p-8">
        <CardHeader>
          <div className="mx-auto h-12 w-12 text-green-500">
            {status.includes('Failed') || status.includes('No subscription') ? 
              <Loader2 className="h-full w-full animate-spin" /> : 
              <CheckCircle className="h-full w-full" />}
          </div>
          <CardTitle className="mt-4">
            {status.includes('Failed') ? 'Verification Failed' : 'Subscription Verification'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{status}</p>
          {status.includes('successfully') && <p>Redirecting to your dashboard...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
