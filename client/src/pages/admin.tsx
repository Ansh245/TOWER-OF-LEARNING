import React from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, BarChart3, Users, BookOpen, LogOut, RefreshCw, Trash2, Unlock, Search, Settings } from "lucide-react";

interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  systemHealth: string;
}

export default function TeacherPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [className, setClassName] = React.useState("");
  const [lectureTitle, setLectureTitle] = React.useState("");
  const [lectureDescription, setLectureDescription] = React.useState("");
  const [lectureXP, setLectureXP] = React.useState("50");
  const [searchFilter, setSearchFilter] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("classes");

  // Redirect non-teachers/admins
  if (user?.role !== "teacher" && user?.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  // ===== TEACHER QUERIES =====
  const { data: classes = [] } = useQuery({
    queryKey: ["/api/teacher/classes"],
    enabled: user?.role === "teacher",
    queryFn: async () => {
      const res = await fetch("/api/teacher/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json();
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["/api/teacher/students"],
    enabled: user?.role === "teacher",
    queryFn: async () => {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  // ===== ADMIN QUERIES =====
  const { data: stats } = useQuery<SystemStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "admin",
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
  });

  const { data: adminUsers = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // ===== MUTATIONS =====
  const createClassMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: className }),
      });
      if (!res.ok) throw new Error("Failed to create class");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Class Created", description: `${className} has been created` });
      setClassName("");
      qc.invalidateQueries({ queryKey: ["/api/teacher/classes"] });
    },
  });

  const createLectureMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lectureTitle,
          description: lectureDescription,
          xpReward: parseInt(lectureXP),
          floor: 1,
          order: 1,
        }),
      });
      if (!res.ok) throw new Error("Failed to create lecture");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Lecture Created", description: `${lectureTitle} has been created` });
      setLectureTitle("");
      setLectureDescription("");
      setLectureXP("50");
    },
  });

  const resetUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/reset-user/${userId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset user");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Success", description: "User reset successfully" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/delete-user/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Success", description: "User deleted successfully" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const promoteToTeacherMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/promote-teacher/${userId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to promote user");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Success", description: "User promoted to teacher" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filteredUsers = adminUsers.filter((u: any) => {
    if (!searchFilter) return true;
    const f = searchFilter.toLowerCase();
    return (u.displayName || "").toLowerCase().includes(f) || (u.email || "").toLowerCase().includes(f);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a13] via-[#1a1220] to-[#15101b] text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-tower-gold mb-2">
              {user?.role === "admin" ? "Admin Control Center" : "Teacher Dashboard"}
            </h1>
            <p className="text-muted-foreground">
              {user?.role === "admin" ? "Manage system and users" : "Manage classes and lectures"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="font-semibold text-tower-gold">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#2a1f33] border-b border-[#3b2a45] w-full justify-start">
            {user?.role === "teacher" && (
              <>
                <TabsTrigger value="classes">
                  <BookOpen className="w-4 h-4 mr-2" />
                  My Classes
                </TabsTrigger>
                <TabsTrigger value="students">
                  <Users className="w-4 h-4 mr-2" />
                  Students
                </TabsTrigger>
                <TabsTrigger value="create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Content
                </TabsTrigger>
              </>
            )}
            {user?.role === "admin" && (
              <>
                <TabsTrigger value="admin-dashboard">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="admin-users">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* ===== TEACHER TABS ===== */}
          {user?.role === "teacher" && (
            <>
              {/* Classes Tab */}
              <TabsContent value="classes" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {classes.length === 0 ? (
                    <p className="text-muted-foreground">No classes yet. Create one in the Create Content tab.</p>
                  ) : (
                    classes.map((cls: any) => (
                      <Card key={cls.id} className="bg-[#1a1220]/60 border-[#3b2a45]">
                        <CardHeader>
                          <CardTitle className="text-tower-gold">{cls.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {cls.studentCount || 0} students
                          </p>
                          <Button className="w-full" size="sm">
                            Manage
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="space-y-4 mt-6">
                <Card className="bg-[#1a1220]/60 border-[#3b2a45]">
                  <CardHeader>
                    <CardTitle>Students Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {students.length === 0 ? (
                      <p className="text-muted-foreground">No students yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-[#3b2a45]">
                            <tr>
                              <th className="text-left py-3 px-4">Name</th>
                              <th className="text-left py-3 px-4">Level</th>
                              <th className="text-left py-3 px-4">Floor</th>
                              <th className="text-left py-3 px-4">XP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((student: any) => (
                              <tr key={student.id} className="border-b border-[#3b2a45] hover:bg-[#2a1f33]">
                                <td className="py-3 px-4">{student.displayName}</td>
                                <td className="py-3 px-4">{student.level}</td>
                                <td className="py-3 px-4">{student.currentFloor}</td>
                                <td className="py-3 px-4">{student.xp}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Create Content Tab */}
              <TabsContent value="create" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Create Class */}
                  <Card className="bg-[#1a1220]/60 border-[#3b2a45]">
                    <CardHeader>
                      <CardTitle>Create New Class</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Class name (e.g., Mathematics 101)"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="bg-[#2a1f33] border-[#3b2a45]"
                      />
                      <Button
                        onClick={() => createClassMutation.mutate()}
                        disabled={!className || createClassMutation.isPending}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {createClassMutation.isPending ? "Creating..." : "Create Class"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Create Lecture */}
                  <Card className="bg-[#1a1220]/60 border-[#3b2a45]">
                    <CardHeader>
                      <CardTitle>Create New Lecture</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Lecture title"
                        value={lectureTitle}
                        onChange={(e) => setLectureTitle(e.target.value)}
                        className="bg-[#2a1f33] border-[#3b2a45]"
                      />
                      <Input
                        placeholder="Description"
                        value={lectureDescription}
                        onChange={(e) => setLectureDescription(e.target.value)}
                        className="bg-[#2a1f33] border-[#3b2a45]"
                      />
                      <Input
                        type="number"
                        placeholder="XP Reward"
                        value={lectureXP}
                        onChange={(e) => setLectureXP(e.target.value)}
                        className="bg-[#2a1f33] border-[#3b2a45]"
                      />
                      <Button
                        onClick={() => createLectureMutation.mutate()}
                        disabled={!lectureTitle || createLectureMutation.isPending}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {createLectureMutation.isPending ? "Creating..." : "Create Lecture"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </>
          )}

          {/* ===== ADMIN TABS ===== */}
          {user?.role === "admin" && (
            <>
              {/* Admin Dashboard Tab */}
              <TabsContent value="admin-dashboard" className="space-y-6 mt-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-[#1a1220]/60 border-[#3b2a45]">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                          <p className="text-3xl font-bold text-tower-gold">{stats?.totalUsers ?? 0}</p>
                        </div>
                        <Users className="w-12 h-12 text-tower-gold/20" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1a1220]/60 border-[#3b2a45]">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Students</p>
                          <p className="text-3xl font-bold text-green-400">{stats?.totalStudents ?? 0}</p>
                        </div>
                        <Users className="w-12 h-12 text-green-400/20" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1a1220]/60 border-[#3b2a45]">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Teachers</p>
                          <p className="text-3xl font-bold text-blue-400">{stats?.totalTeachers ?? 0}</p>
                        </div>
                        <BookOpen className="w-12 h-12 text-blue-400/20" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1a1220]/60 border-[#3b2a45]">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Admins</p>
                          <p className="text-3xl font-bold text-red-400">{stats?.totalAdmins ?? 0}</p>
                        </div>
                        <Settings className="w-12 h-12 text-red-400/20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Admin Users Tab */}
              <TabsContent value="admin-users" className="space-y-4 mt-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-10 bg-[#2a1f33] border-[#3b2a45]"
                    />
                  </div>
                  <Button onClick={() => qc.invalidateQueries({ queryKey: ["/api/admin/users"] })} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <Card className="bg-[#1a1220]/60 border-[#3b2a45]">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[#3b2a45] bg-[#2a1f33]">
                          <tr>
                            <th className="text-left py-4 px-6 font-medium">Name</th>
                            <th className="text-left py-4 px-6 font-medium">Email</th>
                            <th className="text-left py-4 px-6 font-medium">Role</th>
                            <th className="text-left py-4 px-6 font-medium">Level</th>
                            <th className="text-left py-4 px-6 font-medium">Floor</th>
                            <th className="text-left py-4 px-6 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersLoading ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                Loading users...
                              </td>
                            </tr>
                          ) : filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                No users found
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u: any) => (
                              <tr key={u.id} className="border-b border-[#3b2a45] hover:bg-[#2a1f33] transition">
                                <td className="py-4 px-6 font-medium">{u.displayName}</td>
                                <td className="py-4 px-6 text-muted-foreground text-xs">{u.email}</td>
                                <td className="py-4 px-6">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      u.role === "admin"
                                        ? "bg-red-500/20 text-red-400"
                                        : u.role === "teacher"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-green-500/20 text-green-400"
                                    }`}
                                  >
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-4 px-6">{u.level}</td>
                                <td className="py-4 px-6">{u.currentFloor}</td>
                                <td className="py-4 px-6">
                                  <div className="flex gap-2">
                                    {u.role === "student" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => promoteToTeacherMutation.mutate(u.id)}
                                        title="Promote to Teacher"
                                      >
                                        <Unlock className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => resetUserMutation.mutate(u.id)}
                                      title="Reset User"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    {u.role !== "admin" && (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          if (confirm(`Delete user ${u.displayName}?`)) {
                                            deleteUserMutation.mutate(u.id);
                                          }
                                        }}
                                        title="Delete User"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}