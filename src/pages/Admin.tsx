import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password
        },
      });

      if (error) throw error;

      setStatus(`Success: User ${formData.full_name} created successfully!`);
      toast({
        title: "Success",
        description: `User ${formData.full_name} has been created successfully.`,
      });
      
      // Reset form
      setFormData({ full_name: "", email: "", password: "" });
    } catch (e: any) {
      const errorMessage = `Error: ${e.message || "Unable to create user"}`;
      setStatus(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <CardTitle>Admin - Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            {status && (
              <Alert>
                <AlertDescription>{status}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              disabled={loading || !formData.full_name || !formData.email || !formData.password}
              className="w-full"
            >
              {loading ? "Creating User..." : "Create User"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Quick Actions:</p>
            <Button 
              onClick={() => setFormData({
                full_name: "Jonas Plewka",
                email: "jonas@pengoro.com", 
                password: "Pengoro_2025"
              })}
              variant="outline"
              size="sm"
            >
              Fill Jonas Plewka Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}