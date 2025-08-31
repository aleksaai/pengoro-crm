import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Phone, CheckCircle, X, TrendingUp } from "lucide-react";
import type { Lead } from "./LeadsTable";

interface LeadRowActionsProps {
  lead: Lead;
  onConvertToDeal: (leadId: string) => void;
  onAbandonLead: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: string) => void;
}

export function LeadRowActions({ 
  lead, 
  onConvertToDeal, 
  onAbandonLead, 
  onUpdateStatus 
}: LeadRowActionsProps) {
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  const handleContactLead = () => {
    onUpdateStatus(lead.id, "Contacted");
  };

  const handleQualifyLead = () => {
    onUpdateStatus(lead.id, "Qualified");
  };

  const handleConvertToDeal = () => {
    onConvertToDeal(lead.id);
    setShowConvertDialog(false);
  };

  const handleAbandonLead = () => {
    onAbandonLead(lead.id);
    setShowAbandonDialog(false);
  };

  const canMarkAsContacted = lead.status === "New";
  const canQualify = lead.status === "Contacted";
  const canConvert = lead.status === "Qualified" || lead.status === "Contacted";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-glass/50">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-sm border-glass-border/40">
          
          {canMarkAsContacted && (
            <DropdownMenuItem 
              onClick={handleContactLead}
              className="cursor-pointer hover:bg-glass/50"
            >
              <Phone className="mr-2 h-4 w-4" />
              Mark as Contacted
            </DropdownMenuItem>
          )}

          {canQualify && (
            <DropdownMenuItem 
              onClick={handleQualifyLead}
              className="cursor-pointer hover:bg-glass/50"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Qualified
            </DropdownMenuItem>
          )}

          {canConvert && (
            <>
              <DropdownMenuSeparator className="bg-glass-border/40" />
              <DropdownMenuItem 
                onClick={() => setShowConvertDialog(true)}
                className="cursor-pointer hover:bg-success/10 hover:text-success focus:bg-success/10 focus:text-success"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Convert to Deal
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator className="bg-glass-border/40" />
          <DropdownMenuItem 
            onClick={() => setShowAbandonDialog(true)}
            className="cursor-pointer hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <X className="mr-2 h-4 w-4" />
            Abandon Lead
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Convert to Deal Confirmation */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent className="glass-strong border-glass-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Convert to Deal
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to convert <strong>{lead.name}</strong> from <strong>{lead.company}</strong> to a deal in your pipeline? 
              This will remove them from the leads list and create a new deal opportunity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-subtle border-glass-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConvertToDeal}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              Convert to Deal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Abandon Lead Confirmation */}
      <AlertDialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
        <AlertDialogContent className="glass-strong border-glass-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-destructive" />
              Abandon Lead
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to abandon <strong>{lead.name}</strong> from <strong>{lead.company}</strong>? 
              This action cannot be undone and the lead will be permanently removed from your pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-subtle border-glass-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAbandonLead}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Abandon Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}