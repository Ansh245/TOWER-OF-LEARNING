import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { 
  GraduationCap, 
  BookOpen,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Link } from "wouter";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"role" | "form">("role");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "admin" | null>(null);

  const handleRoleSelect = (role: "student" | "admin", signup: boolean) => {
    setSelectedRole(role);
    setIsSignUp(signup);
    setStep("form");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp) {
      // Signup validation
      if (!email.trim() || !displayName.trim() || !password.trim() || !confirmPassword.trim()) {
        toast({
          title: "Missing Information",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        return;
      }
      if (password !== confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please make sure your passwords match",
          variant: "destructive",
        });
        return;
      }
      if (password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }

      try {
        await login(email, displayName, selectedRole, password, true);
        toast({
          title: "Welcome to the Tower!",
          description: `You've joined as a ${selectedRole}. Begin your ascent!`,
        });
        navigate(selectedRole === "student" ? "/dashboard" : "/admin");
      } catch (error: any) {
        toast({
          title: "Sign Up Failed",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Login validation
      if (!email.trim() || !password.trim()) {
        toast({
          title: "Missing Information",
          description: "Please enter your email and password",
          variant: "destructive",
        });
        return;
      }

      try {
        await login(email, "", selectedRole, password, false);
        toast({
          title: "Welcome Back!",
          description: "You've entered the Tower",
        });
        navigate(selectedRole === "student" ? "/dashboard" : "/admin");
      } catch (error: any) {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card className="bg-card/80 backdrop-blur border-border">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-cinzel text-3xl text-tower-gold">
              {step === "role" ? "Choose Your Path" : isSignUp ? "Create Account" : "Sign In"}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            {step === "role" ? (
              <div className="space-y-6">
                <p className="text-center text-muted-foreground mb-8">
                  Are you ascending as a Student or an Admin?
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRoleSelect("student", false)}
                    className="group relative overflow-hidden rounded-lg border-2 border-primary/50 p-6 text-center transition-all hover:border-primary hover:bg-primary/10"
                    data-testid="button-role-student"
                  >
                    <div className="space-y-3">
                      <BookOpen className="h-8 w-8 text-primary mx-auto" />
                      <div className="font-semibold">Student</div>
                      <div className="text-xs text-muted-foreground">Learn & Battle</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSelect("admin", false)}
                    className="group relative overflow-hidden rounded-lg border-2 border-accent/50 p-6 text-center transition-all hover:border-accent hover:bg-accent/10"
                    data-testid="button-role-admin"
                  >
                    <div className="space-y-3">
                      <GraduationCap className="h-8 w-8 text-accent mx-auto" />
                      <div className="font-semibold">Admin</div>
                      <div className="text-xs text-muted-foreground">Manage & Monitor</div>
                    </div>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card/80 text-muted-foreground">
                      or sign up instead
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRoleSelect("student", true)}
                    className="group relative overflow-hidden rounded-lg border-2 border-primary/50 p-4 text-center transition-all hover:border-primary hover:bg-primary/10 opacity-75"
                    data-testid="button-signup-student"
                  >
                    <div className="space-y-2">
                      <BookOpen className="h-6 w-6 text-primary mx-auto" />
                      <div className="font-semibold text-sm">Sign Up Student</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSelect("admin", true)}
                    className="group relative overflow-hidden rounded-lg border-2 border-accent/50 p-4 text-center transition-all hover:border-accent hover:bg-accent/10 opacity-75"
                    data-testid="button-signup-admin"
                  >
                    <div className="space-y-2">
                      <GraduationCap className="h-6 w-6 text-accent mx-auto" />
                      <div className="font-semibold text-sm">Sign Up Admin</div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted/50"
                    data-testid="input-email"
                    required
                  />
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Your Tower Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-muted/50"
                      data-testid="input-display-name"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={isSignUp ? "Create a password (min 6 chars)" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted/50"
                    data-testid="input-password"
                    required
                  />
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-muted/50"
                      data-testid="input-confirm-password"
                      required
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg tower-glow"
                  data-testid={isSignUp ? "button-signup" : "button-login"}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("role");
                    setSelectedRole(null);
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                    setDisplayName("");
                  }}
                  data-testid="button-back-role"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Role Selection
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
