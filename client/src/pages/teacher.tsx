import React from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Trophy, BookOpen, LogOut, TrendingUp, Award, Flame, BarChart3, Search } from "lucide-react";
import AdminPanel from "./admin-panel";
import StudentPerfChart from "@/components/ui/student-perf-chart";
import QuestionManager from "@/components/QuestionManager";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = React.useState<"teacher" | "admin">("teacher");
  const [searchFilter, setSearchFilter] = React.useState("");

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ["/api/teacher/students"],
    enabled: user?.role === "teacher" || user?.role === "admin",
    queryFn: async () => {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  const { data: performanceData = [] } = useQuery<any[]>({
    queryKey: ["/api/teacher/student-performance"],
    enabled: user?.role === "teacher" || user?.role === "admin",
    queryFn: async () => {
      const res = await fetch("/api/teacher/student-performance");
      if (!res.ok) throw new Error("Failed to fetch performance data");
      return res.json();
    },
  });

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
                <p className="text-sm text-muted-foreground">Tower Instructor</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/leaderboard">
                <Button variant="ghost" size="icon" data-testid="button-leaderboard">
                  <Trophy className="h-5 w-5" />
                </Button>
              </Link>
              {user.role === "admin" && (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant={tab === "teacher" ? "default" : "ghost"} 
                    onClick={() => setTab("teacher")}
                  >
                    Teacher
                  </Button>
                  <Button 
                    size="sm" 
                    variant={tab === "admin" ? "default" : "ghost"} 
                    onClick={() => setTab("admin")}
                  >
                    Admin
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {user.role === "admin" && tab === "admin" ? (
          <AdminPanel />
        ) : (
          <div className="space-y-8">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="font-cinzel text-lg flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-tower-gold" />
                  Student Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StudentPerfChart data={performanceData} />
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="font-cinzel text-lg flex items-center gap-2">
                  <Users className="h-6 w-6 text-tower-gold" />
                  All Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search students..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students
                    .filter((s) =>
                      s.displayName.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                    .map((student) => (
                      <div key={student.id} className="p-4 border rounded-lg bg-muted/30">
                        <p className="font-semibold">{student.displayName}</p>
                        <p className="text-sm text-muted-foreground">Level {student.level}</p>
                        <p className="text-sm text-muted-foreground">Floor {student.currentFloor}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <QuestionManager />
          </div>
        )}
      </main>
    </div>
  );
}
