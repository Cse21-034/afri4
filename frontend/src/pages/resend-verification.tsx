import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailQuestion } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ResendFormData = z.infer<typeof resendSchema>;

export default function ResendVerification() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const form = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
  });

  const onSubmit = async (data: ResendFormData) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/auth/resend-verification', data);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }
      
      toast({
        title: "Success",
        description: result.message,
      });

      setIsSuccess(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="resend-verification-page">
      <Navbar />
      
      <div className="py-20 bg-muted/30">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MailQuestion className="text-primary text-3xl" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Resend Verification Email
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {isSuccess ? (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    If an account exists for the email you entered, a new verification link has been sent. Please check your inbox.
                  </p>
                  <Link href="/login">
                    <Button variant="outline">Back to Login</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground text-center mb-6">
                    Enter your email address below to receive a new verification link.
                  </p>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                        placeholder="you@example.com"
                        data-testid="input-email"
                      />
                      {form.formState.errors.email && (
                        <p className="text-destructive text-sm mt-1">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-resend"
                    >
                      {isLoading ? "Sending..." : "Resend Verification Email"}
                    </Button>
                  </form>
                </>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm">
                  Remember your password?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
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
