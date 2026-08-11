import { useState } from "react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Eye, EyeOff, AlertCircle } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const response = await apiRequest('POST', '/api/auth/login', data);
      
      const result = await response.json();
      
      // Check if 2FA is required
      if (result.requires2FA) {
        // Store credentials temporarily for 2FA verification
        sessionStorage.setItem('2fa_email', data.email);
        sessionStorage.setItem('2fa_password', data.password);
        
        toast({
          title: "2FA Required",
          description: result.message,
        });
        
        navigate('/verify-2fa');
        return;
      }
      
      // Normal login success
      localStorage.setItem('auth_token', result.token);
      
      toast({
        title: "Success",
        description: "Login successful!",
      });
      
      window.location.href = "/dashboard"; // Use full page reload to ensure auth state is updated
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Try to parse the error message
      try {
        // Extract error message from the error string (format: "401: {...}")
        const errorMatch = error.message.match(/^\d+: (.+)$/);
        if (errorMatch) {
          const errorText = errorMatch[1];
          const errorData = JSON.parse(errorText);
          
          // Check if email is not verified
          if (errorData.emailNotVerified) {
            setLoginError(errorData.message);
            // Store email for verification page
            sessionStorage.setItem('verification_email', data.email);
            return;
          }
          
          // Handle other specific errors
          if (errorData.message) {
            toast({
              title: "Login Failed",
              description: errorData.message,
              variant: "destructive",
            });
            return;
          }
        }
      } catch (parseError) {
        // If parsing fails, continue to generic error
      }
      
      // Generic error fallback
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="login-page">
      <Navbar />
      
      <div className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-accent to-orange-400 rounded-lg flex items-center justify-center mb-4">
                <Truck className="text-white text-2xl" />
              </div>
              <CardTitle className="text-2xl font-bold" data-testid="login-title">
                Sign In to LoadX Africa
              </CardTitle>
              <p className="text-muted-foreground">
                Access your freight matching dashboard
              </p>
            </CardHeader>
            
            <CardContent>
              {loginError && (
                <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 p-4 rounded-lg mb-6 flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-3">Email Verification Required</p>
                    <p className="text-sm mb-4">
                      {loginError}
                    </p>
                    <div className="flex gap-3">
                      <Link href="/resend-verification" className="inline-block">
                        <button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors">
                          Verify Your Email
                        </button>
                      </Link>
                      <button 
                        type="button"
                        onClick={() => setLoginError(null)}
                        className="text-amber-700 hover:text-amber-800 font-semibold text-sm underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="Enter your email"
                    data-testid="input-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-sm mt-1" data-testid="error-email">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...form.register("password")}
                      placeholder="Enter your password"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-destructive text-sm mt-1" data-testid="error-password">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                  data-testid="button-sign-in"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-4">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline" 
                  data-testid="forgot-password-link"
                >
                  Forgot your password?
                </Link>
                
                <div className="border-t pt-4">
                  <p className="text-muted-foreground text-sm">
                    Don't have an account?{" "}
                    <Link 
                      href="/register" 
                      className="text-primary hover:underline font-medium" 
                      data-testid="register-link"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
