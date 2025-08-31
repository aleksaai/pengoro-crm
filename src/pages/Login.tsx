import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import logo from "@/assets/pengoro-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [setupMsg, setSetupMsg] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect authenticated users to main page
        if (session?.user) {
          navigate('/');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error: any) {
      if (error.message.includes("Email not confirmed")) {
        setError("Please check your email and click the verification link before signing in.");
      } else if (error.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        setError(error.message || "An error occurred during sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setCreating(true);
      setSetupMsg("");
      const { data, error } = await supabase.functions.invoke('create-user', { body: {} });
      if (error) throw error;
      setSetupMsg(data?.message || 'User created. You can now log in.');
    } catch (e: any) {
      setError(e.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Welcome Back
          </h1>
          <p className="text-muted-foreground font-medium">
            Sign in to your account
          </p>
        </div>

        {/* Auth Form */}
        <Card className="glass-card border-0 animate-slide-up">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex justify-center">
              <img 
                src={logo} 
                alt="Pengoro Logo" 
                className="h-12 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-display font-semibold text-center">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="bg-destructive/10 border-destructive/20 animate-scale-in">
                <AlertDescription className="text-destructive font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="modern-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="modern-input"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full modern-button"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="space-y-2">
              <Button type="button" variant="outline" onClick={handleCreateUser} disabled={creating} className="w-full">
                {creating ? 'Creating user…' : 'Create initial user'}
              </Button>
              {setupMsg && (
                <p className="text-sm text-muted-foreground text-center">{setupMsg}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© 2024 Pengoro CRM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}