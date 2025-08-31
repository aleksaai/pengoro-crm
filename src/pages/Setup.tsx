import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Setup() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setStatus("");
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {},
      });
      if (error) throw error;
      setStatus(`Success: ${data?.message || "User created"}`);
    } catch (e: any) {
      setStatus(`Error: ${e.message || "Unable to create user"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-xl w-full glass-card">
        <CardHeader>
          <CardTitle>Create initial user</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <Alert>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-3">
            <Button onClick={run} disabled={loading} className="modern-button">
              {loading ? "Running..." : "Run again"}
            </Button>
            <Button asChild variant="outline">
              <a href="/login">Go to Login</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
