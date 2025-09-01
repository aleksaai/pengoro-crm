import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight } from "lucide-react";

interface LeadHistoryDetailsProps {
  changedFields: Record<string, any> | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
}

const getFieldDisplayName = (field: string): string => {
  const fieldMap: Record<string, string> = {
    name: "Name",
    email: "Email",
    phone: "Phone Number",
    assigned_to: "Assigned Agent",
    status: "Status/Stage",
    interested_products: "Interested Products",
    source: "Lead Source",
  };
  return fieldMap[field] || field;
};

const formatFieldValue = (field: string, value: any): string => {
  if (value === null || value === undefined) return "—";
  
  if (field === "interested_products" && Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "None";
  }
  
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  
  return String(value);
};

export function LeadHistoryDetails({ changedFields, oldValues, newValues }: LeadHistoryDetailsProps) {
  const [open, setOpen] = useState(false);

  // Don't show the magnifying glass if there are no detailed changes
  if (!changedFields || !oldValues || !newValues || Object.keys(changedFields).length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <Search className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Change Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The following fields were modified:
          </p>
          
          <div className="space-y-3">
            {Object.entries(changedFields).map(([field, _]) => {
              const oldValue = oldValues[field];
              const newValue = newValues[field];
              
              return (
                <div key={field} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {getFieldDisplayName(field)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center text-sm">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Before</div>
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 min-h-[2rem] flex items-center">
                        {formatFieldValue(field, oldValue)}
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">After</div>
                      <div className="p-2 bg-green-50 border border-green-200 rounded text-green-800 min-h-[2rem] flex items-center">
                        {formatFieldValue(field, newValue)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}