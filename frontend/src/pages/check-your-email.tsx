import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

export default function CheckYourEmail() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 text-primary">
              <MailCheck className="h-full w-full" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-foreground">
              Check Your Email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              We've sent a verification link to your email address. Please click the link to verify your account and continue.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Didn't receive the email? Check your spam folder or
              <Link href="/resend-verification" className="text-primary hover:underline ml-1">
                resend the verification email
              </Link>
              .
            </p>
            <Link href="/login">
              <Button className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
