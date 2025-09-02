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
  const { leads, loading: leadsLoading } = useLeads();
  const { products, loading: productsLoading } = useCustomerProducts();

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    // Search navigation items
    navigationItems.forEach(item => {
      if (
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: `nav-${item.title}`,
          title: item.title,
          description: item.description,
          type: 'page',
          url: item.url,
          icon: item.icon,
          action: () => navigate(item.url)
        });
      }
    });

    // Search leads
    if (!leadsLoading) {
      leads.forEach(lead => {
        if (
          lead.name.toLowerCase().includes(searchTerm) ||
          lead.email.toLowerCase().includes(searchTerm) ||
          (lead.phone && lead.phone.toLowerCase().includes(searchTerm))
        ) {
          results.push({
            id: `lead-${lead.id}`,
            title: lead.name,
            description: `${lead.email} • ${lead.status} • ${lead.source || 'No source'}`,
            type: 'lead',
            icon: Users,
            action: () => navigate(`/lead/${lead.id}`)
          });
        }
      });
    }

    // Search customers (from customer products)
    if (!productsLoading) {
      const uniqueCustomers = new Map();
      products.forEach(product => {
        const customerId = product.customer_id;
        if (!uniqueCustomers.has(customerId)) {
          // Find matching lead for this customer
          const matchingLead = leads.find(lead => lead.id === customerId);
          if (matchingLead && matchingLead.name.toLowerCase().includes(searchTerm)) {
            uniqueCustomers.set(customerId, {
              id: `customer-${customerId}`,
              title: matchingLead.name,
              description: `Customer • ${products.filter(p => p.customer_id === customerId).length} products`,
              type: 'customer',
              icon: UserCheck,
              action: () => navigate('/customers')
            });
          }
        }
      });
      results.push(...Array.from(uniqueCustomers.values()));
    }

    return results.slice(0, 8); // Limit results
  }, [query, leads, products, leadsLoading, productsLoading, navigate]);

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