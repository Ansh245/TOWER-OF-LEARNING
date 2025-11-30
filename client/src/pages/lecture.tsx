import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { FLOOR_NAMES } from "@shared/schema";
import type { Lecture, QuizQuestion } from "@shared/schema";

export default function LecturePage() {
  const { user, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<"lecture" | "quiz" | "result">("lecture");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const { data: lecture, isLoading: lectureLoading, error: lectureError } = useQuery<Lecture>({
    queryKey: ["/api/lectures/next", user?.id],
    enabled: !!user,
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/quiz", lecture?.id],
    enabled: !!lecture?.id,
  });

  const { data: floorLectures = [] } = useQuery<Lecture[]>({
    queryKey: ["/api/lectures/floor", user?.currentFloor],
    enabled: !!user?.currentFloor,
  });

  const data = lecture ? {
    lecture,
    questions,
    lectureNumber: lecture.orderInFloor || 1,
    totalLectures: floorLectures.length || 3,
  } : null;

  const isLoading = lectureLoading || questionsLoading;
  const error = lectureError;

  // Timer for quiz
  useEffect(() => {
    if (mode !== "quiz" || !data?.questions.length) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(-1); // Auto-submit wrong answer
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, currentQuestion]);

  const completeMutation = useMutation({
    mutationFn: async (quizData: { answers: number[]; timeTaken: number }) => {
      return apiRequest("POST", "/api/quiz/submit", {
        lectureId: data?.lecture.id,
        userId: user?.id,
        answers: quizData.answers,
        timeTaken: quizData.timeTaken,
      });
    },
    onSuccess: (result: any) => {
      setXpEarned(result.xpEarned || 0);
      if (result.passed) {
        // If the server returned the updated user object (with recalculated level), use it.
        if (result.user) {
          console.log("Updating user from server:", result.user);
          updateUser(result.user);
          
          // Check if user just completed 10 lectures (trigger battle)
          const lecturesCompleted = (result.user.lecturesCompleted || 0) % 10;
          if (lecturesCompleted === 0 && result.user.lecturesCompleted > 0) {
            console.log("🎯 10 lectures completed! Navigating to battle...");
            // Auto-navigate to battle after a short delay to show the completion screen
            setTimeout(() => {
              navigate("/battle");
            }, 3000);
            return;
          }
        } else {
          // Fallback: apply the minimal local updates (XP, lecturesCompleted, floor)
          const newLecturesCompleted = (user?.lecturesCompleted || 0) + 1;
          updateUser({
            lecturesCompleted: newLecturesCompleted,
            xp: (user?.xp || 0) + (result.xpEarned || 0),
            currentFloor: result.floorAdvanced ? (user?.currentFloor || 1) + 1 : user?.currentFloor,
          });
          
          // Check if user just completed 10 lectures (trigger battle)
          const lecturesCompleted = newLecturesCompleted % 10;
          if (lecturesCompleted === 0) {
            console.log("🎯 10 lectures completed! Navigating to battle...");
            // Auto-navigate to battle after a short delay to show the completion screen
            setTimeout(() => {
              navigate("/battle");
            }, 3000);
            return;
          }
        }
      }
      // Invalidate all user-related queries to force refresh
      queryClient.invalidateQueries({ queryKey: ["/api/progress", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/lectures/next", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id] });
    },
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleAnswer = (answerIndex: number) => {
    if (!data?.questions) return;
    
    const question = data.questions[currentQuestion];
    const isCorrect = answerIndex === question.correctAnswer;
    
    setSelectedAnswer(answerIndex);
    setAnswers([...answers, answerIndex]);
    
    if (isCorrect) {
      setScore(score + 1);
    }

    // Move to next question after brief delay
    setTimeout(() => {
      if (currentQuestion < data.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTimeLeft(30);
      } else {
        // Quiz complete
        const finalScore = isCorrect ? score + 1 : score;
        const finalAnswers = [...answers, answerIndex];
        setScore(finalScore);
        setMode("result");
        completeMutation.mutate({ 
          answers: finalAnswers, 
          timeTaken: (data.questions.length * 30) - timeLeft 
        });
      }
    }, 500);
  };

  const handleContinueToQuiz = () => {
    setMode("quiz");
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setTimeLeft(30);
    setScore(0);
  };

  const handleReturnToDashboard = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lecture...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-cinzel text-2xl mb-2">No Lecture Available</h2>
            <p className="text-muted-foreground mb-6">
              You've completed all available lectures on this floor!
            </p>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const floorName = FLOOR_NAMES[user.currentFloor] || `Floor ${user.currentFloor}`;
  const question = data.questions?.[currentQuestion];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <p className="text-sm text-muted-foreground">Floor {user.currentFloor}</p>
                <h1 className="font-cinzel text-lg font-semibold">
                  Lecture {data.lectureNumber}/{data.totalLectures}
                </h1>
              </div>
            </div>

            <Badge variant="outline" className="border-primary text-primary">
              {floorName}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {mode === "lecture" && (
          <div className="space-y-8">
            {/* Lecture Content */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-8 md:p-12">
                <h2 className="font-cinzel text-3xl font-bold text-tower-gold mb-6">
                  {data.lecture.title}
                </h2>
                
                {data.lecture.videoUrl && (
                  <div className="mb-8 rounded-lg overflow-hidden bg-black/50 aspect-video" data-testid="video-player">
                    <iframe
                      width="100%"
                      height="100%"
                      src={data.lecture.videoUrl}
                      title={data.lecture.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                )}
                
                {!data.lecture.videoUrl && data.lecture.imageUrl && (
                  <div className="mb-8 rounded-lg overflow-hidden bg-muted/30">
                    <img 
                      src={data.lecture.imageUrl} 
                      alt={data.lecture.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}

                <div className="prose prose-invert max-w-none">
                  <div 
                    className="text-lg leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: data.lecture.content }}
                    data-testid="lecture-content"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6">
              <Button 
                onClick={handleContinueToQuiz}
                className="w-full py-6 text-lg tower-glow"
                data-testid="button-continue-quiz"
              >
                Continue to Quiz
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {mode === "quiz" && question && (
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Timer and Progress */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">Question {currentQuestion + 1}/{data.questions.length}</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                timeLeft <= 10 ? "bg-destructive/20 text-destructive" : "bg-muted"
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-bebas text-xl tracking-wider">{timeLeft}s</span>
              </div>
            </div>

            <Progress value={(timeLeft / 30) * 100} className="h-2" />

            {/* Question Card */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-8">
                <h2 className="font-cinzel text-2xl font-semibold mb-8 text-center">
                  {question.question}
                </h2>

                <div className="grid gap-4">
                  {(question.options as string[]).map((option, index) => (
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
                      data-testid={`button-answer-${index}`}
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
                        <span className="text-lg">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {mode === "result" && (
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-8 md:p-12">
                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  score >= data.questions.length * 0.7 
                    ? "bg-green-500/20" 
                    : score >= data.questions.length * 0.4
                      ? "bg-yellow-500/20"
                      : "bg-destructive/20"
                }`}>
                  <CheckCircle2 className={`h-12 w-12 ${
                    score >= data.questions.length * 0.7 
                      ? "text-green-500" 
                      : score >= data.questions.length * 0.4
                        ? "text-yellow-500"
                        : "text-destructive"
                  }`} />
                </div>

                <h2 className="font-cinzel text-4xl font-bold mb-2">
                  {score >= data.questions.length * 0.7 
                    ? "Excellent!" 
                    : score >= data.questions.length * 0.4
                      ? "Good Job!"
                      : "Keep Practicing!"
                  }
                </h2>

                <div className="font-bebas text-6xl text-tower-gold tracking-wider my-6">
                  {score}/{data.questions.length}
                </div>

                <p className="text-muted-foreground mb-8">
                  {xpEarned > 0 ? (
                    <>You earned <span className="text-tower-gold font-semibold">+{xpEarned} XP</span></>
                  ) : (
                    <>Score at least 70% to earn XP and progress!</>
                  )}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleReturnToDashboard}
                    className="py-6 px-8 text-lg tower-glow"
                    disabled={completeMutation.isPending}
                    data-testid="button-return-dashboard"
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    Return to Dashboard
                  </Button>
                </div>

                {/* Performance Breakdown */}
                <div className="mt-8 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-4">Performance Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-bebas text-2xl text-green-500">
                        {score}
                      </div>
                      <div className="text-xs text-muted-foreground">Correct</div>
                    </div>
                    <div>
                      <div className="font-bebas text-2xl text-destructive">
                        {data.questions.length - score}
                      </div>
                      <div className="text-xs text-muted-foreground">Wrong</div>
                    </div>
                    <div>
                      <div className="font-bebas text-2xl">
                        {Math.round((score / data.questions.length) * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
