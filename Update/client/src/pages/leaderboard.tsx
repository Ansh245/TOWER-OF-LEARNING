import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft,
  Crown,
  Star,
  Flame,
  Trophy,
  Sword,
  Zap
} from "lucide-react";
import type { User } from "@shared/schema";

interface LeaderboardData {
  rankings: User[];
  userRank: number | null;
}

export default function LeaderboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<LeaderboardData>({
    queryKey: ["/api/leaderboard"],
  });

  // Mock data for demonstration
  const mockRankings: User[] = data?.rankings || [
    { id: "1", displayName: "DragonSlayer", email: "dragon@test.com", role: "student", currentFloor: 87, level: 42, xp: 125000, streak: 45, battlesWon: 82, battlesLost: 15, lecturesCompleted: 350 } as User,
    { id: "2", displayName: "StarGazer", email: "star@test.com", role: "student", currentFloor: 82, level: 39, xp: 98500, streak: 32, battlesWon: 75, battlesLost: 18, lecturesCompleted: 310 } as User,
    { id: "3", displayName: "NightBlade", email: "night@test.com", role: "student", currentFloor: 79, level: 37, xp: 89200, streak: 28, battlesWon: 68, battlesLost: 22, lecturesCompleted: 290 } as User,
    { id: "4", displayName: "StormRider", email: "storm@test.com", role: "student", currentFloor: 72, level: 35, xp: 78000, streak: 15, battlesWon: 62, battlesLost: 25, lecturesCompleted: 265 } as User,
    { id: "5", displayName: "ShadowMage", email: "shadow@test.com", role: "student", currentFloor: 68, level: 33, xp: 72500, streak: 21, battlesWon: 58, battlesLost: 28, lecturesCompleted: 248 } as User,
    { id: "6", displayName: "PhoenixRise", email: "phoenix@test.com", role: "student", currentFloor: 65, level: 31, xp: 65000, streak: 18, battlesWon: 52, battlesLost: 30, lecturesCompleted: 232 } as User,
    { id: "7", displayName: "IronWill", email: "iron@test.com", role: "student", currentFloor: 61, level: 29, xp: 58500, streak: 12, battlesWon: 48, battlesLost: 32, lecturesCompleted: 218 } as User,
    { id: "8", displayName: "MoonWalker", email: "moon@test.com", role: "student", currentFloor: 55, level: 27, xp: 52000, streak: 9, battlesWon: 44, battlesLost: 35, lecturesCompleted: 195 } as User,
    { id: "9", displayName: "ThunderStrike", email: "thunder@test.com", role: "student", currentFloor: 52, level: 25, xp: 48000, streak: 7, battlesWon: 40, battlesLost: 38, lecturesCompleted: 180 } as User,
    { id: "10", displayName: "CrystalSword", email: "crystal@test.com", role: "student", currentFloor: 48, level: 23, xp: 42500, streak: 5, battlesWon: 36, battlesLost: 40, lecturesCompleted: 165 } as User,
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Star className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Flame className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30";
      default:
        return "bg-muted/30 border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={user ? (user.role === "teacher" ? "/teacher" : "/dashboard") : "/"}>
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-cinzel text-2xl font-bold text-tower-gold">
                  Tower Rankings
                </h1>
                <p className="text-sm text-muted-foreground">The strongest climbers</p>
              </div>
            </div>
            <Trophy className="h-8 w-8 text-tower-gold" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="pt-8">
            <Card className={`${getRankStyle(2)} border transition-all hover:scale-105`}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-400/20 rounded-full flex items-center justify-center border-2 border-gray-400/50">
                  <span className="font-bebas text-2xl text-gray-300">
                    {mockRankings[1]?.level || 0}
                  </span>
                </div>
                <div className="flex justify-center mb-2">
                  <Star className="h-6 w-6 text-gray-400" />
                </div>
                <div className="font-semibold truncate">{mockRankings[1]?.displayName}</div>
                <div className="font-bebas text-xl text-tower-gold tracking-wider mt-2">
                  FLOOR {mockRankings[1]?.currentFloor}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {mockRankings[1]?.xp?.toLocaleString()} XP
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 1st Place */}
          <div>
            <Card className={`${getRankStyle(1)} border transition-all hover:scale-105 tower-glow`}>
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-3 bg-yellow-500/20 rounded-full flex items-center justify-center border-2 border-yellow-500/50">
                  <span className="font-bebas text-3xl text-yellow-500">
                    {mockRankings[0]?.level || 0}
                  </span>
                </div>
                <div className="flex justify-center mb-2">
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="font-semibold text-lg">{mockRankings[0]?.displayName}</div>
                <div className="font-bebas text-2xl text-tower-gold tracking-wider mt-2">
                  FLOOR {mockRankings[0]?.currentFloor}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {mockRankings[0]?.xp?.toLocaleString()} XP
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3rd Place */}
          <div className="pt-12">
            <Card className={`${getRankStyle(3)} border transition-all hover:scale-105`}>
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-amber-600/20 rounded-full flex items-center justify-center border-2 border-amber-600/50">
                  <span className="font-bebas text-xl text-amber-500">
                    {mockRankings[2]?.level || 0}
                  </span>
                </div>
                <div className="flex justify-center mb-2">
                  <Flame className="h-5 w-5 text-amber-600" />
                </div>
                <div className="font-semibold truncate">{mockRankings[2]?.displayName}</div>
                <div className="font-bebas text-lg text-tower-gold tracking-wider mt-2">
                  FLOOR {mockRankings[2]?.currentFloor}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {mockRankings[2]?.xp?.toLocaleString()} XP
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rankings List */}
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="font-cinzel text-lg">All Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {mockRankings.map((player, index) => {
                const rank = index + 1;
                const isCurrentUser = user?.id === player.id;
                
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-4 p-4 ${
                      isCurrentUser ? "bg-primary/5" : "hover:bg-muted/20"
                    } transition-colors`}
                    data-testid={`leaderboard-row-${rank}`}
                  >
                    {/* Rank */}
                    <div className="w-12 text-center">
                      {rank <= 3 ? (
                        <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                          rank === 1 ? "bg-yellow-500/20" :
                          rank === 2 ? "bg-gray-400/20" :
                          "bg-amber-600/20"
                        }`}>
                          {getRankIcon(rank)}
                        </div>
                      ) : (
                        <span className="font-bebas text-2xl text-muted-foreground tracking-wider">
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{player.displayName}</span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs border-primary text-primary">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Level {player.level} • {player.xp?.toLocaleString()} XP
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-green-500">
                          <Sword className="h-4 w-4" />
                          <span className="font-bebas text-lg tracking-wider">{player.battlesWon}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="h-4 w-4" />
                          <span className="font-bebas text-lg tracking-wider">{player.streak}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Streak</div>
                      </div>
                    </div>

                    {/* Floor */}
                    <div className="text-right">
                      <div className="font-bebas text-2xl text-tower-gold tracking-wider">
                        {player.currentFloor}
                      </div>
                      <div className="text-xs text-muted-foreground">Floor</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current User Position (if not in top 10) */}
        {user && !mockRankings.find(p => p.id === user.id) && (
          <Card className="bg-primary/5 border-primary/20 mt-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 text-center">
                  <span className="font-bebas text-xl text-muted-foreground tracking-wider">
                    {data?.userRank || "?"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{user.displayName}</span>
                    <Badge variant="outline" className="text-xs border-primary text-primary">
                      You
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Level {user.level} • {user.xp?.toLocaleString()} XP
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bebas text-2xl text-tower-gold tracking-wider">
                    {user.currentFloor}
                  </div>
                  <div className="text-xs text-muted-foreground">Floor</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
