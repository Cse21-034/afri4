import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background" data-testid="privacy-page">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-foreground mb-6" data-testid="privacy-title">
              Privacy Policy
            </h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-muted-foreground mb-6">
                <strong>Last Updated:</strong> January 15, 2025
              </p>

              <p className="mb-6 text-foreground">
                LoadLink Africa (Pty) Ltd ("we," "us," "our") operates loadlink.africa and is committed to protecting your privacy 
                in compliance with Botswana's Data Protection Act, 2018. By using the Platform, you agree to this Policy.
              </p>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Data We Collect</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
                <li><strong>Registration Data:</strong> Names, emails, phone numbers, addresses, business registration numbers, fleet details, documents (Trucking Companies).</li>
                <li><strong>Payment Data:</strong> Processed via Stripe or bank transfers; we do not store full card numbers.</li>
                <li><strong>Usage Data:</strong> Job postings, chat logs, ratings, dispute records, invoices, feedback, notifications, device info, IP, login times, preferences.</li>
                <li><strong>Security Data:</strong> 2FA configuration, recovery codes (hashed), audit logs of key actions.</li>
                <li><strong>Support Data:</strong> Messages and attachments sent via support or disputes.</li>
                <li><strong>Analytics Data:</strong> Aggregated/anonymous metrics on Platform usage.</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">How We Use Data</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
                <li>Create/manage accounts; authenticate (including 2FA); verify emails/documents; recover accounts.</li>
                <li>Provide services: matching, jobs display, chat, ratings, disputes, invoices, notifications.</li>
                <li>Process payments; generate/store invoices.</li>
                <li>Improve Platform via analytics.</li>
                <li>Security & Compliance: fraud detection, AML-aligned monitoring, audit logging.</li>
                <li>Legal compliance and responding to lawful requests.</li>
                <li>Optional marketing with consent (opt-out anytime).</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Sharing</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
                <li><strong>Between Users:</strong> job-related contact and details necessary to coordinate.</li>
                <li><strong>Service Providers:</strong> Stripe, email delivery, hosting/monitoring vendors under confidentiality.</li>
                <li><strong>Legal Compliance:</strong> Where required by law or court order.</li>
              </ul>
              <p className="mb-4 text-foreground">
                We do not sell data for third-party marketing.
              </p>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Security</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
                <li>HTTPS, encryption in transit; hashed passwords; access controls.</li>
                <li>2FA support; audit logs retained for at least 12 months.</li>
                <li>Regular backups; breach notification to users and the Data Protection Authority within statutory timelines.</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Your Rights (Botswana DPA 2018)</h2>
              <p className="mb-4 text-foreground">
                Access, correction, deletion (subject to retention duties), objection to marketing, and complaint to the Data Protection Authority. 
                Contact{" "}
                <a href="mailto:support@loadlink.africa" className="text-primary hover:underline">
                  support@loadlink.africa
                </a>.
              </p>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Cookies & Tracking</h2>
              <p className="mb-4 text-foreground">
                Session, authentication, and analytics cookies; manage via browser settings (functionality may be affected).
              </p>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Data Retention</h2>
              <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
                <li>Tax/financial records: 7 years (or as required).</li>
                <li>Inactive accounts: deleted after 12 months of inactivity (with prior notice).</li>
                <li>Job/chat/rating/dispute/invoice/feedback/notification data archived and deleted after 24 months unless legally required.</li>
                <li>Audit logs: retained minimum 12 months.</li>
              </ul>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Cross-Border Transfers</h2>
              <p className="mb-4 text-foreground">
                Data may be processed outside Botswana with safeguards and contracts ensuring adequate protection.
              </p>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Updates</h2>
              <p className="mb-4 text-foreground">
                Policy updates posted at /privacy; continued use indicates consent to changes.
              </p>

              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Contact</h2>
              <p className="mb-4 text-foreground">
                For questions about this Privacy Policy, contact us at:{" "}
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
