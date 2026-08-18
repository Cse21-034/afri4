import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

interface Advisory {
  id: number;
  title: string;
  body: string;
  country?: string | null;
  createdAt: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AdvisoriesCard({ className = "" }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ['/api/advisories'],
    queryFn: async () => (await apiRequest('GET', '/api/advisories?limit=5')).json(),
  });

  const advisories: Advisory[] = data?.advisories || [];
  if (advisories.length === 0) return null;

  return (
    <Card className={className} data-testid="advisories-card">
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm mb-3 text-primary flex items-center gap-1.5">
          <Megaphone className="h-4 w-4" /> Advisories
        </h3>
        <div className="space-y-3">
          {advisories.map((a) => (
            <div key={a.id} className="text-sm" data-testid={`advisory-${a.id}`}>
              <p className="font-medium">{a.title}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{a.body}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{formatDate(a.createdAt)}{a.country ? ` · ${a.country}` : ''}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
