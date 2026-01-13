import { Link } from "wouter";
import { Truck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/loadxlogo.jpeg" alt="LoadX Africa" className="h-12 w-auto" />
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Africa's premier freight matching platform connecting trucking companies and shipping entities across the continent.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="social-facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="social-twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="social-linkedin">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="footer-about">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="footer-careers">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="footer-contact">
                  Contact
                </a>
              </li>
              <li>
                <Link href="/resources" className="text-muted-foreground hover:text-foreground" data-testid="footer-resources">
                  Insurance Resources
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground" data-testid="footer-terms">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground" data-testid="footer-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground" data-testid="footer-faq">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="footer-support">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 LoadLink Africa. All rights reserved. | Gaborone, Botswana</p>
        </div>
      </div>
    </footer>
  );
}
