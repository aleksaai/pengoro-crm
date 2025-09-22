import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
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
  Activity, NotebookPen, FileAudio, Image as ImageIcon, Calendar as CalendarIcon, CheckSquare, Plus, AlertTriangle,
  Building, Globe, TrendingUp, Target, HandCoins, ChevronRight
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { LeadHistoryDetails } from "@/components/crm/LeadHistoryDetails";
import { TaskCreateModal } from "@/components/crm/TaskCreateModal";
import { TaskCompletionModal } from "@/components/crm/TaskCompletionModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLeadDetails, useLeads, type Lead } from "@/hooks/useLeads";
import { useLeadTasks } from "@/hooks/useLeadTasks";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { cn, getTaskUrgencyLevel } from "@/lib/utils";

const productOptions = ["PKV", "PAV", "Investments", "Insurances", "Real Estate"];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [viewingTranscript, setViewingTranscript] = useState<{content: string, name: string} | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idDocumentInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get default tab from URL parameters
  const defaultTab = searchParams.get('tab') || 'notes';

  // Lock background scroll when transcript modal is open
  useEffect(() => {
    if (viewingTranscript) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [viewingTranscript]);

  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { leads, updateLead } = useLeads();
  const lead = leads.find(l => l.id === id);
  const { notes, history, transcripts, loading, addNote, addTranscript, deleteTranscript } = useLeadDetails(id || null);
  const { tasks: leadTasks, loading: tasksLoading, updateTask, refetch: refetchTasks } = useLeadTasks(id || "");

  // Tick every minute to keep time-based UI (like task urgency color) fresh
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Determine where user came from based on state
  const getBackInfo = () => {
    const from = location.state?.from;
    
    switch (from) {
      case 'pipeline':
        return { text: 'Back to Sales Pipeline', route: '/' };
      case 'winbacks':
        return { text: 'Back to Winbacks', route: '/winbacks' };
      case 'leads':
      default:
        return { text: 'Back to Leads', route: '/leads' };
    }
  };
  
  const { text: backButtonText, route: backRoute } = getBackInfo();

  // Task utility functions (same as TaskManagement)
  const getTaskUrgencyColor = (task: any) => {
    const urgencyLevel = getTaskUrgencyLevel(task.due_date, task.done);
    
    switch (urgencyLevel) {
      case 'completed': return "secondary";
      case 'overdue': return "destructive";
      case 'today': return "outline";
      case 'tomorrow': return "default";
      case 'week': return "default";
      case 'future': return "default";
      default: return "default";
    }
  };

  const getTaskBorderColor = (task: any) => {
    const urgencyLevel = getTaskUrgencyLevel(task.due_date, task.done);
    
    switch (urgencyLevel) {
      case 'completed': return "border-muted-foreground";
      case 'overdue': return "border-red-500";
      case 'today': return "border-orange-500";
      case 'tomorrow': return "border-yellow-500";
      case 'week': return "border-green-500";
      case 'future': return "border-blue-500";
      default: return "border-muted-foreground";
    }
  };

  const getTaskIconColor = (task: any) => {
    const urgencyLevel = getTaskUrgencyLevel(task.due_date, task.done);
    
    switch (urgencyLevel) {
      case 'completed': return "text-muted-foreground";
      case 'overdue': return "text-red-500";
      case 'today': return "text-orange-500";
      case 'tomorrow': return "text-yellow-500";
      case 'week': return "text-green-500";
      case 'future': return "text-blue-500";
      default: return "text-muted-foreground";
    }
  };

  const getTaskUrgencyIcon = (task: any) => {
    const urgencyLevel = getTaskUrgencyLevel(task.due_date, task.done);
    
    switch (urgencyLevel) {
      case 'completed': return Check;
      case 'overdue': return AlertTriangle;
      case 'today': return Clock;
      case 'tomorrow': return Clock;
      case 'week': return Calendar;
      case 'future': return Calendar;
      default: return Calendar;
    }
  };

  // Get Todo button color for individual task
  const getTodoButtonColorFor = (task: any) => {
    // If lead is frozen and user is admin (not super admin), show red button
    if (lead?.is_frozen && !isSuperAdmin) {
      return "bg-destructive hover:bg-destructive/80";
    }
    
    // If task is completed, use muted color
    if (task.done) {
      return "bg-muted hover:bg-muted/80";
    }
    
    // Get urgency level for this specific task
    const urgencyLevel = getTaskUrgencyLevel(task.due_date, task.done);
    
    // Map urgency levels to button colors
    switch (urgencyLevel) {
      case 'overdue':
        return "bg-destructive hover:bg-destructive/80"; // Red
      case 'today':
        return "bg-warning hover:bg-warning/80"; // Orange
      case 'tomorrow':
        return "bg-yellow hover:bg-yellow/80"; // Yellow
      case 'week':
        return "bg-success hover:bg-success/80"; // Green
      case 'future':
        return "bg-primary hover:bg-primary/80"; // Blue
      case 'completed':
        return "bg-muted hover:bg-muted/80"; // Muted
      default:
        return "bg-muted hover:bg-muted/80";
    }
  };

  const handleTaskMarkAsDone = async (task: any) => {
    if (lead?.is_frozen && !isSuperAdmin) {
      toast({
        title: "Action Restricted", 
        description: "This lead is frozen due to overdue tasks. Only super admins can modify frozen leads.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if this is the only active task for the lead
    const leadActiveTasks = leadTasks.filter(t => !t.done);
    if (leadActiveTasks.length === 1 && leadActiveTasks[0].id === task.id) {
      toast({
        title: "Cannot Complete Task",
        description: "This is the only active task for this lead. Use 'Complete & Add Next' to create a follow-up task.",
        variant: "destructive"
      });
      return;
    }
    
    if (task.done) {
      await updateTask(task.id, { done: false });
    } else {
      await updateTask(task.id, { done: true });
    }
  };

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

  // Handle task completion with new task creation
  const handleCompleteTask = async (taskId: string, newTaskData: any) => {
    try {
      // Check if lead is in Lost winback status
      if (lead && (lead.status === 'Abandoned' || lead.status === 'Lost')) {
        try {
          const { data: latestHistory } = await supabase
            .from('lead_history')
            .select('details')
            .eq('lead_id', lead.id)
            .in('action', ['Lead Abandoned', 'Abandon Reason Updated'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (latestHistory?.details) {
            const abandonReason = latestHistory.details.includes('Reason: ') 
              ? latestHistory.details.split('Reason: ')[1]
              : latestHistory.details.includes('Reason changed to: ')
                ? latestHistory.details.split('Reason changed to: ')[1]
                : null;
            
            // If abandoned for reasons other than "Never reached" or "Future Call", it's in Lost status
            const isInLostStatus = abandonReason && !['Never reached', 'Future Call'].includes(abandonReason);
            
            if (isInLostStatus) {
              toast({
                title: "Cannot Create Task",
                description: "Cannot create tasks for leads in Lost winback status. Please reactivate the lead first.",
                variant: "destructive"
              });
              return;
            }
          }
        } catch (error) {
          console.error('Error checking winback status:', error);
        }
      }
      
      // First, mark the current task as done
      await updateTask(taskId, { done: true });
      
      // Then create the new task
      const { error } = await supabase.from('tasks').insert({
        lead_id: newTaskData.lead_id,
        lead_name: newTaskData.lead_name,
        email_address: newTaskData.email_address,
        phone_number: newTaskData.phone_number,
        title: newTaskData.title,
        description: newTaskData.description,
        due_date: newTaskData.due_date,
        assigned_to: newTaskData.assigned_to,
        assigned_to_name: newTaskData.assigned_to_name,
        done: false,
        created_by: user?.id || "",
      });

      if (error) throw error;

      // Add history entry for task creation
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();

      await supabase.from('lead_history').insert({
        lead_id: newTaskData.lead_id,
        action: 'Task Created',
        details: `New task created: "${newTaskData.title}" - Due: ${new Date(newTaskData.due_date).toLocaleDateString()}`,
        user_name: profileData?.full_name || 'Unknown User',
        created_by: user?.id,
      });

      // Refresh tasks
      refetchTasks();
      setCompletingTask(null);
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  };

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Lead not found</h2>
          <p className="text-muted-foreground mb-4">The lead you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(backRoute)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backButtonText}
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
              onClick={() => navigate(backRoute)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {backButtonText}
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
        {/* Left Column - Activity Timeline */}
        <div className="flex-1 space-y-6">
          <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="w-5 h-5 text-primary" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="notes" className="text-xs">
                    <NotebookPen className="w-3 h-3 mr-1" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs">
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Tasks
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
                  
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {[...notes].reverse().map((note) => (
                        <div key={note.id} className="border-l-2 border-primary/20 pl-4 py-3 bg-muted/30 rounded-r-lg space-y-2">
                          <p className="text-sm leading-relaxed">{note.content}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{note.author_name || 'Unknown'}</span>
                            <span>•</span>
                            <span>{new Date(note.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      {notes.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm">No notes yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="tasks" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Button
                      onClick={() => setIsTaskModalOpen(true)}
                      className="w-full flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {tasksLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                          <p className="text-sm text-muted-foreground mt-2">Loading tasks...</p>
                        </div>
                      ) : (
                        leadTasks
                          .sort((a, b) => {
                            if (a.done && !b.done) return 1;
                            if (!a.done && b.done) return -1;
                            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                          })
                          .map((task) => {
                            return (
                              <div key={task.id} className="glass-card p-4 border border-glass-border/30 rounded-lg animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
                                  <div className="space-y-1">
                                    <div className="flex items-start gap-2">
                                      <h4 className={`text-sm font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                                        {task.title}
                                      </h4>
                                      {task.done ? (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Completed</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">Upcoming</Badge>
                                      )}
                                    </div>

                                    {task.description && (
                                      <p className={`text-xs ${task.done ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                        {task.description}
                                      </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                      <span>Due: {new Date(task.due_date).toLocaleString()}</span>
                                      <span className="hidden sm:inline">•</span>
                                      <span>Assigned to: {registeredUsers.find(u => u.id === task.assigned_to)?.full_name || 'Unknown User'}</span>
                                    </div>
                                  </div>

                                  {!task.done && new Date(task.due_date).getTime() >= now && (
                                    <div className="flex justify-center sm:justify-end">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCompletingTask(task);
                                        }}
                                        className={`h-7 w-7 p-0 ${getTodoButtonColorFor(task)} hover-scale`}
                                        title="Open task"
                                      >
                                        <ChevronRight className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="history" className="mt-4">
                  <ScrollArea className="h-96">
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
                              {new Date(entry.created_at).toLocaleString()}
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
                  
                  <ScrollArea className="h-80">
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

        {/* Right Column - Lead Details */}
        <div className="w-80 space-y-6">
          <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <User className="w-5 h-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
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
                      <span className="text-foreground">{currentLead.phone}</span>
                    </CopyableText>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                  {isEditing ? (
                    <Select
                      value={editedLead?.assigned_to || "unassigned"}
                      onValueChange={(value) => setEditedLead(prev => prev ? { ...prev, assigned_to: value === "unassigned" ? "" : value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {registeredUsers.length > 0 && registeredUsers.map((user) => (
                          <SelectItem key={user.id} value={user.full_name}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{currentLead.assigned_to || "Unassigned"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Deal Stage</Label>
                  {isEditing ? (
                    <Select
                      value={editedLead?.status || ""}
                      onValueChange={(value) => setEditedLead(prev => prev ? { ...prev, status: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {getStageOptions().map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{currentLead.status}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                  {isEditing ? (
                    <Input
                      value={(editedLead as any)?.company || ""}
                      onChange={(e) => setEditedLead(prev => prev ? { ...prev, company: e.target.value } : null)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{(currentLead as any).company || "Not specified"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Source</Label>
                  {isEditing ? (
                    <Select
                      value={editedLead?.source || "not-specified"}
                      onValueChange={(value) => setEditedLead(prev => prev ? { ...prev, source: value === "not-specified" ? "" : value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-specified">Not specified</SelectItem>
                        <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                        <SelectItem value="Google Ads">Google Ads</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Cold Call">Cold Call</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{currentLead.source || "Not specified"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={(editedLead as any)?.description || ""}
                      onChange={(e) => setEditedLead(prev => prev ? { ...prev, description: e.target.value } : null)}
                      className="resize-none"
                      rows={3}
                    />
                  ) : (
                    <div className="p-2 bg-muted/50 rounded-md">
                      <p className="text-sm text-foreground">{(currentLead as any).description || "No description available"}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Financial Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Euro className="w-4 h-4 text-primary" />
                  Financial Information
                </h4>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Net Monthly Income</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={(editedLead as any)?.net_monthly_income || ""}
                      onChange={(e) => setEditedLead(prev => prev ? { ...prev, net_monthly_income: parseFloat(e.target.value) || 0 } : null)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground font-medium">
                        {(currentLead as any).net_monthly_income ? `€${(currentLead as any).net_monthly_income.toLocaleString()}` : "Not specified"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Interested Products</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {productOptions.map((product) => (
                        <div key={product} className="flex items-center space-x-2">
                          <Checkbox
                            id={product}
                            checked={editedLead?.interested_products?.includes(product) || false}
                            onCheckedChange={(checked) => {
                              if (editedLead) {
                                const currentProducts = editedLead.interested_products || [];
                                const updatedProducts = checked
                                  ? [...currentProducts, product]
                                  : currentProducts.filter(p => p !== product);
                                setEditedLead({ ...editedLead, interested_products: updatedProducts });
                              }
                            }}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label htmlFor={product} className="text-sm">{product}</Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(currentLead.interested_products || []).map((product) => (
                        <Badge key={product} variant="secondary" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                      {(!currentLead.interested_products || currentLead.interested_products.length === 0) && (
                        <span className="text-sm text-muted-foreground">No products selected</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* ID Documents */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    ID Documents
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => idDocumentInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-3 h-3" />
                    Upload
                  </Button>
                </div>

                <div className="space-y-3">
                  {(currentLead as any).id_front_image_url && (
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
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

                  {(currentLead as any).id_back_image_url && (
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overscroll-contain">
          <div className="bg-background border rounded-lg w-[90vw] max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{viewingTranscript.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingTranscript(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <pre className="text-sm whitespace-pre-wrap">{viewingTranscript.content}</pre>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Task Create Modal */}
      {user && (
        <TaskCreateModal
          open={isTaskModalOpen}
          onOpenChange={setIsTaskModalOpen}
          leadId={lead.id}
          leadName={lead.name}
          leadEmail={lead.email}
          leadPhone={lead.phone}
          currentUserId={user.id}
          currentUserName={registeredUsers.find(u => u.id === user.id)?.full_name || user.email || "Unknown User"}
          onTaskCreated={refetchTasks}
        />
      )}

      {/* Task Completion Modal */}
      {user && completingTask && (
        <TaskCompletionModal
          open={!!completingTask}
          onOpenChange={(open) => !open && setCompletingTask(null)}
          currentTask={completingTask}
          onCompleteTask={handleCompleteTask}
        />
      )}
    </div>
  );
}