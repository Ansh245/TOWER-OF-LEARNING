import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sword, 
  Trophy, 
  BookOpen, 
  Users, 
  Flame,
  ChevronRight,
  Star,
  Crown
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
        
        {/* Tower visualization */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="w-48 h-[80vh] bg-gradient-to-t from-primary/30 via-accent/20 to-transparent rounded-t-full" />
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium">
              A New Way to Learn
            </span>
          </div>
          
          <h1 className="font-cinzel text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-tower-gold tracking-wide">
            TOWER OF LEARNING
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            Climb. Battle. Conquer.
          </p>
          
          <p className="text-lg text-muted-foreground/80 mb-12 max-w-xl mx-auto">
            Ascend through floors of knowledge, challenge fellow students in epic study battles, 
            and prove yourself worthy of reaching the top.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6 tower-glow" data-testid="button-begin-ascent">
                Begin Your Ascent
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6" data-testid="button-view-rankings">
                View Rankings
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: "10,000+", label: "Climbers" },
              { value: "100", label: "Floors" },
              { value: "50,000+", label: "Battles" },
              { value: "1M+", label: "XP Earned" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4">
                <div className="font-bebas text-3xl md:text-4xl text-tower-gold tracking-wider">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-cinzel text-4xl md:text-5xl font-bold text-tower-gold mb-4">
              How The Tower Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every 10 lectures unlocks a floor battle. Defeat your opponent to advance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card/50 border-border hover-elevate">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-cinzel text-2xl font-semibold mb-4">Learn & Progress</h3>
                <p className="text-muted-foreground">
                  Complete lectures and quizzes to climb the tower. Each floor brings new challenges and knowledge.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border hover-elevate">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sword className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-cinzel text-2xl font-semibold mb-4">Battle Rivals</h3>
                <p className="text-muted-foreground">
                  After every 10 lectures, face a fellow student in a real-time quiz battle. Winner advances!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border hover-elevate">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-cinzel text-2xl font-semibold mb-4">Climb Rankings</h3>
                <p className="text-muted-foreground">
                  Rise through the leaderboard, earn XP, level up, and become a legend of the tower.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-cinzel text-4xl md:text-5xl font-bold text-tower-gold mb-4">
              Your Journey Awaits
            </h2>
          </div>

          <div className="space-y-8">
            {[
              { step: 1, title: "Create Your Profile", desc: "Choose to be a Student or Teacher", icon: Users },
              { step: 2, title: "Begin Climbing", desc: "Complete lectures and master quizzes", icon: BookOpen },
              { step: 3, title: "Face Your Rival", desc: "Battle after every 10 lectures", icon: Sword },
              { step: 4, title: "Rise to Glory", desc: "Climb floors and dominate rankings", icon: Crown },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bebas text-xl text-tower-gold tracking-wider">
                      STEP {item.step}
                    </span>
                  </div>
                  <h3 className="font-cinzel text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block w-px h-16 bg-border ml-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-cinzel text-4xl md:text-5xl font-bold text-tower-gold mb-4">
              Tower Rankings
            </h2>
            <p className="text-lg text-muted-foreground">
              The strongest climbers in the tower
            </p>
          </div>

          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              {[
                { rank: 1, name: "DragonSlayer", floor: 87, level: 42, icon: Crown },
                { rank: 2, name: "StarGazer", floor: 82, level: 39, icon: Star },
                { rank: 3, name: "NightBlade", floor: 79, level: 37, icon: Flame },
              ].map((player) => (
                <div
                  key={player.rank}
                  className="flex items-center gap-4 p-4 rounded-lg mb-2 last:mb-0 bg-muted/30"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    player.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                    player.rank === 2 ? "bg-gray-400/20 text-gray-400" :
                    "bg-amber-600/20 text-amber-600"
                  }`}>
                    <player.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-sm text-muted-foreground">Level {player.level}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bebas text-2xl text-tower-gold tracking-wider">
                      FLOOR {player.floor}
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-6 text-center">
                <Link href="/leaderboard">
                  <Button variant="outline" data-testid="button-view-full-rankings">
                    View Full Rankings
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-t from-card/50 to-background">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold text-tower-gold mb-6">
            Ready to Climb?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            The tower awaits those brave enough to ascend. Will you answer the call?
          </p>
          <Link href="/login">
            <Button size="lg" className="text-lg px-10 py-6 tower-glow" data-testid="button-start-journey">
              Start Your Journey
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="font-cinzel text-xl text-tower-gold">
              TOWER OF LEARNING
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/leaderboard" className="hover:text-foreground transition-colors">
                Leaderboard
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Login
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              Climb. Battle. Conquer.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
