import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background" data-testid="terms-page">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-foreground mb-6" data-testid="terms-title">
              Terms and Conditions
            </h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-muted-foreground mb-6">
                <strong>Last Updated:</strong> January 15, 2025
              </p>

              <p className="mb-6 text-foreground">
                Welcome to LoadLink Africa (the "Platform"), accessible at loadlink.africa, operated by LoadLink Africa (Pty) Ltd, 
                a company registered in Botswana. By accessing or using the Platform, you ("User," including Trucking Companies and 
                Shipping Entities) agree to be bound by these Terms and Conditions ("Terms"). If you do not agree, do not use the 
                Platform. These Terms are governed by the laws of Botswana.
              </p>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Platform Purpose</h2>
              <p className="mb-4 text-foreground">
                LoadLink Africa is a freight-matching platform connecting Trucking Companies (carriers) with Shipping Entities 
                (shippers, including companies, entities, or individuals). We provide tools for job postings, communication, 
                analytics, ratings, dispute ticketing, invoicing, feedback, account recovery, 2FA, and audit logging, but do not 
                participate in or control transactions, deliveries, or agreements between Users, and do not provide insurance.
              </p>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Eligibility</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Users must be 18 or older and legally capable of entering contracts.</li>
                <li>Trucking Companies must provide accurate fleet, registration, and document details for admin verification.</li>
                <li>Shipping Entities must provide accurate contact and cargo details.</li>
                <li>False information may lead to suspension.</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">User Accounts & Security</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Sign-up requires accurate details, email verification, document upload (Trucking Companies), and acceptance of these Terms and the Privacy Policy.</li>
                <li>Trucking Companies: Up to 3 simultaneous logins; exceeding may log out the oldest session.</li>
                <li>Optional 2FA available; we may require 2FA for high-risk activity.</li>
                <li>We maintain audit logs of key actions for security and compliance.</li>
                <li>Users are responsible for passwords and all account activity; notify support@loadlink.africa of any unauthorized access.</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Subscriptions and Payments</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Trucking Companies: BWP 500/month or BWP 4,499/year (via Stripe or bank transfer). Access to job postings requires an active subscription. Invoices generated (VAT not applied per current thresholds).</li>
                <li>Shipping Entities: Free to post jobs.</li>
                <li>Auto-renewal optional; cancel anytime via settings. Annual plan refunds may be pro-rated at our discretion.</li>
                <li>Non-payment results in suspension of job access.</li>
                <li>We are not liable for payment disputes or transaction errors with third-party processors.</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">User Responsibilities</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Trucking Companies: Ensure legal, safe cargo transport per agreements with shippers; provide ratings post-job.</li>
                <li>Shipping Entities: Provide accurate job details; promptly mark jobs as Taken/Completed; provide ratings.</li>
                <li>Compliance with Botswana and applicable cross-border laws is required.</li>
                <li>Prohibited: Fraud, harassment, illegal cargo, platform misuse.</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Platform Limitations and Liability</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>The Platform is provided "as is" without warranties.</li>
                <li>We do not guarantee job availability, performance, or outcomes.</li>
                <li>No insurance is provided.</li>
                <li>Users indemnify LoadLink Africa for claims arising from their use.</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Termination</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>We may suspend or terminate for violations (non-payment, fraud, abuse).</li>
                <li>Users may cancel; outstanding fees remain due.</li>
                <li>Upon termination, access to jobs/chats/data may be revoked subject to legal retention.</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Force Majeure</h2>
              <p className="mb-4 text-foreground">
                We are not liable for delays/failures caused by events beyond our control.
              </p>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Dispute Resolution; Governing Law</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>User-to-user disputes are between those Users; we may assist via tickets/mediation tools but are not a party.</li>
                <li>Disputes with LoadLink Africa: informal resolution first; failing that, arbitration in Gaborone, Botswana per the Botswana Institute of Arbitrators; Botswana law governs; exclusive jurisdiction in Gaborone courts for enforcement matters.</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Changes to Terms</h2>
              <p className="mb-4 text-foreground">
                We may update these Terms; continued use after changes implies acceptance. Updates posted at /terms.
              </p>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Contact</h2>
              <p className="mb-4 text-foreground">
                For questions about these Terms, contact us at:{" "}
                <a href="mailto:support@loadlink.africa" className="text-primary hover:underline">
                  support@loadlink.africa
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
