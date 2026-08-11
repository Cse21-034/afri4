import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ShipIcon, Truck } from "lucide-react";

interface CorridorPageProps {
  title: string;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  crossBorder: boolean;
  description: string;
  cargoNote: string;
  testId: string;
}

export default function CorridorPage({
  title,
  originCity,
  originCountry,
  destinationCity,
  destinationCountry,
  crossBorder,
  description,
  cargoNote,
  testId,
}: CorridorPageProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background" data-testid={testId}>
      <Navbar />

      <section className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
            <MapPin className="h-5 w-5" />
            <span className="text-sm font-medium">
              {originCity}, {originCountry} {crossBorder ? "→" : "↔"} {destinationCity}, {destinationCountry}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">{title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">{description}</p>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register?type=shipping">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto">
                  <ShipIcon className="mr-2 h-5 w-5" />
                  Post a Load on This Route
                </Button>
              </Link>
              <Link href="/register?type=trucking">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                  <Truck className="mr-2 h-5 w-5" />
                  Find Loads on This Route
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">Cargo on this corridor</h3>
                <p className="text-muted-foreground text-sm">{cargoNote}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">Verified transporters</h3>
                <p className="text-muted-foreground text-sm">
                  Trucking companies on LoadX Africa submit fleet and registration documents for admin review before
                  they can take jobs on this or any other route.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">Free to post</h3>
                <p className="text-muted-foreground text-sm">
                  Shipping entities post unlimited loads on this route at no cost and coordinate directly with
                  carriers via in-app messaging.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
