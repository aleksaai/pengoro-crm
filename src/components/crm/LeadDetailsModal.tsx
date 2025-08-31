import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User, Phone, Mail, Tag, Clock, MessageSquare, Save } from "lucide-react";
import type { Lead, LeadHistoryEntry } from "./LeadsTable";

interface LeadDetailsModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
}

const productOptions = ["PKV", "PAV", "Investments", "Insurances", "Real Estate"];
const users = ["John Doe", "Sarah Smith", "Mike Johnson", "Anna Brown"];

export function LeadDetailsModal({ lead, open, onOpenChange, onUpdateLead }: LeadDetailsModalProps) {
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  if (!lead) return null;

  const currentLead = editedLead || lead;

  const handleEdit = () => {
    setEditedLead({ ...lead });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedLead) {
      const updates = { ...editedLead };
      const historyEntry: LeadHistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: "Updated lead information",
        details: "Lead details were modified",
        user: "Current User"
      };
      updates.history = [...(updates.history || []), historyEntry];
      onUpdateLead(lead.id, updates);
      setIsEditing(false);
      setEditedLead(null);
    }
  };

  const handleCancel = () => {
    setEditedLead(null);
    setIsEditing(false);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const noteEntry: LeadHistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: "Added note",
        details: newNote,
        user: "Current User"
      };
      const updates = {
        notes: (currentLead.notes || "") + (currentLead.notes ? "\n\n" : "") + newNote,
        history: [...(currentLead.history || []), noteEntry]
      };
      onUpdateLead(lead.id, updates);
      setNewNote("");
    }
  };

  const toggleProduct = (product: string) => {
    if (!editedLead) return;
    const currentProducts = editedLead.interestedProducts || [];
    const newProducts = currentProducts.includes(product)
      ? currentProducts.filter(p => p !== product)
      : [...currentProducts, product];
    
    setEditedLead({ ...editedLead, interestedProducts: newProducts });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "New": return "bg-info/20 text-info border-info/30";
      case "Contacted": return "bg-warning/20 text-warning border-warning/30";
      case "Qualified": return "bg-success/20 text-success border-success/30";
      default: return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] glass-card border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-foreground flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            {currentLead.name}
            <Badge className={`${getStatusBadgeClass(currentLead.status)} px-2 py-1 text-xs`}>
              {currentLead.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-full overflow-hidden">
          {/* Left Side - Lead Information */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                {isEditing ? (
                  <Input
                    value={editedLead?.name || ""}
                    onChange={(e) => setEditedLead(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="modern-input"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{currentLead.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                {isEditing ? (
                  <Select 
                    value={editedLead?.assignedTo || ""} 
                    onValueChange={(value) => setEditedLead(prev => prev ? { ...prev, assignedTo: value } : null)}
                  >
                    <SelectTrigger className="modern-input">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-glass-border">
                      {users.map(user => (
                        <SelectItem key={user} value={user}>{user}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{currentLead.assignedTo || "Unassigned"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editedLead?.email || ""}
                    onChange={(e) => setEditedLead(prev => prev ? { ...prev, email: e.target.value } : null)}
                    className="modern-input"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{currentLead.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                {isEditing ? (
                  <Input
                    value={editedLead?.phone || ""}
                    onChange={(e) => setEditedLead(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    className="modern-input"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{currentLead.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Products Interested In</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {productOptions.map(product => {
                    const isSelected = editedLead?.interestedProducts?.includes(product) || false;
                    return (
                      <Badge
                        key={product}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                        onClick={() => toggleProduct(product)}
                      >
                        {product}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentLead.interestedProducts?.length ? (
                    currentLead.interestedProducts.map(product => (
                      <Badge key={product} className="bg-primary/20 text-primary border-primary/30">
                        <Tag className="w-3 h-3 mr-1" />
                        {product}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">No products selected</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
              <div className="glass-subtle rounded-lg p-4 min-h-32">
                {currentLead.notes ? (
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                    {currentLead.notes}
                  </pre>
                ) : (
                  <span className="text-muted-foreground text-sm">No notes yet</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} className="modern-button">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="glass-subtle border-glass-border">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit} className="modern-button">
                  Edit Lead
                </Button>
              )}
            </div>
          </div>

          <Separator orientation="vertical" className="bg-glass-border" />

          {/* Right Side - Interactive Elements */}
          <div className="w-80 space-y-6">
            {/* Add Note Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Add Note
              </h3>
              <Textarea
                placeholder="Add notes about your conversation..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="modern-input min-h-24 resize-none"
              />
              <Button 
                onClick={handleAddNote} 
                disabled={!newNote.trim()}
                className="w-full modern-button"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>

            <Separator className="bg-glass-border" />

            {/* Lead History */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Lead History
              </h3>
              <ScrollArea className="h-64 glass-subtle rounded-lg p-4">
                {currentLead.history?.length ? (
                  <div className="space-y-3">
                    {[...currentLead.history].reverse().map((entry) => (
                      <div key={entry.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">{entry.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{entry.details}</p>
                        <div className="text-xs text-muted-foreground/70">by {entry.user}</div>
                        {entry !== currentLead.history?.[0] && (
                          <Separator className="bg-glass-border/50 my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No history yet
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}