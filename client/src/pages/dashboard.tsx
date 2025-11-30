import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sword, 
  BookOpen, 
  Trophy, 
  Flame,
  Star,
  ChevronRight,
  LogOut,
  Zap,
  Target,
  Crown
} from "lucide-react";
import { FLOOR_NAMES } from "@shared/schema";
import type { User, Lecture, UserProgress } from "@shared/schema";

interface ProgressData {
  user: User;
  currentFloorProgress: UserProgress[];
  totalFloorLectures: number;
  completedCount: number;
}

export default function DashboardPage() {
  const { user, logout, updateUser } = useAuth();
  const [, navigate] = useLocation();

  // Fetch fresh user data from server
  const { data: freshUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/user/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      const userData = await res.json();
      // Update auth context with fresh data
      updateUser(userData);
      return userData;
    },
    enabled: !!user?.id,
    refetchInterval: 2000, // Refetch every 2 seconds to stay in sync
  });

  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressData>({
    queryKey: ["/api/progress", user?.id],
    enabled: !!user,
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const isLoading = userLoading || progressLoading;
  const displayUser = freshUser || user;

  const floorName = FLOOR_NAMES[displayUser.currentFloor] || `Floor ${displayUser.currentFloor}`;
  
  // Calculate XP progress correctly
  // Total XP needed to reach current level
  let xpForCurrentLevel = 0;
  let xpForNextLevel = 0;
  let levelXpReq = 100;
  for (let i = 1; i < displayUser.level; i++) {
    xpForCurrentLevel += levelXpReq;
    levelXpReq = Math.floor(100 * Math.pow(1.5, i));
  }
  xpForNextLevel = xpForCurrentLevel + levelXpReq;
  const xpInCurrentLevel = displayUser.xp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
  
  const floorLecturesCompleted = progressData?.completedCount || 0;
  const totalFloorLectures = progressData?.totalFloorLectures || 3;
  const lecturesCompletedOnFloor = displayUser.lecturesCompleted % 10;
  const totalLecturesCompleted = displayUser.lecturesCompleted;
  const canBattle = lecturesCompletedOnFloor >= 10 || (lecturesCompletedOnFloor === 0 && totalLecturesCompleted > 0) || floorLecturesCompleted >= totalFloorLectures;

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
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-bebas text-xl text-tower-gold">{displayUser.level}</span>
              </div>
              <div>
                <h1 className="font-cinzel text-xl font-semibold text-tower-gold">
                  {displayUser.displayName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Floor {displayUser.currentFloor} - {floorName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-orange-500">
                <Flame className="h-5 w-5" />
                <span className="font-bebas text-xl tracking-wider">{displayUser.streak}</span>
              </div>
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
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Tower Progress */}
          <div className="lg:col-span-3">
            <Card className="bg-card/50 border-border sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="font-cinzel text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-tower-gold" />
                  Tower Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Floor visualization */}
                <div className="relative">
                  <div className="space-y-2">
                    {[...Array(10)].map((_, i) => {
                      const floorNum = Math.floor(displayUser.currentFloor / 10) * 10 + (10 - i);
                      const isCurrent = floorNum === displayUser.currentFloor;
                      const isPassed = floorNum < displayUser.currentFloor;
                      const isLocked = floorNum > displayUser.currentFloor;
                      
                      return (
                        <div
                          key={i}
                          className={`relative p-3 rounded-lg transition-all ${
                            isCurrent 
                              ? "bg-primary/20 border border-primary/40 tower-glow" 
                              : isPassed 
                                ? "bg-muted/30 border border-muted" 
                                : "bg-muted/10 border border-muted/30 opacity-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-bebas text-lg tracking-wider ${
                              isCurrent ? "text-tower-gold" : isPassed ? "text-muted-foreground" : "text-muted-foreground/50"
                            }`}>
                              FLOOR {floorNum}
                            </span>
                            {isCurrent && (
                              <Badge variant="outline" className="border-primary text-primary text-xs">
                                YOU
                              </Badge>
                            )}
                            {isPassed && <Star className="h-4 w-4 text-primary" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Next battle indicator */}
                {canBattle && (
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sword className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium text-accent">Battle Ready!</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Complete your floor to challenge a rival
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Main Content */}
          <div className="lg:col-span-6 space-y-6">
            {/* Current Floor Hero */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border overflow-hidden">
              <div className="relative p-8">
                <div className="absolute inset-0 floor-indicator opacity-50" />
                <div className="relative z-10">
                  <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    Floor {displayUser.currentFloor}
                  </Badge>
                  <h2 className="font-cinzel text-4xl font-bold text-tower-gold mb-2">
                    {floorName}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {lecturesCompletedOnFloor >= 10 
                      ? "🎯 Ready to face the guardian!" 
                      : `Complete ${10 - lecturesCompletedOnFloor} more lectures to challenge this floor's guardian`
                    }
                  </p>

                  {/* Lecture Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Floor Progress</span>
                      <span className="font-bebas text-lg text-tower-gold tracking-wider">
                        {lecturesCompletedOnFloor}/10
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full xp-bar-fill rounded-full"
                        style={{ width: `${(lecturesCompletedOnFloor / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/lecture" className="flex-1">
                      <Button className="w-full py-6 text-lg tower-glow" data-testid="button-continue-lecture">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Continue Lecture {lecturesCompletedOnFloor + 1}
                        <ChevronRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    
                    {canBattle ? (
                      <Link href="/battle" className="flex-1">
                        <Button 
                          variant="outline" 
                          className="w-full py-6 text-lg border-accent text-accent hover:bg-accent/10"
                          data-testid="button-enter-battle"
                        >
                          <Sword className="h-5 w-5 mr-2" />
                          Enter Battle
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="flex-1 py-6 text-lg opacity-50"
                        disabled
                        data-testid="button-battle-locked"
                      >
                        <Sword className="h-5 w-5 mr-2" />
                        Battle Locked
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* XP Progress */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30">
                      <span className="font-bebas text-2xl text-tower-gold">{displayUser.level}</span>
                    </div>
                    <div>
                      <h3 className="font-cinzel text-xl font-semibold">Level {displayUser.level}</h3>
                      <p className="text-sm text-muted-foreground">
                        {displayUser.xp.toLocaleString()} XP Total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bebas text-2xl text-tower-gold tracking-wider">
                      {Math.round(xpProgress)}%
                    </div>
                    <p className="text-xs text-muted-foreground">To Level {displayUser.level + 1}</p>
                  </div>
                </div>

                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full xp-bar-fill rounded-full"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Stats */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Stats */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-4">
                <CardTitle className="font-cinzel text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-tower-gold" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total XP</span>
                  <span className="font-bebas text-xl text-tower-gold tracking-wider">
                    {displayUser.xp.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Battles Won</span>
                  <span className="font-bebas text-xl text-green-500 tracking-wider">
                    {displayUser.battlesWon}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Battles Lost</span>
                  <span className="font-bebas text-xl text-red-500 tracking-wider">
                    {displayUser.battlesLost}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <span className="font-bebas text-xl tracking-wider">
                    {displayUser.battlesWon + displayUser.battlesLost > 0 
                      ? `${Math.round((displayUser.battlesWon / (displayUser.battlesWon + displayUser.battlesLost)) * 100)}%`
                      : "N/A"
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-4">
                <CardTitle className="font-cinzel text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-tower-gold" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: "🏆", label: "First Win", earned: displayUser.battlesWon >= 1 },
                    { icon: "📚", label: "Scholar", earned: displayUser.lecturesCompleted >= 10 },
                    { icon: "🔥", label: "On Fire", earned: displayUser.streak >= 3 },
                    { icon: "⚔️", label: "Warrior", earned: displayUser.battlesWon >= 5 },
                    { icon: "🏔️", label: "Climber", earned: displayUser.currentFloor >= 2 },
                    { icon: "⭐", label: "Elite", earned: displayUser.level >= 5 },
                  ].map((achievement) => (
                    <div
                      key={achievement.label}
                      className={`p-3 rounded-lg text-center ${
                        achievement.earned 
                          ? "bg-primary/10 border border-primary/20" 
                          : "bg-muted/20 opacity-40"
                      }`}
                    >
                      <div className="text-2xl mb-1">{achievement.icon}</div>
                      <div className="text-xs text-muted-foreground">{achievement.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next Milestone */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-cinzel text-lg font-semibold mb-4">Next Milestone</h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <Crown className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold">Floor {displayUser.currentFloor + 1}</div>
                      <div className="text-xs text-muted-foreground">
                        Complete battle to advance
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
