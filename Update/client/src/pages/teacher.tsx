import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users,
  Trophy,
  BookOpen,
  LogOut,
  TrendingUp,
  BarChart3,
  Crown,
  Sword
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import type { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAdaptiveDifficulty } from "@shared/schema";

interface TeacherData {
  students: User[];
  stats: {
    totalStudents: number;
    averageFloor: number;
    totalBattles: number;
    averageWinRate: number;
  };
  floorDistribution: { floor: number; count: number }[];
  progressOverTime: { date: string; avgFloor: number }[];
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
      toast({
        title: "User deleted",
        description: "User has been removed from the system",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleResetUser = async (userId: string) => {
    if (!confirm("Reset this user's progress? They will return to Floor 1.")) return;
    try {
      await apiRequest("POST", `/api/admin/users/${userId}/reset`, {});
      toast({
        title: "Progress reset",
        description: "User has been returned to Floor 1",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset user progress",
        variant: "destructive",
      });
    }
  };

  const { data: students = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.role === "admin",
  });

  // Compute stats from students
  const stats = {
    totalStudents: students.length,
    averageFloor: students.length > 0 ? students.reduce((sum, s) => sum + (s.currentFloor || 1), 0) / students.length : 0,
    totalBattles: students.reduce((sum, s) => sum + ((s.battlesWon || 0) + (s.battlesLost || 0)), 0),
    averageWinRate: students.length > 0 
      ? Math.round(students.reduce((sum, s) => {
          const total = (s.battlesWon || 0) + (s.battlesLost || 0);
          return sum + (total > 0 ? (s.battlesWon || 0) / total * 100 : 0);
        }, 0) / students.length)
      : 0,
  };

  if (!user || user.role !== "admin") {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Compute floor distribution
  const floorDistribution = [...Array(12)].map((_, i) => ({
    floor: i + 1,
    count: students.filter(s => s.currentFloor === i + 1).length,
  }));

  // Compute progress over time (mock for now)
  const progressOverTime = [
    { date: "Week 1", avgFloor: 1.5 },
    { date: "Week 2", avgFloor: 2.8 },
    { date: "Week 3", avgFloor: 4.2 },
    { date: "Week 4", avgFloor: 5.5 },
    { date: "Week 5", avgFloor: 6.8 },
    { date: "Week 6", avgFloor: stats.averageFloor },
  ];

  const COLORS = ["hsl(45, 85%, 55%)", "hsl(270, 60%, 50%)", "hsl(200, 70%, 50%)", "hsl(340, 70%, 50%)"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="font-cinzel text-xl font-semibold text-tower-purple">
                  {user.displayName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tower Administrator
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/leaderboard">
                <Button variant="ghost" size="icon" data-testid="button-leaderboard">
                  <Trophy className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bebas text-3xl text-tower-gold tracking-wider">
                    {stats.totalStudents}
                  </div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="font-bebas text-3xl tracking-wider">
                    {stats.averageFloor.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Floor</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Sword className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="font-bebas text-3xl tracking-wider">
                    {stats.totalBattles}
                  </div>
                  <div className="text-sm text-muted-foreground">Battles</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <div className="font-bebas text-3xl tracking-wider">
                    {stats.averageWinRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Progress Over Time Chart */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="font-cinzel text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-tower-gold" />
                Class Progress Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={progressOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 20%)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(230, 10%, 55%)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(230, 10%, 55%)"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(230, 14%, 10%)", 
                      border: "1px solid hsl(230, 12%, 14%)",
                      borderRadius: "8px"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgFloor" 
                    stroke="hsl(45, 85%, 55%)" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(45, 85%, 55%)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Floor Distribution Chart */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="font-cinzel text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-tower-gold" />
                Floor Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={floorDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 20%)" />
                  <XAxis 
                    dataKey="floor" 
                    stroke="hsl(230, 10%, 55%)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(230, 10%, 55%)"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(230, 14%, 10%)", 
                      border: "1px solid hsl(230, 12%, 14%)",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(270, 60%, 50%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Users Management Table */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="font-cinzel text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-tower-gold" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Floor</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Level</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Difficulty</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">XP Progress</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Battles (W-L)</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center">
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => {
                      const difficulty = getAdaptiveDifficulty(student.level);
                      const xpForNextLevel = Math.floor(100 * Math.pow(1.5, student.level - 1));
                      const currentLevelXp = student.level > 1 
                        ? Array.from({ length: student.level - 1 }, (_, i) => 
                            Math.floor(100 * Math.pow(1.5, i))
                          ).reduce((a, b) => a + b, 0)
                        : 0;
                      const nextLevelXp = currentLevelXp + xpForNextLevel;
                      const xpInCurrentLevel = Math.max(0, student.xp - currentLevelXp);
                      const xpProgressPercent = Math.round((xpInCurrentLevel / xpForNextLevel) * 100);
                      
                      const difficultyColor = difficulty === "easy" ? "text-green-500" : 
                                             difficulty === "medium" ? "text-yellow-500" : "text-destructive";
                      
                      return (
                        <tr 
                          key={student.id} 
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                          data-testid={`row-user-${student.id}`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="font-bebas text-lg text-tower-gold">
                                  {student.level}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold">{student.displayName}</div>
                                <div className="text-xs text-muted-foreground">{student.email}</div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {student.role}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-4">
                            <Badge variant="outline" className="border-primary text-primary">
                              Floor {student.currentFloor}
                            </Badge>
                          </td>
                          <td className="text-center p-4">
                            <span className="font-bebas text-xl tracking-wider">{student.level}</span>
                          </td>
                          <td className="text-center p-4">
                            <Badge variant="outline" className={`capitalize ${difficultyColor}`}>
                              {difficulty}
                            </Badge>
                          </td>
                          <td className="text-center p-4">
                            <div className="flex flex-col items-center gap-1">
                              <div className="text-xs text-muted-foreground">
                                {xpInCurrentLevel}/{xpForNextLevel}
                              </div>
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden" data-testid={`progress-xp-${student.id}`}>
                                <div 
                                  className="h-full bg-accent transition-all"
                                  style={{ width: `${Math.min(100, xpProgressPercent)}%` }}
                                />
                              </div>
                              <div className="text-xs font-bebas text-tower-gold">
                                {xpProgressPercent}%
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-4">
                            <span className="text-green-500">{student.battlesWon}</span>
                            <span className="text-muted-foreground"> - </span>
                            <span className="text-destructive">{student.battlesLost}</span>
                          </td>
                          <td className="text-center p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                data-testid={`button-reset-${student.id}`}
                                onClick={() => handleResetUser(student.id)}
                              >
                                Reset
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                data-testid={`button-delete-${student.id}`}
                                onClick={() => handleDeleteUser(student.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
