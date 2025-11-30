import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Sword,
  Clock,
  Trophy,
  Loader2,
  Zap,
  Crown,
  X
} from "lucide-react";
import type { User, QuizQuestion } from "@shared/schema";

type BattleState = "searching" | "found" | "countdown" | "battle" | "result";

interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

interface Opponent {
  id: string;
  displayName: string;
  level: number;
  currentFloor: number;
}

export default function BattlePage() {
  const { user, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  const [battleState, setBattleState] = useState<BattleState>("searching");
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [winner, setWinner] = useState<"me" | "opponent" | "draw" | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [forcedSimulation, setForcedSimulation] = useState(false);

  // Simulated matchmaking and battle (to be replaced with WebSocket)
  useEffect(() => {
    if (!user) return;

    // Set a timeout to force simulation if no opponent found after 8 seconds
    const simulationTimeout = setTimeout(() => {
      console.log("No opponent found after 8 seconds, switching to simulation battle...");
      setForcedSimulation(true);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      simulateBattle();
    }, 8000);

    // Connect to WebSocket for real-time battle
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected, starting matchmaking...");
        // Join and start matchmaking
        ws.send(JSON.stringify({
          type: "join",
          odId: user.id,
        }));
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: "find_match",
            floor: user.currentFloor,
          }));
        }, 500);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case "match_found":
            setOpponent({
              id: data.player2.id,
              displayName: data.player2.displayName,
              level: data.player2.level,
              currentFloor: user.currentFloor,
            });
            setBattleState("found");
            setTimeout(() => {
              setBattleState("countdown");
            }, 2000);
            break;
            
          case "question":
            if (data.questionIndex === 0) {
              setBattleState("battle");
            }
            setQuestions(prev => {
              if (prev.length === 0) return [{
                id: data.questionIndex.toString(),
                question: data.question,
                options: data.options,
                correctAnswer: -1,
                timeLimit: data.timeLimit,
              }];
              return prev;
            });
            setCurrentQuestion(data.questionIndex);
            setTimeLeft(data.timeLimit);
            break;
            
          case "answer_result":
            if (data.correct) {
              setMyScore(prev => prev + data.pointsEarned);
            }
            setOpponentScore(data.opponentScore);
            break;
            
          case "battle_complete":
            setWinner(data.winnerId === user.id ? "me" : data.winnerId === null ? "draw" : "opponent");
            setXpEarned(data.xpEarned);
            setBattleState("result");
            if (data.winnerId === user.id) {
              updateUser({
                battlesWon: (user?.battlesWon || 0) + 1,
                xp: (user?.xp || 0) + 200,
              });
            } else if (data.winnerId !== null) {
              updateUser({
                battlesLost: (user?.battlesLost || 0) + 1,
                xp: (user?.xp || 0) + 50,
              });
            }
            break;
            
          case "waiting":
            toast({ title: data.message });
            break;
        }
      };

      ws.onerror = () => {
        console.log("WebSocket error, switching to simulation battle...");
        // Fallback to simulation if WebSocket fails
        setForcedSimulation(true);
        simulateBattle();
      };

      ws.onclose = () => {
        wsRef.current = null;
      };

    } catch (error) {
      console.error("WebSocket connection error:", error);
      // Fallback to simulation
      setForcedSimulation(true);
      simulateBattle();
    }

    return () => {
      clearTimeout(simulationTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.id]);

  // Simulated battle for demo/fallback
  const simulateBattle = async () => {
    // Simulate finding opponent
    const searchInterval = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    setTimeout(async () => {
      clearInterval(searchInterval);
      
      // Get real questions from current floor
      try {
        const res = await fetch(`/api/lectures/floor/${user?.currentFloor || 1}`);
        const lectures = await res.json();
        
        let allQuestions: any[] = [];
        for (const lecture of lectures) {
          const questionsRes = await fetch(`/api/quiz/questions/${lecture.id}`);
          const questions = await questionsRes.json();
          allQuestions = [...allQuestions, ...questions];
        }
        
        // Shuffle and pick 5 questions
        const battleQuestions = allQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, 5)
          .map((q, idx) => ({
            id: (idx + 1).toString(),
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            timeLimit: q.timeLimit || 15,
          }));
        
        setOpponent({
          id: "sim-opponent",
          displayName: `Guardian of Floor ${user?.currentFloor || 1}`,
          level: (user?.level || 1) + Math.floor(Math.random() * 3),
          currentFloor: user?.currentFloor || 1,
        });
        setBattleState("found");

        setTimeout(() => {
          setBattleState("countdown");
          setQuestions(battleQuestions.length > 0 ? battleQuestions : getDefaultQuestions());
        }, 2000);
      } catch (error) {
        console.error("Failed to fetch battle questions:", error);
        // Use default questions as fallback
        setOpponent({
          id: "sim-opponent",
          displayName: `Guardian of Floor ${user?.currentFloor || 1}`,
          level: (user?.level || 1) + Math.floor(Math.random() * 3),
          currentFloor: user?.currentFloor || 1,
        });
        setBattleState("found");
        setTimeout(() => {
          setBattleState("countdown");
          setQuestions(getDefaultQuestions());
        }, 2000);
      }
    }, 3000 + Math.random() * 2000);
  };

  const getDefaultQuestions = () => [
    {
      id: "1",
      question: "What is the primary purpose of a variable in programming?",
      options: ["To store data", "To display output", "To create loops", "To define functions"],
      correctAnswer: 0,
      timeLimit: 15,
    },
    {
      id: "2",
      question: "Which data structure uses LIFO (Last In, First Out)?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correctAnswer: 1,
      timeLimit: 15,
    },
    {
      id: "3",
      question: "What does HTML stand for?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Management Language"],
      correctAnswer: 0,
      timeLimit: 15,
    },
    {
      id: "4",
      question: "Which of these is NOT a programming paradigm?",
      options: ["Object-Oriented", "Functional", "Procedural", "Alphabetical"],
      correctAnswer: 3,
      timeLimit: 15,
    },
    {
      id: "5",
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correctAnswer: 1,
      timeLimit: 15,
    },
  ];

  // Countdown timer
  useEffect(() => {
    if (battleState !== "countdown") return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Questions should already be set from simulateBattle
          setBattleState("battle");
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [battleState]);

  // Battle timer
  useEffect(() => {
    if (battleState !== "battle" || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up for this question
          handleAnswer(-1);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [battleState, currentQuestion, questions]);

  // Simulate opponent answers
  useEffect(() => {
    if (battleState !== "battle" || questions.length === 0) return;

    const opponentDelay = 3000 + Math.random() * 8000;
    const timer = setTimeout(() => {
      const correct = Math.random() > 0.4; // 60% chance opponent is correct
      if (correct) {
        setOpponentScore(prev => prev + 1);
      }
    }, opponentDelay);

    return () => clearTimeout(timer);
  }, [battleState, currentQuestion]);

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === question?.correctAnswer;
    
    if (isCorrect) {
      setMyScore(prev => prev + 10);
    }

    // Send answer to server
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "answer",
        battleId: questions[currentQuestion]?.id,
        questionIndex: currentQuestion,
        answer: answerIndex,
        timeRemaining: timeLeft,
      }));
    } else {
      // Simulate opponent answer for fake battle
      setTimeout(() => {
        const opponentCorrect = Math.random() > 0.4; // 60% opponent accuracy
        if (opponentCorrect) {
          setOpponentScore(prev => prev + 10);
        }
      }, 800);
    }

    // Move to next question or end battle
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        // Battle ends
        setTimeout(() => {
          const playerWins = myScore > opponentScore;
          const winnerId = playerWins ? user?.id : "opponent";
          
          setWinner(playerWins ? "me" : "opponent");
          setXpEarned(playerWins ? 200 : 50);
          setBattleState("result");
          
          if (playerWins) {
            updateUser({
              battlesWon: (user?.battlesWon || 0) + 1,
              xp: (user?.xp || 0) + 200,
            });
          } else {
            updateUser({
              battlesLost: (user?.battlesLost || 0) + 1,
              xp: (user?.xp || 0) + 50,
            });
          }
        }, 1000);
        setSelectedAnswer(null);
      }
    }, 1500);
  };

  const handleReturnToDashboard = () => {
    navigate("/dashboard");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="font-cinzel text-xl font-semibold text-tower-gold">
              Floor {user.currentFloor} Battle
            </div>
            <div className="w-9" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Searching State */}
        {battleState === "searching" && (
          <div className="text-center py-20">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping" />
              <div className="absolute inset-4 border-4 border-accent/30 rounded-full animate-ping" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sword className="h-12 w-12 text-primary animate-pulse" />
              </div>
            </div>
            <h2 className="font-cinzel text-3xl font-bold text-tower-gold mb-4">
              Searching for Opponent...
            </h2>
            <p className="text-muted-foreground mb-2">
              Finding a worthy challenger on Floor {user.currentFloor}
            </p>
            <div className="font-bebas text-2xl text-muted-foreground tracking-wider">
              {searchTime}s
            </div>
          </div>
        )}

        {/* Opponent Found State */}
        {battleState === "found" && opponent && (
          <div className="text-center py-20">
            <h2 className="font-cinzel text-3xl font-bold text-tower-gold mb-8">
              Opponent Found!
            </h2>
            
            <div className="flex items-center justify-center gap-8 mb-8">
              {/* Player */}
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-primary">
                  <span className="font-bebas text-2xl text-tower-gold">{user.level}</span>
                </div>
                <div className="font-semibold">{user.displayName}</div>
                <div className="text-sm text-muted-foreground">Level {user.level}</div>
              </div>

              {/* VS */}
              <div className="font-bebas text-4xl text-accent">VS</div>

              {/* Opponent */}
              <div className="text-center">
                <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-accent">
                  <span className="font-bebas text-2xl text-tower-purple">{opponent.level}</span>
                </div>
                <div className="font-semibold">{opponent.displayName}</div>
                <div className="text-sm text-muted-foreground">Level {opponent.level}</div>
              </div>
            </div>

            <p className="text-muted-foreground">
              Battle starting soon...
            </p>
          </div>
        )}

        {/* Countdown State */}
        {battleState === "countdown" && (
          <div className="text-center py-20">
            <h2 className="font-cinzel text-2xl font-bold text-muted-foreground mb-8">
              Battle Begins In
            </h2>
            <div className="font-bebas text-9xl text-tower-gold tracking-wider battle-pulse">
              {countdown}
            </div>
          </div>
        )}

        {/* Battle State */}
        {battleState === "battle" && question && (
          <div className="space-y-6">
            {/* Score Bar */}
            <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border">
              <div className="flex-1 text-center">
                <div className="text-sm text-muted-foreground mb-1">{user.displayName}</div>
                <div className="font-bebas text-3xl text-primary tracking-wider">{myScore}</div>
              </div>
              
              <div className="px-4">
                <div className="font-bebas text-xl text-muted-foreground">VS</div>
              </div>
              
              <div className="flex-1 text-center">
                <div className="text-sm text-muted-foreground mb-1">{opponent?.displayName}</div>
                <div className="font-bebas text-3xl text-accent tracking-wider">{opponentScore}</div>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-between gap-4">
              <Badge variant="outline">
                Question {currentQuestion + 1}/{questions.length}
              </Badge>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                timeLeft <= 5 ? "bg-destructive/20 text-destructive animate-pulse" : "bg-muted"
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-bebas text-xl tracking-wider">{timeLeft}s</span>
              </div>
            </div>

            <Progress value={(timeLeft / 15) * 100} className="h-2" />

            {/* Question */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-8">
                <h2 className="font-cinzel text-xl font-semibold mb-8 text-center">
                  {question.question}
                </h2>

                <div className="grid gap-3">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedAnswer === index
                          ? index === question.correctAnswer
                            ? "bg-green-500/20 border-green-500"
                            : "bg-destructive/20 border-destructive"
                          : selectedAnswer !== null && index === question.correctAnswer
                            ? "bg-green-500/20 border-green-500"
                            : "bg-muted/30 border-border hover-elevate"
                      }`}
                      data-testid={`button-battle-answer-${index}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedAnswer === index
                            ? index === question.correctAnswer
                              ? "bg-green-500 text-white"
                              : "bg-destructive text-white"
                            : "bg-muted"
                        }`}>
                          <span className="font-bebas text-lg">
                            {String.fromCharCode(65 + index)}
                          </span>
                        </div>
                        <span>{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Result State */}
        {battleState === "result" && (
          <div className="text-center py-12">
            <Card className="bg-card/50 border-border max-w-lg mx-auto">
              <CardContent className="p-8 md:p-12">
                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  winner === "me" 
                    ? "bg-primary/20 tower-glow" 
                    : winner === "draw"
                      ? "bg-yellow-500/20"
                      : "bg-destructive/20"
                }`}>
                  {winner === "me" ? (
                    <Trophy className="h-12 w-12 text-primary" />
                  ) : winner === "draw" ? (
                    <Zap className="h-12 w-12 text-yellow-500" />
                  ) : (
                    <X className="h-12 w-12 text-destructive" />
                  )}
                </div>

                <h2 className="font-cinzel text-4xl font-bold mb-2">
                  {winner === "me" 
                    ? "Victory!" 
                    : winner === "draw"
                      ? "Draw!"
                      : "Defeat"
                  }
                </h2>

                <p className="text-muted-foreground mb-6">
                  {winner === "me" 
                    ? "You've proven yourself worthy!" 
                    : winner === "draw"
                      ? "A fierce battle with no clear winner!"
                      : "Train harder for the next battle"
                  }
                </p>

                {/* Final Scores */}
                <div className="flex items-center justify-center gap-8 mb-8">
                  <div className="text-center">
                    <div className="font-bebas text-4xl text-primary tracking-wider">{myScore}</div>
                    <div className="text-sm text-muted-foreground">Your Score</div>
                  </div>
                  <div className="text-muted-foreground">-</div>
                  <div className="text-center">
                    <div className="font-bebas text-4xl text-accent tracking-wider">{opponentScore}</div>
                    <div className="text-sm text-muted-foreground">Opponent</div>
                  </div>
                </div>

                {/* Rewards */}
                <div className="p-4 bg-muted/30 rounded-lg mb-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-tower-gold" />
                    <span className="font-bebas text-2xl text-tower-gold tracking-wider">
                      +{xpEarned} XP
                    </span>
                  </div>
                  {winner === "me" && (
                    <div className="flex items-center justify-center gap-2 text-green-500">
                      <Crown className="h-5 w-5" />
                      <span className="text-sm font-medium">Advanced to Floor {(user.currentFloor || 1) + 1}!</span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleReturnToDashboard}
                  className="w-full py-6 text-lg tower-glow"
                  data-testid="button-return-to-tower"
                >
                  Return to Tower
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
