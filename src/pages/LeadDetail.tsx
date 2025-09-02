import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyableText } from "@/components/ui/copyable-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, User, Phone, Mail, Tag, Clock, MessageSquare, Save, Upload, FileText, 
  Trash2, Euro, CreditCard, Users, ArrowLeft, Edit3, X, Check, Eye, Download,
  Activity, NotebookPen, FileAudio, Image as ImageIcon, Calendar as CalendarIcon
} from "lucide-react";
import { LeadHistoryDetails } from "@/components/crm/LeadHistoryDetails";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLeadDetails, useLeads, type Lead } from "@/hooks/useLeads";

const productOptions = ["PKV", "PAV", "Investments", "Insurances", "Real Estate"];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [viewingTranscript, setViewingTranscript] = useState<{content: string, name: string} | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idDocumentInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { leads, updateLead } = useLeads();
  const lead = leads.find(l => l.id === id);
  const { notes, history, transcripts, loading, addNote, addTranscript, deleteTranscript } = useLeadDetails(id || null);

  // Fetch registered users
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

    fetchUsers();
  }, []);

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Lead not found</h2>
          <p className="text-muted-foreground mb-4">The lead you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/leads')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  const currentLead = editedLead || lead;

  const handleEdit = () => {
    setEditedLead({ ...lead });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editedLead) {
      await updateLead(lead.id, editedLead);
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

      event.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });

      event.target.value = '';
    }
  };

  const handleDeleteFile = async (transcriptId: string, fileName: string) => {
    try {
      const transcript = transcripts.find(t => t.id === transcriptId);
      if (!transcript) return;

      const { error } = await supabase.storage
        .from('lead-transcripts')
        .remove([transcript.file_path]);

      if (error) throw error;

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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const hasFirstDoc = !!currentLead.id_document_path;
    const hasSecondDoc = !!currentLead.id_document_back_path;
    
    if (hasFirstDoc && hasSecondDoc) {
      toast({
        title: "Maximum files reached",
        description: "You can only upload up to 2 ID documents. Please delete existing ones first.",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const filesToUpload = Array.from(files).slice(0, 2);
    
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload PNG or JPEG images only.",
          variant: "destructive",
        });
        continue;
      }

      const isSecondDocument = (i === 1) || (i === 0 && hasFirstDoc);
      const fileName = `${Date.now()}-${i}-${file.name}`;
      const filePath = `${lead.id}/${fileName}`;

      try {
        const { data, error } = await supabase.storage
          .from('lead-documents')
          .upload(filePath, file, {
            cacheControl: '3600'
          });

        if (error) throw error;

        const updateField = isSecondDocument ? 'id_document_back_path' : 'id_document_path';
        await updateLead(lead.id, { [updateField]: filePath });

        toast({
          title: `ID document uploaded`,
          description: `${file.name} has been uploaded successfully.`,
        });

      } catch (error) {
        console.error('ID upload error:', error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: "destructive",
        });
      }
    }

    event.target.value = '';
  };

  const handleViewIdDocument = async (isBackPage = false) => {
    const documentPath = isBackPage ? currentLead.id_document_back_path : currentLead.id_document_path;
    if (!documentPath) return;

    try {
      const { data, error } = await supabase.storage
        .from('lead-documents')
        .download(documentPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
      
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

  const handleDeleteIdDocument = async (isBackPage = false) => {
    const documentPath = isBackPage ? currentLead.id_document_back_path : currentLead.id_document_path;
    if (!documentPath) return;

    try {
      const { error } = await supabase.storage
        .from('lead-documents')
        .remove([documentPath]);

      if (error) throw error;

      const updateField = isBackPage ? 'id_document_back_path' : 'id_document_path';
      await updateLead(lead.id, { [updateField]: null });

      toast({
        title: `ID document ${isBackPage ? '(back)' : '(front)'} deleted`,
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
    return [
      { value: "New", label: "New Leads" },
      { value: "Not Reached", label: "Not Reached" },
      { value: "Webinar Confirmed", label: "Webinar Confirmed" },
      { value: "Call-Back", label: "Call-Back Scheduled" },
      { value: "Abandoned", label: "Abandoned" },
    ];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const allNotes = notes.map(note => `${note.author_name || 'Unknown'} (${new Date(note.created_at).toLocaleDateString()}): ${note.content}`).join('\n\n');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between p-6 mx-4 my-3 bg-card rounded-xl shadow-sm border border-border/50">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/leads')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Leads
            </Button>
            
            <div className="flex items-center gap-6">
              <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                <AvatarImage src="" alt={currentLead.name} />
                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                  {getInitials(currentLead.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground leading-tight">{currentLead.name}</h1>
                <div className="flex items-center gap-4">
                  <Badge className={`${getStatusBadgeClass(currentLead.status)} px-3 py-1 text-xs font-medium`}>
                    {currentLead.status}
                  </Badge>
                  {currentLead.assigned_to && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary/60"></div>
                      <span className="text-sm text-muted-foreground font-medium">
                        Assigned to {currentLead.assigned_to}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Lead
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 p-6">
        {/* Left Column - Lead Details */}
        <div className="flex-1 space-y-6">
          <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <User className="w-5 h-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedLead?.name || ""}
                      onChange={(e) => setEditedLead(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  ) : (
                    <CopyableText text={currentLead.name}>
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{currentLead.name}</span>
                    </CopyableText>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedLead?.email || ""}
                      onChange={(e) => setEditedLead(prev => prev ? { ...prev, email: e.target.value } : null)}
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
                    />
                  ) : (
                    <CopyableText text={currentLead.phone}>
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{currentLead.phone || "Not provided"}</span>
                    </CopyableText>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Source</Label>
                  {isEditing ? (
                    <Input
                      value={editedLead?.source || ""}
                      onChange={(e) => setEditedLead(prev => prev ? { ...prev, source: e.target.value } : null)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{currentLead.source || "Not specified"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                  {isEditing ? (
                    <Select 
                      value={editedLead?.assigned_to || ""} 
                      onValueChange={(value) => setEditedLead(prev => prev ? { ...prev, assigned_to: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
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
                      await updateLead(lead.id, { status: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getStageOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Financial Information */}
              {(currentLead.age || currentLead.net_salary || currentLead.gross_salary) && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Euro className="w-4 h-4" />
                    Financial Information
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {currentLead.age && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Age</Label>
                        <p className="font-medium">{currentLead.age} years</p>
                      </div>
                    )}
                    {currentLead.net_salary && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Net Salary</Label>
                        <p className="font-medium">€{Number(currentLead.net_salary).toLocaleString()}</p>
                      </div>
                    )}
                    {currentLead.gross_salary && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Gross Salary</Label>
                        <p className="font-medium">€{Number(currentLead.gross_salary).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interested Products */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Interested Products
                </h4>
                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    productOptions.map(product => {
                      const isSelected = editedLead?.interested_products?.includes(product);
                      return (
                        <Button
                          key={product}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleProduct(product)}
                          className="text-xs"
                        >
                          {product}
                        </Button>
                      );
                    })
                  ) : (
                    currentLead.interested_products && currentLead.interested_products.length > 0 ? (
                      currentLead.interested_products.map(product => (
                        <Badge key={product} variant="secondary" className="text-xs">
                          {product}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">No products selected</span>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <ImageIcon className="w-5 h-5 text-primary" />
                ID Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => idDocumentInputRef.current?.click()}
                    disabled={!!(currentLead.id_document_path && currentLead.id_document_back_path)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload ID Documents
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Upload up to 2 ID documents (front and back)
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {currentLead.id_document_path && (
                    <div className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">ID Front</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewIdDocument(false)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIdDocument(false)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentLead.id_document_back_path && (
                    <div className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">ID Back</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewIdDocument(true)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIdDocument(true)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity Timeline */}
        <div className="w-96 space-y-6">
          <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="w-5 h-5 text-primary" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="notes" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="notes" className="text-xs">
                    <NotebookPen className="w-3 h-3 mr-1" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="files" className="text-xs">
                    <FileAudio className="w-3 h-3 mr-1" />
                    Files
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="notes" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="resize-none"
                    />
                    <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div key={note.id} className="border-l-2 border-primary/20 pl-4 py-3 bg-muted/30 rounded-r-lg space-y-2">
                          <p className="text-sm leading-relaxed">{note.content}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{note.author_name || 'Unknown'}</span>
                            <span>•</span>
                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                      {notes.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm">No notes yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="history" className="mt-4">
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {history.map((entry) => (
                        <div key={entry.id} className="border-l-2 border-primary/20 pl-4 py-3 bg-muted/30 rounded-r-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{entry.action}</p>
                              <LeadHistoryDetails 
                                changedFields={entry.changed_fields} 
                                oldValues={entry.old_values} 
                                newValues={entry.new_values} 
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {entry.details && (
                            <p className="text-xs text-muted-foreground">{entry.details}</p>
                          )}
                          {entry.user_name && (
                            <p className="text-xs text-muted-foreground font-medium">by {entry.user_name}</p>
                          )}
                        </div>
                      ))}
                      {history.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm">No history yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="files" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Transcript
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-60">
                    <div className="space-y-2">
                      {transcripts.map((transcript) => (
                        <div key={transcript.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{transcript.file_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewFile(transcript.file_path, transcript.file_name)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(transcript.id, transcript.file_name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {transcripts.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm">No files uploaded</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={idDocumentInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleIdDocumentUpload}
        className="hidden"
      />

      {/* Transcript Viewer Modal */}
      {viewingTranscript && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{viewingTranscript.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingTranscript(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4 max-h-96">
              <pre className="text-sm whitespace-pre-wrap">{viewingTranscript.content}</pre>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}