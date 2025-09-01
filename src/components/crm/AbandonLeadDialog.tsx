import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface AbandonLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  onConfirm: (reason: string, customReason?: string) => void;
}

const abandonReasons = [
  { value: "never-reached", label: "Never reached", color: "text-blue-500" },
  { value: "future-call", label: "Future Call", color: "text-yellow-500" },
  { value: "bad-quality", label: "Bad Lead Quality", color: "text-muted-foreground" },
  { value: "no-interest", label: "No Interest", color: "text-muted-foreground" },
  { value: "chose-competitor", label: "Chose Competitor", color: "text-muted-foreground" },
  { value: "other", label: "Other Reason", color: "text-muted-foreground" },
];

export function AbandonLeadDialog({ open, onOpenChange, leadName, onConfirm }: AbandonLeadDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    if (!selectedReason) return;
    
    const reason = selectedReason === "other" ? customReason : 
      abandonReasons.find(r => r.value === selectedReason)?.label || selectedReason;
    
    onConfirm(reason, selectedReason === "other" ? customReason : undefined);
    setSelectedReason("");
    setCustomReason("");
  };

  const handleCancel = () => {
    setSelectedReason("");
    setCustomReason("");
    onOpenChange(false);
  };

  const isFormValid = selectedReason && (selectedReason !== "other" || customReason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-glass-border/60 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-destructive" />
            Abandon Lead - {leadName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please select the reason for abandoning this lead:
          </p>

          <RadioGroup
            value={selectedReason}
            onValueChange={setSelectedReason}
            className="space-y-3"
          >
            {abandonReasons.map((reason) => (
              <div key={reason.value} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={reason.value} 
                  id={reason.value}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label 
                  htmlFor={reason.value} 
                  className={`text-sm cursor-pointer ${reason.color}`}
                >
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason" className="text-sm font-medium">
                Please specify the reason:
              </Label>
              <Textarea
                id="custom-reason"
                placeholder="Enter custom reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="modern-input min-h-[80px] resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="glass-subtle border-glass-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isFormValid}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Abandon Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}