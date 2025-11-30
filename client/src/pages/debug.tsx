import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function DebugPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSetFloor10 = async () => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not logged in" });
      return;
    }

    try {
      const res = await fetch(`/api/dev/test-floor/${user.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update floor");
      
      const updatedUser = await res.json();
      toast({ title: "Success!", description: `Floor updated to 10 - Lectures: ${updatedUser.lecturesCompleted}` });
      
      // Refresh the page after 1 second
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to set floor to 10" });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Debug Console</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current User ID:</p>
              <p className="font-mono bg-muted p-3 rounded break-all">{user?.id || "Not logged in"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Stats:</p>
              <div className="bg-muted p-3 rounded space-y-1">
                <p>Level: {user?.level}</p>
                <p>Floor: {user?.currentFloor}</p>
                <p>XP: {user?.xp}</p>
                <p>Lectures Completed: {user?.lecturesCompleted}</p>
                <p>Battles Won: {user?.battlesWon}</p>
              </div>
            </div>

            <Button 
              onClick={handleSetFloor10}
              className="w-full bg-primary"
            >
              Set Floor to 10 (for Battle Testing)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
