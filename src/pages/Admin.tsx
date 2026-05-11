import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useProfiles } from "@/hooks/useProfiles";
import { useTasks } from "@/hooks/useTasks";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  UserPlus,
  Shield,
  ShieldCheck,
  User,
  Users,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  ArrowUpDown,
  Eye,
  CalendarIcon,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────

interface ProfileWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  account_type: "super_admin" | "admin" | "user" | null;
  created_at: string;
}

interface TaskInfo {
  id: string;
  title: string;
  due_date: string;
  done: boolean;
  assigned_to: string;
}

type SortField = "name" | "status" | "assigned_to" | "created_at";
type SortDir = "asc" | "desc";

// ─── Helpers ─────────────────────────────────────────────────────

const roleBadge = (role: string | null) => {
  switch (role) {
    case "super_admin":
      return (
        <Badge className="bg-red-500/15 text-red-600 border-red-500/30 hover:bg-red-500/20">
          <ShieldCheck className="w-3 h-3 mr-1" />Super Admin
        </Badge>
      );
    case "admin":
      return (
        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">
          <Shield className="w-3 h-3 mr-1" />Admin
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <User className="w-3 h-3 mr-1" />User
        </Badge>
      );
  }
};

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    "New": "bg-slate-100 text-slate-700 border-slate-300",
    "Contacted": "bg-sky-100 text-sky-700 border-sky-300",
    "Interested": "bg-violet-100 text-violet-700 border-violet-300",
    "Discovery Call Booked": "bg-blue-100 text-blue-700 border-blue-300",
    "Second Meeting Booked": "bg-purple-100 text-purple-700 border-purple-300",
    "Follow-Up Scheduled": "bg-orange-100 text-orange-700 border-orange-300",
    "Closing Call Scheduled": "bg-amber-100 text-amber-700 border-amber-300",
    "Won": "bg-green-100 text-green-700 border-green-300",
    "Lost": "bg-red-100 text-red-700 border-red-300",
    "Abandoned": "bg-gray-100 text-gray-500 border-gray-300",
    "Stuck": "bg-yellow-100 text-yellow-700 border-yellow-300",
  };
  return (
    <Badge variant="outline" className={colors[status] || "bg-gray-100 text-gray-600"}>
      {status}
    </Badge>
  );
};

const ALL_STATUSES = [
  "New",
  "Contacted",
  "Interested",
  "Discovery Call Booked",
  "Second Meeting Booked",
  "Follow-Up Scheduled",
  "Closing Call Scheduled",
  "Stuck",
  "Won",
  "Lost",
  "Abandoned",
];

// ─── Main Component ──────────────────────────────────────────────

export default function Admin() {
  const { user, accountType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { leads, loading: leadsLoading } = useLeads();
  const { profiles: profilesList } = useProfiles();
  const { createTask } = useTasks();

  // ── User management state ──
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    account_type: "user" as string,
  });
  const [creating, setCreating] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // ── Lead management state ──
  const [frozenLeadTasks, setFrozenLeadTasks] = useState<Record<string, TaskInfo[]>>({});
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [unfreezeConfirm, setUnfreezeConfirm] = useState<Lead | null>(null);
  const [unfreezing, setUnfreezing] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");
  const [leadFreezeFilter, setLeadFreezeFilter] = useState<string>("all");
  const [leadAssignmentFilter, setLeadAssignmentFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const [changingAssignment, setChangingAssignment] = useState<string | null>(null);

  // ── Unfreeze + Follow-up task state ──
  const [createFollowUp, setCreateFollowUp] = useState(true);
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [followUpDescription, setFollowUpDescription] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [followUpTime, setFollowUpTime] = useState("09:00");
  const [followUpAssignee, setFollowUpAssignee] = useState<string>("");

  const isAllowed = accountType === "super_admin" || accountType === "admin";

  useEffect(() => {
    if (accountType && !isAllowed) {
      navigate("/");
    }
  }, [accountType, isAllowed, navigate]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  // ── Fetch overdue tasks for frozen leads ──
  const frozenLeads = useMemo(() => leads.filter((l) => l.is_frozen), [leads]);

  useEffect(() => {
    if (frozenLeads.length > 0) {
      fetchFrozenLeadTasks();
    }
  }, [frozenLeads.length]);

  const fetchFrozenLeadTasks = async () => {
    setLoadingTasks(true);
    try {
      const frozenIds = frozenLeads.map((l) => l.id);
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, due_date, done, assigned_to, lead_id")
        .in("lead_id", frozenIds)
        .eq("done", false)
        .order("due_date", { ascending: true });
      if (error) throw error;

      const grouped: Record<string, TaskInfo[]> = {};
      (data || []).forEach((task: any) => {
        if (!grouped[task.lead_id]) grouped[task.lead_id] = [];
        grouped[task.lead_id].push(task);
      });
      setFrozenLeadTasks(grouped);
    } catch (error) {
      console.error("Error fetching frozen lead tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  // ── Get unique agent names ──
  const agentNames = useMemo(
    () => profilesList.map((p) => p.full_name).filter(Boolean).sort(),
    [profilesList]
  );

  // ── Get unique assigned_to values actually in use ──
  const usedAssignees = useMemo(() => {
    const set = new Set(leads.map((l) => l.assigned_to).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [leads]);

  // ── Filtered + sorted leads ──
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Freeze filter
    if (leadFreezeFilter === "frozen") result = result.filter((l) => l.is_frozen);
    else if (leadFreezeFilter === "active") result = result.filter((l) => !l.is_frozen);

    // Status filter
    if (leadStatusFilter !== "all") result = result.filter((l) => l.status === leadStatusFilter);

    // Assignment filter
    if (leadAssignmentFilter === "unassigned") result = result.filter((l) => !l.assigned_to);
    else if (leadAssignmentFilter !== "all") result = result.filter((l) => l.assigned_to === leadAssignmentFilter);

    // Search
    if (leadSearch.trim()) {
      const q = leadSearch.toLowerCase();
      result = result.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.assigned_to?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "");
          break;
        case "status":
          cmp = (a.status || "").localeCompare(b.status || "");
          break;
        case "assigned_to":
          cmp = (a.assigned_to || "zzz").localeCompare(b.assigned_to || "zzz");
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [leads, leadFreezeFilter, leadStatusFilter, leadAssignmentFilter, leadSearch, sortField, sortDir]);

  // ── Profiles fetch ──
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name, account_type, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setProfiles((data as ProfileWithRole[]) || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  // ── User creation ──
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          account_type: formData.account_type,
        },
      });
      if (error) throw error;
      toast({ title: "Nutzer erstellt", description: `${formData.full_name} wurde erfolgreich angelegt.` });
      setFormData({ full_name: "", email: "", password: "", account_type: "user" });
      fetchProfiles();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message || "Nutzer konnte nicht erstellt werden.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // ── Role change ──
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      if (userId === user?.id) {
        toast({ title: "Nicht erlaubt", description: "Du kannst deine eigene Rolle nicht ändern.", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("profiles").update({ account_type: newRole }).eq("user_id", userId);
      if (error) throw error;
      toast({ title: "Rolle aktualisiert", description: `Rolle wurde geändert.` });
      fetchProfiles();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message || "Rolle konnte nicht geändert werden.", variant: "destructive" });
    } finally {
      setUpdatingRole(null);
    }
  };

  // ── Open unfreeze dialog ──
  const openUnfreezeDialog = (lead: Lead) => {
    setUnfreezeConfirm(lead);
    setCreateFollowUp(true);
    setFollowUpTitle("Nachfassen: " + lead.name);
    setFollowUpDescription("");
    // Default: tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFollowUpDate(tomorrow);
    setFollowUpTime("09:00");
    setFollowUpAssignee(lead.assigned_to || "");
  };

  // ── Unfreeze lead ──
  const handleUnfreeze = async () => {
    if (!unfreezeConfirm) return;
    setUnfreezing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminProfile = profiles.find((p) => p.user_id === userData.user?.id);

      // Mark all overdue incomplete tasks as done for this lead
      const overdueTasks = (frozenLeadTasks[unfreezeConfirm.id] || []).filter((t) => isPast(new Date(t.due_date)));
      const overdueIds = overdueTasks.map((t) => t.id);

      if (overdueIds.length > 0) {
        const { error: taskError } = await supabase.from("tasks").update({ done: true }).in("id", overdueIds);
        if (taskError) throw taskError;
      }

      // Directly unfreeze the lead
      const { error: leadError } = await supabase.from("leads").update({ is_frozen: false }).eq("id", unfreezeConfirm.id);
      if (leadError) throw leadError;

      // Add history entry
      await supabase.from("lead_history").insert({
        lead_id: unfreezeConfirm.id,
        action: "Lead Unfrozen",
        details: `Lead wurde manuell durch Admin (${adminProfile?.full_name || "Admin"}) entfroren. ${overdueIds.length} überfällige Task(s) als erledigt markiert.`,
        created_by: userData.user?.id,
        user_name: adminProfile?.full_name || "Admin",
      });

      // Create follow-up task if requested
      if (createFollowUp && followUpTitle.trim() && followUpDate) {
        const assigneeProfile = profilesList.find((p) => p.full_name === followUpAssignee);
        const assigneeId = assigneeProfile?.user_id || userData.user?.id || "";
        const assigneeName = followUpAssignee || adminProfile?.full_name || "Admin";

        await createTask({
          lead_id: unfreezeConfirm.id,
          lead_name: unfreezeConfirm.name,
          email_address: unfreezeConfirm.email || null,
          phone_number: unfreezeConfirm.phone || null,
          title: followUpTitle.trim(),
          description: followUpDescription.trim() || null,
          due_date: format(
            new Date(`${format(followUpDate, "yyyy-MM-dd")}T${followUpTime}`),
            "yyyy-MM-dd HH:mm:ssXXX"
          ),
          assigned_to: assigneeId,
          assigned_to_name: assigneeName,
          done: false,
          created_by: userData.user?.id || "",
        });

        await supabase.from("lead_history").insert({
          lead_id: unfreezeConfirm.id,
          action: "Follow-Up Task Created",
          details: `Neuer Follow-Up-Task erstellt: "${followUpTitle.trim()}" — fällig ${format(followUpDate, "dd.MM.yyyy", { locale: de })} ${followUpTime}, zugewiesen an ${assigneeName}`,
          created_by: userData.user?.id,
          user_name: adminProfile?.full_name || "Admin",
        });
      }

      toast({
        title: "Lead entfroren",
        description: `${unfreezeConfirm.name} wurde freigeschaltet.${createFollowUp && followUpTitle.trim() && followUpDate ? " Follow-Up-Task wurde erstellt." : ""}`,
      });

      setUnfreezeConfirm(null);
      setTimeout(() => fetchFrozenLeadTasks(), 500);
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message || "Lead konnte nicht entfroren werden.", variant: "destructive" });
    } finally {
      setUnfreezing(false);
    }
  };

  // ── Change lead status ──
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setChangingStatus(leadId);
    try {
      const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
      if (error) throw error;

      const { data: userData } = await supabase.auth.getUser();
      const adminProfile = profiles.find((p) => p.user_id === userData.user?.id);
      const lead = leads.find((l) => l.id === leadId);
      await supabase.from("lead_history").insert({
        lead_id: leadId,
        action: "Status Changed by Admin",
        details: `Status geändert: ${lead?.status} → ${newStatus}`,
        created_by: userData.user?.id,
        user_name: adminProfile?.full_name || "Admin",
        old_values: { status: lead?.status },
        new_values: { status: newStatus },
      });

      toast({ title: "Status geändert", description: `Lead wurde auf "${newStatus}" gesetzt.` });
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setChangingStatus(null);
    }
  };

  // ── Change lead assignment ──
  const handleAssignmentChange = async (leadId: string, newAssignment: string) => {
    setChangingAssignment(leadId);
    try {
      const { error } = await supabase.from("leads").update({ assigned_to: newAssignment }).eq("id", leadId);
      if (error) throw error;

      const { data: userData } = await supabase.auth.getUser();
      const adminProfile = profiles.find((p) => p.user_id === userData.user?.id);
      const lead = leads.find((l) => l.id === leadId);
      await supabase.from("lead_history").insert({
        lead_id: leadId,
        action: "Reassigned by Admin",
        details: `Zugewiesen: ${lead?.assigned_to || "Niemand"} → ${newAssignment || "Niemand"}`,
        created_by: userData.user?.id,
        user_name: adminProfile?.full_name || "Admin",
        old_values: { assigned_to: lead?.assigned_to },
        new_values: { assigned_to: newAssignment },
      });

      toast({ title: "Zuweisung geändert", description: `Lead wurde ${newAssignment || "niemandem"} zugewiesen.` });
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setChangingAssignment(null);
    }
  };

  // ── Sort toggle helper ──
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  if (!isAllowed) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin-Bereich</h1>
        <p className="text-muted-foreground">Nutzer, Leads und System-Regeln verwalten</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Nutzer
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Lead-Management
            {frozenLeads.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                {frozenLeads.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════ TAB 1: USER MANAGEMENT ═══════════ */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Create User Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5" />
                  Neuen Nutzer einladen
                </CardTitle>
                <CardDescription>
                  Der Nutzer kann sich sofort mit diesen Zugangsdaten einloggen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Name</Label>
                    <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))} placeholder="Max Mustermann" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="max@pengoro.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Passwort</Label>
                    <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} placeholder="Mindestens 6 Zeichen" minLength={6} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Rolle</Label>
                    <Select value={formData.account_type} onValueChange={(v) => setFormData((p) => ({ ...p, account_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        {accountType === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={creating || !formData.full_name || !formData.email || !formData.password} className="w-full">
                    {creating ? "Wird erstellt..." : "Nutzer erstellen"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* User List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Alle Nutzer ({profiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProfiles ? (
                  <div className="text-center py-8 text-muted-foreground">Laden...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>E-Mail</TableHead>
                          <TableHead>Rolle</TableHead>
                          <TableHead className="text-right">Aktion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles.map((profile) => {
                          const isSelf = profile.user_id === user?.id;
                          return (
                            <TableRow key={profile.id}>
                              <TableCell className="font-medium">
                                {profile.full_name || "—"}
                                {isSelf && <span className="ml-2 text-xs text-muted-foreground">(Du)</span>}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{profile.email || "—"}</TableCell>
                              <TableCell>{roleBadge(profile.account_type)}</TableCell>
                              <TableCell className="text-right">
                                {isSelf ? (
                                  <span className="text-xs text-muted-foreground">—</span>
                                ) : (
                                  <Select value={profile.account_type || "user"} onValueChange={(v) => handleRoleChange(profile.user_id, v)} disabled={updatingRole === profile.user_id}>
                                    <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      {accountType === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════ TAB 2: LEAD MANAGEMENT ═══════════ */}
        <TabsContent value="leads" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="cursor-pointer hover:border-red-300 transition-colors" onClick={() => { setLeadFreezeFilter("frozen"); setLeadStatusFilter("all"); setLeadAssignmentFilter("all"); }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10"><Lock className="h-5 w-5 text-red-500" /></div>
                  <div>
                    <p className="text-2xl font-bold">{frozenLeads.length}</p>
                    <p className="text-xs text-muted-foreground">Gefrorene Leads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-green-300 transition-colors" onClick={() => { setLeadFreezeFilter("active"); setLeadStatusFilter("all"); setLeadAssignmentFilter("all"); }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="h-5 w-5 text-green-500" /></div>
                  <div>
                    <p className="text-2xl font-bold">{leads.filter((l) => !l.is_frozen).length}</p>
                    <p className="text-xs text-muted-foreground">Aktive Leads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-amber-300 transition-colors" onClick={() => { setLeadFreezeFilter("all"); setLeadStatusFilter("Stuck"); setLeadAssignmentFilter("all"); }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10"><AlertTriangle className="h-5 w-5 text-amber-500" /></div>
                  <div>
                    <p className="text-2xl font-bold">{leads.filter((l) => l.status === "Stuck").length}</p>
                    <p className="text-xs text-muted-foreground">Stuck Leads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => { setLeadFreezeFilter("all"); setLeadStatusFilter("all"); setLeadAssignmentFilter("all"); }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10"><Users className="h-5 w-5 text-blue-500" /></div>
                  <div>
                    <p className="text-2xl font-bold">{leads.length}</p>
                    <p className="text-xs text-muted-foreground">Leads gesamt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Frozen Leads Alert */}
          {frozenLeads.length > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                  <Lock className="h-5 w-5" />
                  Gefrorene Leads — sofortige Aufmerksamkeit ({frozenLeads.length})
                </CardTitle>
                <CardDescription>
                  Gesperrt wegen überfälliger Tasks. Entfrieren erstellt automatisch einen Follow-Up-Task.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-red-200/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Zugewiesen an</TableHead>
                        <TableHead>Überfällige Tasks</TableHead>
                        <TableHead className="text-right">Aktion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {frozenLeads.map((lead) => {
                        const tasks = frozenLeadTasks[lead.id] || [];
                        const overdueTasks = tasks.filter((t) => isPast(new Date(t.due_date)));
                        return (
                          <TableRow key={lead.id} className="bg-red-500/5">
                            <TableCell>
                              <div>
                                <span className="font-medium">{lead.name}</span>
                                <p className="text-xs text-muted-foreground">{lead.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{statusBadge(lead.status)}</TableCell>
                            <TableCell className="text-sm">{lead.assigned_to || "—"}</TableCell>
                            <TableCell>
                              {loadingTasks ? (
                                <span className="text-xs text-muted-foreground">Laden...</span>
                              ) : overdueTasks.length > 0 ? (
                                <div className="space-y-1">
                                  {overdueTasks.slice(0, 3).map((task) => (
                                    <div key={task.id} className="flex items-center gap-1.5 text-xs">
                                      <Clock className="h-3 w-3 text-red-500 shrink-0" />
                                      <span className="truncate max-w-[200px]">{task.title}</span>
                                      <span className="text-red-500 shrink-0">
                                        (fällig {format(new Date(task.due_date), "dd.MM.", { locale: de })})
                                      </span>
                                    </div>
                                  ))}
                                  {overdueTasks.length > 3 && (
                                    <span className="text-xs text-muted-foreground">+{overdueTasks.length - 3} weitere</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Keine überfälligen Tasks</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/leads/${lead.id}`)} className="h-8">
                                  <Eye className="h-3.5 w-3.5 mr-1" />Öffnen
                                </Button>
                                <Button size="sm" onClick={() => openUnfreezeDialog(lead)} className="h-8 bg-green-600 hover:bg-green-700 text-white">
                                  <Unlock className="h-3.5 w-3.5 mr-1" />Entfrieren
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ArrowUpDown className="h-5 w-5" />
                Alle Leads verwalten
              </CardTitle>
              <CardDescription>
                Filtern, sortieren, Status ändern, zuweisen, entfrieren.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Name, E-Mail, Telefon..." value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={leadFreezeFilter} onValueChange={setLeadFreezeFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Leads</SelectItem>
                    <SelectItem value="frozen">Nur gefroren</SelectItem>
                    <SelectItem value="active">Nur aktive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={leadAssignmentFilter} onValueChange={setLeadAssignmentFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                    <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                    {usedAssignees.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                {filteredLeads.length} Lead{filteredLeads.length !== 1 ? "s" : ""} gefunden
              </p>

              {/* Table */}
              {leadsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Laden...</div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30px]"></TableHead>
                          <TableHead>
                            <button onClick={() => toggleSort("name")} className="flex items-center hover:text-foreground transition-colors">
                              Name <SortIcon field="name" />
                            </button>
                          </TableHead>
                          <TableHead>
                            <button onClick={() => toggleSort("status")} className="flex items-center hover:text-foreground transition-colors">
                              Status <SortIcon field="status" />
                            </button>
                          </TableHead>
                          <TableHead>
                            <button onClick={() => toggleSort("assigned_to")} className="flex items-center hover:text-foreground transition-colors">
                              Zugewiesen an <SortIcon field="assigned_to" />
                            </button>
                          </TableHead>
                          <TableHead>
                            <button onClick={() => toggleSort("created_at")} className="flex items-center hover:text-foreground transition-colors">
                              Erstellt <SortIcon field="created_at" />
                            </button>
                          </TableHead>
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLeads.slice(0, 100).map((lead) => (
                          <TableRow key={lead.id} className={lead.is_frozen ? "bg-red-500/5" : ""}>
                            <TableCell className="w-[30px] text-center">
                              {lead.is_frozen && <Lock className="h-3.5 w-3.5 text-red-500" />}
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium">{lead.name}</span>
                                <p className="text-xs text-muted-foreground">{lead.email || lead.phone || "—"}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select value={lead.status} onValueChange={(v) => handleStatusChange(lead.id, v)} disabled={changingStatus === lead.id}>
                                <SelectTrigger className="w-[190px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {ALL_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select value={lead.assigned_to || "unassigned"} onValueChange={(v) => handleAssignmentChange(lead.id, v === "unassigned" ? "" : v)} disabled={changingAssignment === lead.id}>
                                <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                                  {agentNames.map((name) => (<SelectItem key={name} value={name}>{name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(lead.created_at), "dd.MM.yy", { locale: de })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/leads/${lead.id}`)} className="h-7 px-2">
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {lead.is_frozen && (
                                  <Button size="sm" onClick={() => openUnfreezeDialog(lead)} className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white">
                                    <Unlock className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredLeads.length > 100 && (
                    <p className="text-center text-sm text-muted-foreground py-3">
                      Zeige 100 von {filteredLeads.length} Leads. Nutze die Filter um einzugrenzen.
                    </p>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════ UNFREEZE + FOLLOW-UP DIALOG ═══════════ */}
      <Dialog open={!!unfreezeConfirm} onOpenChange={() => setUnfreezeConfirm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-600" />
              Lead entfrieren
            </DialogTitle>
            <DialogDescription>
              <strong>{unfreezeConfirm?.name}</strong> wird freigeschaltet. Überfällige Tasks werden als erledigt markiert.
            </DialogDescription>
          </DialogHeader>

          {/* Overdue tasks list */}
          {unfreezeConfirm && (frozenLeadTasks[unfreezeConfirm.id] || []).filter((t) => isPast(new Date(t.due_date))).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Wird als erledigt markiert:</p>
              <div className="rounded-md border p-3 space-y-2 bg-muted/30 max-h-[120px] overflow-y-auto">
                {(frozenLeadTasks[unfreezeConfirm.id] || [])
                  .filter((t) => isPast(new Date(t.due_date)))
                  .map((task) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="truncate">{task.title}</span>
                      <span className="text-muted-foreground text-xs ml-auto shrink-0">
                        {format(new Date(task.due_date), "dd.MM. HH:mm", { locale: de })}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Follow-up task section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="create-followup"
                checked={createFollowUp}
                onCheckedChange={(v) => setCreateFollowUp(!!v)}
              />
              <Label htmlFor="create-followup" className="flex items-center gap-2 cursor-pointer font-medium">
                <Plus className="h-4 w-4" />
                Follow-Up-Task direkt erstellen
              </Label>
            </div>

            {createFollowUp && (
              <div className="space-y-3 pl-7 border-l-2 border-green-500/30">
                <div className="space-y-1.5">
                  <Label htmlFor="fu-title" className="text-xs">Aufgabe</Label>
                  <Input
                    id="fu-title"
                    value={followUpTitle}
                    onChange={(e) => setFollowUpTitle(e.target.value)}
                    placeholder="z.B. Anrufen und neuen Termin vereinbaren"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fu-desc" className="text-xs">Beschreibung (optional)</Label>
                  <Textarea
                    id="fu-desc"
                    value={followUpDescription}
                    onChange={(e) => setFollowUpDescription(e.target.value)}
                    placeholder="Weitere Details..."
                    className="resize-none h-16 text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Datum</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs", !followUpDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                          {followUpDate ? format(followUpDate, "dd.MM.yy") : "Datum"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={followUpDate}
                          onSelect={setFollowUpDate}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Uhrzeit</Label>
                    <Input type="time" value={followUpTime} onChange={(e) => setFollowUpTime(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Zuweisen an</Label>
                    <Select value={followUpAssignee || "unset"} onValueChange={(v) => setFollowUpAssignee(v === "unset" ? "" : v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Mitarbeiter" /></SelectTrigger>
                      <SelectContent>
                        {agentNames.map((name) => (<SelectItem key={name} value={name}>{name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUnfreezeConfirm(null)}>Abbrechen</Button>
            <Button
              onClick={handleUnfreeze}
              disabled={unfreezing || (createFollowUp && (!followUpTitle.trim() || !followUpDate))}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {unfreezing ? "Wird entfroren..." : createFollowUp ? "Entfrieren + Task erstellen" : "Entfrieren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
