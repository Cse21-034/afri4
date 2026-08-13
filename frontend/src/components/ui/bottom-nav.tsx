import { Link, useLocation } from "wouter";
import { Home, MessageSquare, TrendingUp, User } from "lucide-react";

const tabs = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Profile", href: "/profile", icon: User },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
      data-testid="bottom-nav"
    >
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const isActive = location === tab.href || (tab.href === "/dashboard" && location.startsWith("/dashboard"));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`bottom-nav-${tab.name.toLowerCase()}`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
