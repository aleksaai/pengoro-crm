import { useState, useEffect, useMemo } from "react";
import { Search, FileText, Users, BarChart3, CheckSquare, RotateCcw, TrendingUp, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/useLeads";
import { useCustomerProducts } from "@/hooks/useCustomerProducts";
import { cn } from "@/lib/utils";

// Text normalization helpers for robust, accent-insensitive search
const normalize = (str: string): string =>
  (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (str: string): string[] => normalize(str).split(" ").filter(Boolean);

const words = (str: string): string[] => tokenize(str);

// Check that every token appears in at least one of the provided fields
const tokensMatch = (tokens: string[], fields: string[]): boolean =>
  tokens.every((t) => fields.some((f) => f.includes(t)));

const navigationItems = [
  { title: "Customers", url: "/customers", icon: UserCheck, description: "Manage customer data and relationships" },
  { title: "Pipeline", url: "/", icon: BarChart3, description: "View sales pipeline and deals" },
  { title: "Leads", url: "/leads", icon: Users, description: "Manage and track leads" },
  { title: "Winbacks", url: "/winbacks", icon: RotateCcw, description: "Customer winback campaigns" },
  { title: "Analytics", url: "/analytics", icon: TrendingUp, description: "View analytics and reports" },
  { title: "Tasks", url: "/tasks", icon: CheckSquare, description: "Manage tasks and todos" },
];

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'lead' | 'customer';
  url?: string;
  icon: React.ComponentType<any>;
  action?: () => void;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { leads } = useLeads();
  const { products, loading: productsLoading } = useCustomerProducts();

  const searchResults = useMemo(() => {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    const results: SearchResult[] = [];

    // Pages: match if all tokens appear in title or description
    navigationItems.forEach((item) => {
      const titleN = normalize(item.title);
      const descN = normalize(item.description);
      const combined = `${titleN} ${descN}`;
      if (tokens.every((t) => combined.includes(t))) {
        results.push({
          id: `nav-${item.title}`,
          title: item.title,
          description: item.description,
          type: "page",
          url: item.url,
          icon: item.icon,
          action: () => navigate(item.url),
        });
      }
    });

    // Leads: token-based AND search with relevance scoring
    if (leads && leads.length > 0) {
      const leadMatches: { result: SearchResult; score: number }[] = [];

      leads.forEach((lead) => {
        const nameN = normalize(lead.name || "");
        const emailN = normalize(lead.email || "");
        const phoneN = normalize(lead.phone || "");
        const statusN = normalize(lead.status || "");
        const sourceN = normalize(lead.source || "");
        const assignedN = normalize(lead.assigned_to || "");
        const productNs = (lead.interested_products || []).map((p) => normalize(String(p)));

        const fields = [nameN, emailN, phoneN, statusN, sourceN, assignedN, ...productNs];

        if (!tokensMatch(tokens, fields)) return;

        let score = 0;
        const nameWords = words(lead.name || "");

        tokens.forEach((tok) => {
          if (nameN === tok) score += 120;
          else if (nameWords.some((w) => w.startsWith(tok))) score += 90;
          else if (nameN.includes(tok)) score += 60;

          if (emailN.startsWith(tok)) score += 50;
          else if (emailN.includes(tok)) score += 30;

          if (phoneN.includes(tok)) score += 20;
          if (statusN.includes(tok)) score += 12;
          if (sourceN.includes(tok)) score += 10;
          if (assignedN.includes(tok)) score += 8;
          if (productNs.some((p) => p.includes(tok))) score += 8;
        });

        leadMatches.push({
          score,
          result: {
            id: `lead-${lead.id}`,
            title: lead.name,
            description: `${lead.email} • ${lead.status} • ${lead.source || "No source"}`,
            type: "lead",
            icon: Users,
            action: () => navigate(`/leads/${lead.id}`),
          },
        });
      });

      leadMatches.sort((a, b) => b.score - a.score).forEach((m) => results.push(m.result));
    }

    // Customers: token-based AND across lead name, provider company, and product name
    if (products && products.length > 0) {
      const bestByCustomer = new Map<string, { score: number; result: SearchResult }>();

      products.forEach((product) => {
        const customerId = String(product.customer_id || "");
        if (!customerId) return;
        const lead = leads?.find((l) => l.id === customerId);

        const nameN = normalize(lead?.name || "");
        const providerN = normalize(product.provider_company || "");
        const productNameN = normalize(product.product_name || "");

        const fields = [nameN, providerN, productNameN];
        if (!tokensMatch(tokens, fields)) return;

        let score = 0;
        const nameWords = words(lead?.name || "");
        tokens.forEach((tok) => {
          if (nameWords.some((w) => w.startsWith(tok))) score += 30;
          else if (nameN.includes(tok)) score += 20;
          if (providerN.includes(tok)) score += 12;
          if (productNameN.includes(tok)) score += 10;
        });

        const count = products.filter((p) => String(p.customer_id || "") === customerId).length;

        const result: SearchResult = {
          id: `customer-${customerId}`,
          title: lead?.name || "Customer",
          description: `Customer • ${count} products`,
          type: "customer",
          icon: UserCheck,
          action: () => navigate("/customers"),
        };

        const existing = bestByCustomer.get(customerId);
        if (!existing || score > existing.score) {
          bestByCustomer.set(customerId, { score, result });
        }
      });

      Array.from(bestByCustomer.values())
        .sort((a, b) => b.score - a.score)
        .forEach((entry) => results.push(entry.result));
    }

    return results.slice(0, 50);
  }, [query, leads, products, navigate]);

  const handleSelect = (result: SearchResult) => {
    if (result.action) {
      result.action();
    }
    setOpen(false);
    setQuery("");
  };

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "relative h-9 w-full max-w-sm justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12",
            "hover:bg-muted/80 focus:bg-muted/80"
          )}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">Search pages, leads, customers...</span>
          <span className="inline-flex lg:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search pages, leads, customers..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            {searchResults.length > 0 && (
              <>
                {/* Pages */}
                {searchResults.filter(r => r.type === 'page').length > 0 && (
                  <CommandGroup heading="Pages">
                    {searchResults
                      .filter(r => r.type === 'page')
                      .map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <result.icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{result.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.description}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {/* Leads */}
                {searchResults.filter(r => r.type === 'lead').length > 0 && (
                  <CommandGroup heading="Leads">
                    {searchResults
                      .filter(r => r.type === 'lead')
                      .map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <result.icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{result.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.description}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {/* Customers */}
                {searchResults.filter(r => r.type === 'customer').length > 0 && (
                  <CommandGroup heading="Customers">
                    {searchResults
                      .filter(r => r.type === 'customer')
                      .map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <result.icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{result.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.description}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}