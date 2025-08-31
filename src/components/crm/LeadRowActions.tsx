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
import { MoreVertical, Phone, CheckCircle, X, TrendingUp, PhoneOff, Video, Clock } from "lucide-react";
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

  const handleConvertToPipeline = () => {
    onConvertToDeal(lead.id);
    setShowConvertDialog(false);
  };

  const handleNotReached = () => {
    onUpdateStatus(lead.id, "Not Reached");
  };

  const handleWebinarConfirmed = () => {
    onUpdateStatus(lead.id, "Webinar Confirmed");
  };

  const handleCallBack = () => {
    onUpdateStatus(lead.id, "Call-Back");
  };

  const handleAbandonLead = () => {
    onAbandonLead(lead.id);
    setShowAbandonDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-glass/50">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-background/95 backdrop-blur-sm border-glass-border/40 shadow-lg z-50">
          
          {/* Convert to Pipeline Deal */}
          <DropdownMenuItem 
            onClick={() => setShowConvertDialog(true)}
            className="cursor-pointer hover:bg-success/10 hover:text-success focus:bg-success/10 focus:text-success"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Convert to Pipeline Deal
          </DropdownMenuItem>

          {/* Not Reached */}
          <DropdownMenuItem 
            onClick={handleNotReached}
            className="cursor-pointer hover:bg-glass/50"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            Not Reached
          </DropdownMenuItem>

          {/* Webinar Confirmed */}
          <DropdownMenuItem 
            onClick={handleWebinarConfirmed}
            className="cursor-pointer hover:bg-glass/50"
          >
            <Video className="mr-2 h-4 w-4" />
            Webinar Confirmed
          </DropdownMenuItem>

          {/* Call-Back */}
          <DropdownMenuItem 
            onClick={handleCallBack}
            className="cursor-pointer hover:bg-glass/50"
          >
            <Clock className="mr-2 h-4 w-4" />
            Call-Back
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-glass-border/40" />
          
          {/* Abandon Lead */}
          <DropdownMenuItem 
            onClick={() => setShowAbandonDialog(true)}
            className="cursor-pointer hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <X className="mr-2 h-4 w-4" />
            Abandon Lead
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Convert to Pipeline Deal Confirmation */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent className="glass-strong border-glass-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Convert to Pipeline Deal
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to convert <strong>{lead.name}</strong> to a pipeline deal? 
              This will move them to the Discovery Call stage in your sales pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-subtle border-glass-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConvertToPipeline}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              Convert to Pipeline Deal
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
              Are you sure you want to abandon <strong>{lead.name}</strong>? 
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