import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Truck, Bell, LogOut, Settings, User } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const handlePricingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (location !== '/') {
      // Navigate to home first, then scroll after a short delay
      window.location.href = '/#pricing';
    } else {
      // Already on home page, scroll to pricing section with offset for navbar
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        const navbarHeight = 64; // Height of navbar in pixels
        const elementPosition = pricingSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Pricing', href: '/#pricing', onClick: handlePricingClick },
    { name: 'FAQ', href: '/faq' },
    { name: 'Resources', href: '/resources' },
  ];

  const userNavigation = user ? [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Chat', href: '/chat' },
    { name: 'Analytics', href: '/analytics' },
  ] : [];

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" data-testid="logo-link">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-accent to-orange-400 rounded-lg flex items-center justify-center">
                <Truck className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">LoadLink</h1>
                <p className="text-xs text-accent font-semibold">AFRICA</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              item.onClick ? (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={item.onClick}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  data-testid={`nav-link-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`nav-link-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Link>
              )
            ))}
            
            {user ? (
              <div className="flex items-center space-x-4">
                {userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${
                      location === item.href
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`user-nav-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <Button variant="ghost" size="sm" data-testid="notifications-button">
                  <Bell className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid="user-menu-trigger">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" data-testid="user-menu">
                    <Link href="/profile">
                      <DropdownMenuItem data-testid="menu-profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/account/security">
                      <DropdownMenuItem data-testid="menu-settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/subscription">
                      <DropdownMenuItem data-testid="menu-subscription">
                        <User className="mr-2 h-4 w-4" />
                        Subscription
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={logout} data-testid="menu-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" data-testid="sign-in-button">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button data-testid="get-started-button">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="mobile-menu-trigger">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80" data-testid="mobile-menu">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => (
                    item.onClick ? (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={item.onClick}
                        className="text-foreground hover:text-primary transition-colors text-lg cursor-pointer"
                        data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-foreground hover:text-primary transition-colors text-lg"
                        data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                      >
                        {item.name}
                      </Link>
                    )
                  ))}
                  
                  {user ? (
                    <>
                      <div className="border-t pt-4">
                        {userNavigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="block py-2 text-foreground hover:text-primary transition-colors"
                            data-testid={`mobile-user-nav-${item.name.toLowerCase()}`}
                          >
                            {item.name}
                          </Link>
                        ))}
                        <Link
                          href="/account/security"
                          className="block py-2 text-foreground hover:text-primary transition-colors"
                          data-testid={`mobile-user-nav-settings`}
                        >
                          Settings
                        </Link>
                        <Link
                          href="/subscription"
                          className="block py-2 text-foreground hover:text-primary transition-colors"
                          data-testid={`mobile-user-nav-subscription`}
                        >
                          Subscription
                        </Link>
                      </div>
                      <Button
                        variant="outline"
                        onClick={logout}
                        className="w-full mt-4"
                        data-testid="mobile-logout-button"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <div className="border-t pt-4 space-y-2">
                      <Link href="/login" className="block">
                        <Button variant="outline" className="w-full" data-testid="mobile-sign-in">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register" className="block">
                        <Button className="w-full" data-testid="mobile-get-started">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
