import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "What is LoadX Africa?",
      answer: "LoadX Africa connects Trucking Companies and Shipping Entities for efficient freight transport in Botswana and across Africa. Our AI-powered platform provides real-time job matching, secure payments, and comprehensive logistics solutions."
    },
    {
      question: "How do I sign up?",
      answer: "Click on either 'Sign Up as Trucking Company' or 'Sign Up as Shipping Entity' on our homepage, fill out the registration form, verify your email, and upload required documents for trucking companies. You'll also need to accept our Terms and Conditions and Privacy Policy."
    },
    {
      question: "Are there fees for Shipping Entities?",
      answer: "No. Shipping Entities can post and manage jobs completely free of charge. There are no hidden fees or commissions."
    },
    {
      question: "What are the trucking subscription costs?",
      answer: "Trucking Companies pay BWP 500/month or BWP 4,499/year (10% discount). This includes unlimited job access, real-time notifications, chat functionality, analytics dashboard, and up to 3 simultaneous device logins. We offer a 7-day free trial for new users."
    },
    {
      question: "What happens if my subscription lapses?",
      answer: "If your subscription expires, job access will be blocked and you'll see a 'Renew Now' banner. We provide a 3-day grace period after failed renewal attempts before completely restricting access."
    },
    {
      question: "Can I pay by bank transfer?",
      answer: "Yes. For bank transfer payments, email your proof of payment to support@loadxafrica.com for manual confirmation and account activation."
    },
    {
      question: "Do you send notifications?",
      answer: "Yes—we send both email and in-app notifications for new job matches, payment confirmations, disputes, subscription updates, and job status changes. You can customize these notification preferences in your account settings."
    },
    {
      question: "How is my data secured?",
      answer: "We use industry-standard security measures including HTTPS encryption, hashed passwords, optional 2FA, and comprehensive audit logging. All data is protected according to Botswana's Data Protection Act, 2018. See our Privacy Policy for full details."
    },
    {
      question: "Do you resolve disputes between shippers and truckers?",
      answer: "We provide dispute resolution tools and optional mediation services, but disputes are ultimately between the involved parties. For disputes involving LoadX Africa, we follow arbitration procedures in Gaborone as outlined in our Terms and Conditions."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes—you can cancel anytime via your account settings. Annual subscription holders may receive pro-rated refunds at our discretion."
    },
    {
      question: "How does chat work?",
      answer: "Trucking Companies can message Shipping Entities about open jobs only. Once a job is taken or completed, chat functionality may be limited. All conversations are private and logged securely."
    },
    {
      question: "Is there a device limit?",
      answer: "Yes—Trucking Company accounts support up to 3 simultaneous logins. You can manage your devices in account settings and use the 'log out all devices' feature if needed."
    },
    {
      question: "Do you provide insurance?",
      answer: "No. LoadX Africa does not provide insurance, act as an insurance broker, or give insurance advice. Users are solely responsible for arranging their own coverage. We provide links to external insurance providers on our Resources page for your convenience."
    },
    {
      question: "Can I export my data?",
      answer: "Yes—you can export your job history, analytics data, and dispute records in CSV/PDF formats directly from your dashboard."
    },
    {
      question: "How do I recover my account?",
      answer: "Use the password reset feature via email (includes reCAPTCHA verification) or the account unlock feature if your account is locked after multiple failed login attempts."
    },
    {
      question: "How long do you keep logs?",
      answer: "Key audit logs are retained for at least 12 months for security and compliance purposes. Other data retention periods vary by type—see our Privacy Policy for complete details."
    }
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="faq-page">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="faq-title">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about LoadX Africa
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <Accordion type="single" collapsible className="w-full" data-testid="faq-accordion">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} data-testid={`faq-item-${index}`}>
                  <AccordionTrigger className="text-left" data-testid={`faq-question-${index}`}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground" data-testid={`faq-answer-${index}`}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 p-6 bg-muted/30 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-4">
                Can't find the answer you're looking for? Get in touch with our support team.
              </p>
              <a 
                href="mailto:support@loadxafrica.com"
                className="text-primary hover:underline font-medium"
                data-testid="contact-support-link"
              >
                Contact Support
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
