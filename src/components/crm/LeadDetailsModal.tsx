import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyableText } from "@/components/ui/copyable-text";
import { Calendar, User, Phone, Mail, Tag, Clock, MessageSquare, Save, Upload, FileText, Trash2, Euro, CreditCard, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLeadDetails, type Lead } from "@/hooks/useLeads";
import { LeadHistoryDetails } from "@/components/crm/LeadHistoryDetails";

interface LeadDetailsModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  pipelineType?: 'leads' | 'sales' | 'winbacks';
}

const productOptions = ["PKV", "PAV", "Investments", "Insurances", "Real Estate"];

export function LeadDetailsModal({ lead, open, onOpenChange, onUpdateLead, pipelineType = 'leads' }: LeadDetailsModalProps) {
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [viewingTranscript, setViewingTranscript] = useState<{content: string, name: string} | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idDocumentInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { notes, history, transcripts, loading, addNote, addTranscript, deleteTranscript } = useLeadDetails(lead?.id || null);

  // Fetch registered users when modal opens
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .order('full_name');

        if (error) throw error;

        const users = data?.map(profile => ({
          id: profile.user_id,
          full_name: profile.full_name || profile.email || 'Unknown User',
          email: profile.email || ''
        })) || [];

        setRegisteredUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (open && lead) {
      fetchUsers();
    }
  }, [open, lead]);

  if (!lead) return null;

  const currentLead = editedLead || lead;

  const handleEdit = () => {
    setEditedLead({ ...lead });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editedLead) {
      await onUpdateLead(lead.id, editedLead);
      setIsEditing(false);
      setEditedLead(null);
    }
  };

  const handleCancel = () => {
    setEditedLead(null);
    setIsEditing(false);
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      await addNote(newNote);
      setNewNote("");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a TXT file
    if (!file.name.toLowerCase().endsWith('.txt')) {
      toast({
        title: "Invalid file type",
        description: "Please upload only TXT files.",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const fileName = `${Date.now()}.txt`;
    const filePath = `${lead.id}/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('lead-transcripts')
        .upload(filePath, file, {
          cacheControl: '3600'
        });

      if (error) throw error;

      await addTranscript(file.name, filePath, file.size);

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });

      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (transcriptId: string, fileName: string) => {
    try {
      // Find the transcript to get the file path
      const transcript = transcripts.find(t => t.id === transcriptId);
      if (!transcript) return;

      // Delete from storage
      const { error } = await supabase.storage
        .from('lead-transcripts')
        .remove([transcript.file_path]);

      if (error) throw error;

      // Delete from database
      await deleteTranscript(transcriptId, fileName);

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the file.",
        variant: "destructive",
      });
    }
  };

  const handleViewFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('lead-transcripts')
        .download(filePath);

      if (error) throw error;

      const text = await data.text();
      setViewingTranscript({content: text, name: fileName});

    } catch (error) {
      console.error('View error:', error);
      toast({
        title: "View failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleIdDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF or image files only.",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${lead.id}/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('lead-documents')
        .upload(filePath, file, {
          cacheControl: '3600'
        });

      if (error) throw error;

      // Update lead with document path
      await onUpdateLead(lead.id, { id_document_path: filePath });

      toast({
        title: "ID document uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });

      event.target.value = '';
    } catch (error) {
      console.error('ID upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
      event.target.value = '';
    }
  };

  const handleViewIdDocument = async () => {
    if (!currentLead.id_document_path) return;

    try {
      const { data, error } = await supabase.storage
        .from('lead-documents')
        .download(currentLead.id_document_path);

      if (error) throw error;

      // Create blob URL and open in new tab
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
      
      // Clean up the blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);

    } catch (error) {
      console.error('View ID document error:', error);
      toast({
        title: "View failed",
        description: "Could not open the document.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIdDocument = async () => {
    if (!currentLead.id_document_path) return;

    try {
      // Delete from storage
      const { error } = await supabase.storage
        .from('lead-documents')
        .remove([currentLead.id_document_path]);

      if (error) throw error;

      // Update lead to remove document path
      await onUpdateLead(lead.id, { id_document_path: null });

      toast({
        title: "ID document deleted",
        description: "The document has been removed.",
      });

    } catch (error) {
      console.error('Delete ID document error:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the document.",
        variant: "destructive",
      });
    }
  };

  const toggleProduct = (product: string) => {
    if (!editedLead) return;
    const currentProducts = editedLead.interested_products || [];
    const newProducts = currentProducts.includes(product)
      ? currentProducts.filter(p => p !== product)
      : [...currentProducts, product];
    
    setEditedLead({ ...editedLead, interested_products: newProducts });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "New": return "bg-info/20 text-info border-info/30";
      case "Contacted": return "bg-warning/20 text-warning border-warning/30";
      case "Qualified": return "bg-success/20 text-success border-success/30";
      default: return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const getStageOptions = () => {
    switch (pipelineType) {
      case 'leads':
        return [
          { value: "New", label: "New Leads" },
          { value: "Not Reached", label: "Not Reached" },
          { value: "Webinar Confirmed", label: "Webinar Confirmed" },
          { value: "Call-Back", label: "Call-Back Scheduled" },
          { value: "Abandoned", label: "Abandoned" },
        ];
      case 'sales':
        return [
          { value: "Discovery Call Booked", label: "Discovery Call" },
          { value: "Second Meeting Booked", label: "Second Meeting" },
          { value: "Follow-Up Scheduled", label: "Follow-Up" },
          { value: "Closing Call Scheduled", label: "Closing Call" },
          { value: "Stuck", label: "Stuck" },
        ];
      case 'winbacks':
        return [
          { value: "never-reached", label: "Never Reached" },
          { value: "future-call", label: "Future Call" },
          { value: "lost", label: "Lost" },
          { value: "cold-leads", label: "Cold Leads" },
        ];
      default:
        return [];
    }
  };

  // Combine all notes into a single string for display
  const allNotes = notes.map(note => `${note.author_name || 'Unknown'} (${new Date(note.created_at).toLocaleDateString()}): ${note.content}`).join('\n\n');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] glass-card border-glass-border flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-display text-foreground flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              {currentLead.name}
              <Badge className={`${getStatusBadgeClass(currentLead.status)} px-2 py-1 text-xs`}>
                {currentLead.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-6 flex-1 overflow-hidden">
            {/* Left Side - Lead Information - Scrollable */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 pb-6">
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
                      <CopyableText text={currentLead.name}>
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{currentLead.name}</span>
                      </CopyableText>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                    {isEditing ? (
                      <Select 
                        value={editedLead?.assigned_to || ""} 
                        onValueChange={(value) => setEditedLead(prev => prev ? { ...prev, assigned_to: value } : null)}
                      >
                        <SelectTrigger className="modern-input">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-glass-border bg-background shadow-lg z-50">
                          {registeredUsers.length > 0 ? (
                            registeredUsers.map(user => (
                              <SelectItem key={user.id} value={user.full_name}>{user.full_name}</SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="none">No users available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{currentLead.assigned_to || "Unassigned"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Deal Stage</Label>
                    <Select 
                      value={currentLead.status} 
                      onValueChange={async (value) => {
                        await onUpdateLead(lead.id, { status: value });
                      }}
                    >
                      <SelectTrigger className="modern-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-glass-border bg-background shadow-lg z-50">
                        {getStageOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <CopyableText text={currentLead.email}>
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{currentLead.email}</span>
                      </CopyableText>
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
                      <CopyableText text={currentLead.phone}>
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{currentLead.phone}</span>
                      </CopyableText>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedLead?.age || ""}
                        onChange={(e) => setEditedLead(prev => prev ? { ...prev, age: e.target.value ? parseInt(e.target.value) : undefined } : null)}
                        className="modern-input"
                        placeholder="Enter age"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{currentLead.age || "Not specified"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Net Salary</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedLead?.net_salary || ""}
                        onChange={(e) => setEditedLead(prev => prev ? { ...prev, net_salary: e.target.value ? parseFloat(e.target.value) : undefined } : null)}
                        className="modern-input"
                        placeholder="Enter net salary"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {currentLead.net_salary ? `€${currentLead.net_salary.toLocaleString()}` : "Not specified"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Gross Salary</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedLead?.gross_salary || ""}
                        onChange={(e) => setEditedLead(prev => prev ? { ...prev, gross_salary: e.target.value ? parseFloat(e.target.value) : undefined } : null)}
                        className="modern-input"
                        placeholder="Enter gross salary"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {currentLead.gross_salary ? `€${currentLead.gross_salary.toLocaleString()}` : "Not specified"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Products Interested In</Label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {productOptions.map(product => {
                        const isSelected = editedLead?.interested_products?.includes(product) || false;
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
                      {currentLead.interested_products?.length ? (
                        currentLead.interested_products.map(product => (
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

                {/* ID Document and Transcripts Section - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ID Document Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">ID Document</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={idDocumentInputRef}
                          onChange={handleIdDocumentUpload}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          multiple={false}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => idDocumentInputRef.current?.click()}
                          className="h-8"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload ID
                        </Button>
                      </div>
                    </div>
                    
                    {currentLead.id_document_path ? (
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                           onClick={() => handleViewIdDocument()}>
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">ID Document</p>
                            <p className="text-xs text-muted-foreground">
                              Click to view
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteIdDocument();
                          }}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 glass-subtle rounded-lg">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No ID document uploaded yet</p>
                      </div>
                    )}
                  </div>

                  {/* Transcripts Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Transcripts</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept=".txt"
                          className="hidden"
                          multiple={false}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload TXT
                        </Button>
                      </div>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : transcripts.length > 0 ? (
                      <div className="space-y-2">
                        {transcripts.map((file) => (
                          <div 
                            key={file.id} 
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleViewFile(file.file_path, file.file_name)}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{file.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(file.created_at).toLocaleDateString()} • {file.file_size ? Math.round(file.file_size / 1024) + ' KB' : 'Unknown size'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFile(file.id, file.file_name);
                                }}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 glass-subtle rounded-lg">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No transcripts uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section - Combined display and add */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  {/* Existing Notes Display */}
                  {allNotes && (
                    <div className="glass-subtle rounded-lg p-4">
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                        {allNotes}
                      </pre>
                    </div>
                  )}

                  {/* Add New Note */}
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add notes about your conversation..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="modern-input min-h-24 resize-none"
                    />
                    <Button 
                      onClick={handleAddNote} 
                      disabled={!newNote.trim()}
                      className="modern-button"
                      size="sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
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
            </ScrollArea>

            {/* Right Side - Lead History */}
            <div className="w-80 glass-subtle rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-foreground">Lead History</h3>
              </div>
              
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div key={entry.id} className="relative">
                        {index < history.length - 1 && (
                          <div className="absolute left-2 top-8 bottom-0 w-px bg-glass-border" />
                        )}
                        <div className="flex gap-3">
                           <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex-shrink-0 mt-0.5" />
                           <div className="flex items-center justify-between">
                             <div className="flex-1 min-w-0">
                               <div className="text-xs font-medium text-foreground">
                                 {entry.action}
                               </div>
                               <div className="text-xs text-muted-foreground mt-1">
                                 {entry.details}
                               </div>
                               <div className="text-xs text-muted-foreground/70 mt-1">
                                 {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </div>
                               {entry.user_name && (
                                 <div className="text-xs text-muted-foreground/70">
                                   by {entry.user_name}
                                 </div>
                               )}
                             </div>
                             <LeadHistoryDetails
                               changedFields={entry.changed_fields}
                               oldValues={entry.old_values}
                               newValues={entry.new_values}
                             />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transcript Viewer Dialog */}
      <Dialog open={!!viewingTranscript} onOpenChange={() => setViewingTranscript(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Transcript: {viewingTranscript?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full">
            <div className="p-4 bg-muted/30 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                {viewingTranscript?.content}
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
