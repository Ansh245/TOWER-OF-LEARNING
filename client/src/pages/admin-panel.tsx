import React from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  Users,
  BarChart3,
  Settings,
  Trash2,
  RefreshCw,
  TrendingUp,
  Award,
  Flame,
  Building2,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  systemHealth: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchFilter, setSearchFilter] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [editMode, setEditMode] = React.useState<Record<string, boolean>>({});

  const [activeTab, setActiveTab] = React.useState("users");
 
  // Power control inputs
  interface UserPowerControls {
    levelAmount: string;
    xpAmount: string;
    floorNumber: string;
    wins: string;
    losses: string;
    lecturesCount: string;
  }
  const [powerControls, setPowerControls] = React.useState<Record<string, UserPowerControls>>({});

  // Queries
  const { data: stats } = useQuery<SystemStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "admin",
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: adminUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Mutations
  const increaseLevelMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const res = await fetch(`/api/admin/increase-level/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Level increased" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const decreaseLevelMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const res = await fetch(`/api/admin/decrease-level/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Level decreased" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const addXpMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string, amount: number }) => {
      const res = await fetch(`/api/admin/add-xp/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ XP added" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const setFloorMutation = useMutation({
    mutationFn: async ({ userId, floor }: { userId: string, floor: number }) => {
      const res = await fetch(`/api/admin/set-floor/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floor }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Floor updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const setBattleStatsMutation = useMutation({
    mutationFn: async ({ userId, wins, losses }: { userId: string, wins: number, losses: number }) => {
      const res = await fetch(`/api/admin/set-battle-stats/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battlesWon: wins,
          battlesLost: losses,
          streak: 0,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Battle stats updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const setLecturesMutation = useMutation({
    mutationFn: async ({ userId, lecturesCompleted }: { userId: string, lecturesCompleted: number }) => {
      const res = await fetch(`/api/admin/set-lectures/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lecturesCompleted }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Lectures updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const promoteToTeacherMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/promote-teacher/${userId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Promoted to teacher" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const grantAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/grant-admin/${userId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Granted admin role" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const revokeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/revoke-admin/${userId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Admin role revoked" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const resetProgressMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/reset-progress/${userId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Progress reset" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const resetAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/system/reset-all", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "🚨 System Reset", description: `Reset ${data.usersAffected} users` });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/delete-user/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ User deleted" });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
    },
  });

  const filteredUsers = adminUsers.filter((u) => {
    if (!searchFilter) return true;
    const f = searchFilter.toLowerCase();
    return (u.displayName || "").toLowerCase().includes(f) || (u.email || "").toLowerCase().includes(f);
  });

  const currentUser = selectedUser ? adminUsers.find((u) => u.id === selectedUser) : null;

  React.useEffect(() => {
    if (currentUser && !powerControls[currentUser.id]) {
      setPowerControls(prev => ({
        ...prev,
        [currentUser.id]: {
          levelAmount: '1',
          xpAmount: '100',
          floorNumber: String(currentUser.currentFloor ?? '1'),
          wins: String(currentUser.battlesWon ?? '0'),
          losses: String(currentUser.battlesLost ?? '0'),
          lecturesCount: String(currentUser.lecturesCompleted ?? '0'),
        }
      }));
    }
  }, [currentUser]);

  const handlePowerControlChange = (field: keyof UserPowerControls, value: string) => {
    if (selectedUser) {
      setPowerControls(prev => ({
        ...prev,
        [selectedUser]: {
          ...(prev[selectedUser] || {
            levelAmount: '1',
            xpAmount: '100',
            floorNumber: '1',
            wins: '0',
            losses: '0',
            lecturesCount: '0',
          }),
          [field]: value,
        },
      }));
    }
  };

  const userPowerControls = currentUser ? powerControls[currentUser.id] : null;

  return (
    <div className="space-y-8 w-full">
      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-blue-100">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-200 mb-1">Students</p>
                <p className="text-3xl font-bold text-green-100">{stats?.totalStudents || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-200 mb-1">Teachers</p>
                <p className="text-3xl font-bold text-purple-100">{stats?.totalTeachers || 0}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-950 to-yellow-900 border-yellow-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-200 mb-1">Admins</p>
                <p className="text-3xl font-bold text-yellow-100">{stats?.totalAdmins || 0}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Controls */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted w-full justify-start">
          <TabsTrigger value="users" className="flex gap-2">
            <Users className="w-4 h-4" /> User Management
          </TabsTrigger>
          <TabsTrigger value="powers" className="flex gap-2">
            <Zap className="w-4 h-4" /> Power Controls
          </TabsTrigger>
          <TabsTrigger value="system" className="flex gap-2">
            <Settings className="w-4 h-4" /> System
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="mb-4">
            <Input
              placeholder="Search users by name or email..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* User List */}
            <Card className="lg:col-span-1 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u.id);
                      setActiveTab("powers");
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedUser === u.id
                        ? "bg-primary/20 border-primary"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-semibold text-sm">{u.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <div className="flex gap-1 mt-1">
                      <span className="text-xs bg-primary/30 text-primary px-2 py-0.5 rounded capitalize">
                        {u.role}
                      </span>
                      <span className="text-xs bg-accent/30 text-accent px-2 py-0.5 rounded">
                        L{u.level}
                      </span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* User Details & Controls */}
            {currentUser && (
              <Card className="lg:col-span-2 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{currentUser.displayName}</span>
                    <span className="text-sm font-normal text-muted-foreground">({currentUser.role})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats Display */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-primary/10 p-2 rounded">
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-xl font-bold">{currentUser.level}</p>
                    </div>
                    <div className="bg-accent/10 p-2 rounded">
                      <p className="text-xs text-muted-foreground">Floor</p>
                      <p className="text-xl font-bold">{currentUser.currentFloor}</p>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded">
                      <p className="text-xs text-muted-foreground">Battles Won</p>
                      <p className="text-xl font-bold text-green-400">{currentUser.battlesWon || 0}</p>
                    </div>
                    <div className="bg-red-500/10 p-2 rounded">
                      <p className="text-xs text-muted-foreground">Battles Lost</p>
                      <p className="text-xl font-bold text-red-400">{currentUser.battlesLost || 0}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex gap-2">
                      {currentUser.role === "student" && (
                        <Button
                          size="sm"
                          onClick={() => promoteToTeacherMutation.mutate(currentUser.id)}
                          className="flex-1"
                        >
                          Promote to Teacher
                        </Button>
                      )}
                      {currentUser.role !== "admin" && (
                        <Button
                          size="sm"
                          onClick={() => grantAdminMutation.mutate(currentUser.id)}
                          className="flex-1"
                          variant="outline"
                        >
                          Grant Admin
                        </Button>
                      )}
                      {currentUser.role === "admin" && currentUser.id !== user?.id && (
                        <Button
                          size="sm"
                          onClick={() => revokeAdminMutation.mutate(currentUser.id)}
                          className="flex-1"
                          variant="destructive"
                        >
                          Revoke Admin
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        onClick={() => resetProgressMutation.mutate(currentUser.id)}
                        className="flex-1"
                        variant="outline"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" /> Reset Progress
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => deleteUserMutation.mutate(currentUser.id)}
                        className="flex-1"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete User
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Powers Tab */}
        <TabsContent value="powers" className="space-y-4">
          {currentUser ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Level Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Level Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm mb-2 block">Current: {currentUser.level}</label>
                    <div className="flex gap-2 mb-3">
                      <Button
                        onClick={() => {
                          decreaseLevelMutation.mutate({ userId: currentUser.id, amount: 1 });
                        }}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        − 1
                      </Button>
                      <Button
                        onClick={() => {
                          increaseLevelMutation.mutate({ userId: currentUser.id, amount: 1 });
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        + 1
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm mb-2 block">Or set custom amount:</label>
                    <Input
                      type="number"
                      value={userPowerControls?.levelAmount || ""}
                      onChange={(e) => handlePowerControlChange("levelAmount", e.target.value)}
                      placeholder="Amount"
                      min="1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (userPowerControls?.levelAmount) {
                          increaseLevelMutation.mutate({
                            userId: currentUser.id,
                            amount: parseInt(userPowerControls.levelAmount),
                          });
                        }
                      }}
                      className="flex-1"
                      size="sm"
                    >
                      <Zap className="w-4 h-4 mr-2" /> Increase
                    </Button>
                    <Button
                      onClick={() => {
                        if (userPowerControls?.levelAmount) {
                          decreaseLevelMutation.mutate({
                            userId: currentUser.id,
                            amount: parseInt(userPowerControls.levelAmount),
                          });
                        }
                      }}
                      className="flex-1"
                      size="sm"
                      variant="outline"
                    >
                      <TrendingUp className="w-4 h-4 mr-2 rotate-180" /> Decrease
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* XP Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" /> XP Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm mb-2 block">Current: {currentUser.xp || 0} XP</label>
                    <Input
                      type="number"
                      value={userPowerControls?.xpAmount || ""}
                      onChange={(e) => handlePowerControlChange("xpAmount", e.target.value)}
                      placeholder="Amount"
                      min="0"
                    />
                  </div>
                  <Button onClick={() => {
                    if (userPowerControls?.xpAmount) {
                      addXpMutation.mutate({ userId: currentUser.id, amount: parseInt(userPowerControls.xpAmount) })
                    }
                  }} className="w-full" size="sm">
                    <Award className="w-4 h-4 mr-2" /> Add XP
                  </Button>
                </CardContent>
              </Card>

              {/* Floor Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" /> Floor Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm mb-2 block">Current: Floor {currentUser.currentFloor}</label>
                    <Input
                      type="number"
                      value={userPowerControls?.floorNumber || ""}
                      onChange={(e) => handlePowerControlChange("floorNumber", e.target.value)}
                      placeholder="Floor (1-12)"
                      min="1"
                      max="12"
                    />
                  </div>
                  <Button onClick={() => {
                    if (userPowerControls?.floorNumber) {
                      setFloorMutation.mutate({ userId: currentUser.id, floor: parseInt(userPowerControls.floorNumber) })
                    }
                  }} className="w-full" size="sm">
                    <Building2 className="w-4 h-4 mr-2" /> Set Floor
                  </Button>
                </CardContent>
              </Card>

              {/* Battle Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5" /> Battle Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm mb-1 block">Wins</label>
                    <Input
                      type="number"
                      value={userPowerControls?.wins || ""}
                      onChange={(e) => handlePowerControlChange("wins", e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">Losses</label>
                    <Input
                      type="number"
                      value={userPowerControls?.losses || ""}
                      onChange={(e) => handlePowerControlChange("losses", e.target.value)}
                      min="0"
                    />
                  </div>
                  <Button onClick={() => {
                    if (userPowerControls?.wins && userPowerControls?.losses) {
                      setBattleStatsMutation.mutate({ userId: currentUser.id, wins: parseInt(userPowerControls.wins), losses: parseInt(userPowerControls.losses) })
                    }
                  }} className="w-full" size="sm">
                    <Flame className="w-4 h-4 mr-2" /> Update Stats
                  </Button>
                </CardContent>
              </Card>

              {/* Lectures */}
              <Card>
                <CardHeader>
                  <CardTitle>Lectures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm mb-2 block">Current: {currentUser.lecturesCompleted || 0}</label>
                    <Input
                      type="number"
                      value={userPowerControls?.lecturesCount || ""}
                      onChange={(e) => handlePowerControlChange("lecturesCount", e.target.value)}
                      placeholder="Count"
                      min="0"
                    />
                  </div>
                  <Button onClick={() => {
                    if (userPowerControls?.lecturesCount) {
                      setLecturesMutation.mutate({ userId: currentUser.id, lecturesCompleted: parseInt(userPowerControls.lecturesCount) })
                    }
                  }} className="w-full" size="sm">
                    Set Lectures
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Select a user to manage power controls
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                These actions will affect ALL users in the system. Use with caution.
              </p>

              <Button
                onClick={() => {
                  if (window.confirm("Reset all user progress? This cannot be undone!")) {
                    resetAllMutation.mutate();
                  }
                }}
                className="w-full"
                variant="destructive"
              >
                <AlertTriangle className="w-4 h-4 mr-2" /> Reset All User Progress
              </Button>

              <Card className="bg-muted/30 p-4">
                <p className="text-sm">
                  <strong>What this does:</strong> Resets all non-admin users to Level 1, Floor 1 with 0 XP and clears battle
                  stats.
                </p>
              </Card>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Total Users:</span> <span className="font-semibold">{stats?.totalUsers}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Total Students:</span> <span className="font-semibold">{stats?.totalStudents}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Total Teachers:</span> <span className="font-semibold">{stats?.totalTeachers}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Total Admins:</span> <span className="font-semibold">{stats?.totalAdmins}</span>
              </p>
              <p>
                <span className="text-muted-foreground">System Health:</span> <span className="font-semibold text-green-400">{stats?.systemHealth}</span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
