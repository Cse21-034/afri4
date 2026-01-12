import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Shield, TrendingUp, Truck, ShipIcon, CheckCircle } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background font-sans" data-testid="home-page">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-20" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6" data-testid="hero-title">
              Africa's Premier
              <span className="text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text">
                {" "}Freight Matching{" "}
              </span>
              Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto" data-testid="hero-description">
              Connect trucking companies and shipping entities across Africa. Real-time job matching, secure payments, and AI-powered logistics solutions.
            </p>

            {/* Signup buttons only for non-logged-in users */}
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/register?type=shipping">
                  <Button 
                    size="lg" 
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto"
                    data-testid="signup-shipping-button"
                  >
                    <ShipIcon className="mr-2 h-5 w-5" />
                    Sign Up as Shipping Entity
                  </Button>
                </Link>
                <Link href="/register?type=trucking">
                  <Button 
                    size="lg" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                    data-testid="signup-trucking-button"
                  >
                    <Truck className="mr-2 h-5 w-5" />
                    Sign Up as Trucking Company  
                  </Button>
                </Link>
              </div>
            )}

            {/* Features Grid */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center" data-testid="feature-realtime">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="text-primary h-8 w-8" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Real-Time Matching</h3>
                <p className="text-muted-foreground text-sm">Instant job alerts and AI-powered recommendations</p>
              </div>
              <div className="text-center" data-testid="feature-payments">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-secondary h-8 w-8" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Secure Payments</h3>
                <p className="text-muted-foreground text-sm">Secure payments with multi-currency support</p>
              </div>
              <div className="text-center" data-testid="feature-analytics">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-accent h-8 w-8" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground text-sm">Track performance and optimize operations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose LoadLink Africa?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for the African freight industry with features that matter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card data-testid="feature-card-1">
              <CardContent className="p-6">
                <CheckCircle className="h-12 w-12 text-secondary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Free for Shippers</h3>
                <p className="text-muted-foreground">Post unlimited jobs and connect with qualified carriers at no cost.</p>
              </CardContent>
            </Card>

            <Card data-testid="feature-card-2">
              <CardContent className="p-6">
                <Truck className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Verified Carriers</h3>
                <p className="text-muted-foreground">All trucking companies undergo document verification for your peace of mind.</p>
              </CardContent>
            </Card>

            <Card data-testid="feature-card-3">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real-Time Communication</h3>
                <p className="text-muted-foreground">Built-in messaging system for seamless coordination between parties.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5" data-testid="pricing-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground mb-12">Choose the plan that works best for your business</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Shipping Entity Plan */}
            <Card className="relative" data-testid="pricing-shipping">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Shipping Entities</h3>
                  <div className="text-4xl font-bold text-secondary mb-2">FREE</div>
                  <p className="text-muted-foreground">Post unlimited jobs</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-secondary mr-2" />
                    <span className="text-foreground">Unlimited job posting</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-secondary mr-2" />
                    <span className="text-foreground">Real-time carrier matching</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-secondary mr-2" />
                    <span className="text-foreground">Direct messaging with carriers</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-secondary mr-2" />
                    <span className="text-foreground">Performance analytics</span>
                  </li>
                </ul>

                {/* Only show signup button if user is not logged in */}
                {!user && (
                  <Link href="/register?type=shipping" className="block">
                    <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="start-shipping-button">
                      Start Shipping for Free
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Trucking Company Plan */}
            <Card className="relative border-primary" data-testid="pricing-trucking">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Trucking Companies</h3>
                  <div className="text-4xl font-bold text-primary mb-2">
                    BWP 500<span className="text-lg text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground">Full platform access</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    <span className="text-foreground">Unlimited job applications</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    <span className="text-foreground">Real-time job notifications</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    <span className="text-foreground">Multi-currency payments (BWP, ZAR, USD)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    <span className="text-foreground">Advanced analytics dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    <span className="text-foreground">3 simultaneous device logins</span>
                  </li>
                </ul>

                {/* Only show signup button if user is not logged in */}
                {!user && (
                  <Link href="/register?type=trucking" className="block">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid="start-trial-button">
                      Start 7-Day Free Trial
                    </Button>
                  </Link>
                )}

                <p className="text-xs text-muted-foreground mt-3 text-center">Or BWP 4,499/year (save 25%)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
