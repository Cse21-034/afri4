import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield, AlertTriangle, Phone, Mail, MapPin } from "lucide-react";

export default function Resources() {
  const insuranceProviders = [
    {
      name: "Botswana Insurance Company",
      type: "Cargo & Vehicle Insurance",
      description: "Comprehensive cargo and commercial vehicle insurance solutions for the transport industry.",
      contact: {
        phone: "+267 318 5000",
        email: "info@bic.co.bw",
        website: "https://www.bic.co.bw"
      },
      services: ["Cargo Insurance", "Motor Insurance", "Goods in Transit", "Public Liability"]
    },
    {
      name: "Metropolitan Life Botswana",
      type: "Commercial Insurance",
      description: "Commercial insurance products including cargo protection and business liability coverage.",
      contact: {
        phone: "+267 370 0700",
        email: "info@metropolitan.co.bw",
        website: "https://www.metropolitan.co.bw"
      },
      services: ["Commercial Vehicle", "Cargo Coverage", "Business Insurance", "Liability Protection"]
    },
    {
      name: "Hollard Insurance Botswana",
      type: "Transport Insurance",
      description: "Specialized transport and logistics insurance solutions for freight operations.",
      contact: {
        phone: "+267 318 8200",
        email: "info@hollard.co.bw",
        website: "https://www.hollard.co.bw"
      },
      services: ["Freight Insurance", "Fleet Coverage", "Transit Insurance", "Equipment Protection"]
    },
    {
      name: "Guardrisk Insurance",
      type: "Specialized Freight Insurance",
      description: "Pan-African insurance solutions with expertise in cross-border freight operations.",
      contact: {
        phone: "+267 391 2100",
        email: "botswana@guardrisk.co.za",
        website: "https://www.guardrisk.co.za"
      },
      services: ["Cross-border Coverage", "High-value Cargo", "Mining Equipment", "Hazardous Materials"]
    }
  ];

  const resources = [
    {
      title: "Cargo Insurance Guide",
      description: "Understanding different types of cargo insurance and what coverage you need.",
      type: "Guide",
      link: "#"
    },
    {
      title: "Cross-border Transport Requirements",
      description: "Insurance and documentation requirements for freight across African borders.",
      type: "Regulation",
      link: "#"
    },
    {
      title: "Claims Process Handbook",
      description: "Step-by-step guide to filing insurance claims for cargo damage or loss.",
      type: "Handbook",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="resources-page">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="resources-title">
            Insurance Resources
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Protect your cargo and business with trusted insurance providers and comprehensive coverage options
          </p>
        </div>

        {/* Important Disclaimer */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Important Disclaimer</h3>
                <p className="text-amber-700 text-sm leading-relaxed">
                  <strong>LoadX Africa does not provide insurance, act as an insurance broker, or provide insurance advice.</strong>
                  We are not affiliated with any of the insurance providers listed below. All insurance arrangements must be made directly 
                  with the providers. Users are solely responsible for researching, selecting, and purchasing appropriate insurance coverage 
                  for their cargo and business operations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Providers */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Trusted Insurance Providers in Botswana
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insuranceProviders.map((provider, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`insurance-provider-${index}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {provider.type}
                      </Badge>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {provider.description}
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{provider.contact.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a 
                        href={`mailto:${provider.contact.email}`}
                        className="text-primary hover:underline"
                        data-testid={`email-${index}`}
                      >
                        {provider.contact.email}
                      </a>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2">Services Offered:</h4>
                    <div className="flex flex-wrap gap-1">
                      {provider.services.map((service, serviceIndex) => (
                        <Badge key={serviceIndex} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(provider.contact.website, '_blank')}
                    data-testid={`visit-website-${index}`}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Educational Resources</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow" data-testid={`resource-${index}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline">{resource.type}</Badge>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{resource.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{resource.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled
                    data-testid={`resource-link-${index}`}
                  >
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <Card className="bg-muted/30">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-4">Need Help Finding Insurance?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              While we cannot provide insurance advice, our support team can help connect you with the resources 
              and contacts you need to protect your freight operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@loadxafrica.com">
                <Button data-testid="contact-support">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </a>
              <Button variant="outline" data-testid="view-faq">
                Visit FAQ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
