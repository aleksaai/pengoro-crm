import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, ShieldCheck, User, Users, ArrowLeft } from "lucide-react";

interface ProfileWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  account_type: "super_admin" | "admin" | "user" | null;
  created_at: string;
}

const roleBadge = (role: string | null) => {
  switch (role) {
    case "super_admin":
      return <Badge className="bg-red-500/15 text-red-600 border-red-500/30 hover:bg-red-500/20"><ShieldCheck className="w-3 h-3 mr-1" />Super Admin</Badge>;
    case "admin":
      return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
    default:
      return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />User</Badge>;
  }
};

export default function Admin() {
  const { user, accountType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const isAllowed = accountType === "super_admin" || accountType === "admin";

  useEffect(() => {
    if (accountType && !isAllowed) {
      navigate("/");
    }
  }, [accountType, isAllowed, navigate]);

  useEffect(() => {
    fetchProfiles();
  }, []);

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

      toast({
        title: "Nutzer erstellt",
        description: `${formData.full_name} (${formData.email}) wurde erfolgreich angelegt.`,
      });

      setFormData({ full_name: "", email: "", password: "", account_type: "user" });
      fetchProfiles();
    } catch (e: any) {
      toast({
        title: "Fehler",
        description: e.message || "Nutzer konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      // Prevent demoting yourself
      if (userId === user?.id) {
        toast({
          title: "Nicht erlaubt",
          description: "Du kannst deine eigene Rolle nicht ändern.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ account_type: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Rolle aktualisiert",
        description: `Rolle wurde auf ${newRole === "super_admin" ? "Super Admin" : newRole === "admin" ? "Admin" : "User"} geändert.`,
      });

      fetchProfiles();
    } catch (e: any) {
      toast({
        title: "Fehler",
        description: e.message || "Rolle konnte nicht geändert werden.",
        variant: "destructive",
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  if (!isAllowed) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nutzerverwaltung</h1>
          <p className="text-muted-foreground">Nutzer einladen und Rollen verwalten</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create User Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Max Mustermann"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="max@pengoro.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Mindestens 6 Zeichen"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Rolle</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(v) => setFormData((p) => ({ ...p, account_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {accountType === "super_admin" && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={creating || !formData.full_name || !formData.email || !formData.password}
                className="w-full"
              >
                {creating ? "Wird erstellt..." : "Nutzer erstellen"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alle Nutzer ({profiles.length})
            </CardTitle>
            <CardDescription>
              Übersicht aller registrierten Nutzer und deren Rollen.
            </CardDescription>
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
                            {isSelf && (
                              <span className="ml-2 text-xs text-muted-foreground">(Du)</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {profile.email || "—"}
                          </TableCell>
                          <TableCell>{roleBadge(profile.account_type)}</TableCell>
                          <TableCell className="text-right">
                            {isSelf ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <Select
                                value={profile.account_type || "user"}
                                onValueChange={(v) => handleRoleChange(profile.user_id, v)}
                                disabled={updatingRole === profile.user_id}
                              >
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  {accountType === "super_admin" && (
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                  )}
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
    </div>
  );
}
