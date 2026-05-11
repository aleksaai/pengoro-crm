import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/pengoro-logo.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setError(err.message || "Fehler beim Zurücksetzen des Passworts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Neues Passwort
          </h1>
          <p className="text-muted-foreground font-medium">
            Gib dein neues Passwort ein
          </p>
        </div>

        <Card className="glass-card border-0 animate-slide-up">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex justify-center">
              <img src={logo} alt="Pengoro Logo" className="h-12 w-auto" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="bg-destructive/10 border-destructive/20 animate-scale-in">
                <AlertDescription className="text-destructive font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success ? (
              <Alert className="bg-green-500/10 border-green-500/20">
                <AlertDescription className="text-green-500 font-medium">
                  Passwort erfolgreich geändert. Du wirst weitergeleitet...
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Neues Passwort
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mindestens 6 Zeichen"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="modern-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-sm font-medium text-foreground">
                    Passwort bestätigen
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Passwort wiederholen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="modern-input"
                  />
                </div>

                <Button type="submit" className="w-full modern-button" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Wird gespeichert...
                    </span>
                  ) : (
                    "Passwort speichern"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
