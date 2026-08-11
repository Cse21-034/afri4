import { CheckCircle, Star, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

function MockFrame({ children }: { children: ReactNode }) {
  return (
    <div className="w-44 rounded-xl border border-border bg-card shadow-lg overflow-hidden mx-auto">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-muted/40">
        <span className="w-2 h-2 rounded-full bg-destructive/50" />
        <span className="w-2 h-2 rounded-full bg-accent/50" />
        <span className="w-2 h-2 rounded-full bg-secondary/50" />
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function PostJobMockup() {
  return (
    <MockFrame>
      <p className="text-[10px] font-semibold text-foreground mb-2">New Job</p>
      <div className="space-y-1.5 mb-2">
        <div className="h-2 rounded bg-muted w-full" />
        <div className="h-2 rounded bg-muted w-4/5" />
      </div>
      <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-2">
        <span>Gaborone</span>
        <span>→</span>
        <span>Francistown</span>
      </div>
      <div className="h-6 rounded-md bg-primary flex items-center justify-center">
        <span className="text-[9px] font-medium text-primary-foreground">Post Job</span>
      </div>
    </MockFrame>
  );
}

export function MatchedMockup() {
  return (
    <MockFrame>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">T</div>
        <div>
          <p className="text-[9px] font-semibold text-foreground leading-tight">Tlou Transport</p>
          <p className="text-[8px] text-muted-foreground leading-tight">accepted your job</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-secondary">
        <CheckCircle className="w-3 h-3" />
        <span className="text-[9px] font-medium">Matched</span>
      </div>
    </MockFrame>
  );
}

export function ChatMockup() {
  return (
    <MockFrame>
      <p className="text-[10px] font-semibold text-foreground mb-2">Chat</p>
      <div className="space-y-1.5">
        <div className="bg-muted rounded-lg rounded-bl-sm px-2 py-1 max-w-[85%] text-[8px] text-foreground">
          Pickup at 8am?
        </div>
        <div className="bg-primary rounded-lg rounded-br-sm px-2 py-1 max-w-[85%] ml-auto text-[8px] text-primary-foreground">
          Confirmed
        </div>
      </div>
    </MockFrame>
  );
}

export function RatingMockup() {
  return (
    <MockFrame>
      <p className="text-[10px] font-semibold text-foreground mb-1">Job Completed</p>
      <p className="text-[8px] text-muted-foreground mb-2">Rate this delivery</p>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-3 h-3 fill-accent text-accent" />
        ))}
      </div>
    </MockFrame>
  );
}

export function FreeJobMockup() {
  return (
    <MockFrame>
      <p className="text-[10px] font-semibold text-foreground mb-2">Post a Job</p>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-lg font-bold text-secondary">BWP 0</span>
        <span className="text-[8px] text-muted-foreground">/job</span>
      </div>
      <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
        <CheckCircle className="w-2.5 h-2.5 text-secondary" />
        <span>Unlimited postings</span>
      </div>
    </MockFrame>
  );
}

export function VerifiedMockup() {
  return (
    <MockFrame>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">M</div>
        <p className="text-[9px] font-semibold text-foreground leading-tight">Motlogelwa Freight</p>
      </div>
      <div className="inline-flex items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5">
        <ShieldCheck className="w-3 h-3 text-primary" />
        <span className="text-[8px] font-medium text-primary">Documents Verified</span>
      </div>
    </MockFrame>
  );
}

export function InboxMockup() {
  return (
    <MockFrame>
      <p className="text-[10px] font-semibold text-foreground mb-2">Messages</p>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
          <div className="h-1.5 rounded bg-muted flex-1" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 flex-shrink-0" />
          <div className="h-1.5 rounded bg-muted/60 flex-1" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 flex-shrink-0" />
          <div className="h-1.5 rounded bg-muted/60 w-3/5" />
        </div>
      </div>
    </MockFrame>
  );
}
