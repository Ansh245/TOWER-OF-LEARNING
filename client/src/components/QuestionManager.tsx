import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Filter, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  lectureId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
}

interface Lecture {
  id: string;
  title: string;
  floor: number;
}

export default function QuestionManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>("all");
  const [selectedFloor, setSelectedFloor] = React.useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState<QuizQuestion | null>(null);
  const [formData, setFormData] = React.useState({
    lectureId: "",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    difficulty: "medium" as "easy" | "medium" | "hard",
    timeLimit: 30,
  });

  // Fetch questions
  const { data: questions = [] } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/teacher/questions"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/questions");
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  // Fetch lectures for dropdown
  const { data: lectures = [] } = useQuery<Lecture[]>({
    queryKey: ["/api/lectures/all"],
    queryFn: async () => {
      // Get all floors and their lectures
      const allLectures: Lecture[] = [];
      for (let floor = 1; floor <= 10; floor++) {
        try {
          const res = await fetch(`/api/lectures/floor/${floor}`);
          if (res.ok) {
            const floorLectures = await res.json();
            allLectures.push(...floorLectures);
          }
        } catch (error) {
          // Ignore errors for floors without lectures
        }
      }
      return allLectures;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/teacher/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create question");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/questions"] });
      toast({ title: "Success", description: "Question created successfully" });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/teacher/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update question");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/questions"] });
      toast({ title: "Success", description: "Question updated successfully" });
      resetForm();
      setEditingQuestion(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/teacher/questions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete question");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/questions"] });
      toast({ title: "Success", description: "Question deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      lectureId: "",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      difficulty: "medium",
      timeLimit: 30,
    });
  };

  const handleEdit = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setFormData({
      lectureId: question.lectureId,
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      timeLimit: question.timeLimit,
    });
  };

  const handleCloseEditDialog = () => {
    setEditingQuestion(null);
    resetForm();
  };

  const validateForm = () => {
    if (!formData.lectureId.trim()) {
      toast({ title: "Error", description: "Please select a lecture", variant: "destructive" });
      return false;
    }
    if (!formData.question.trim()) {
      toast({ title: "Error", description: "Please enter a question", variant: "destructive" });
      return false;
    }
    if (formData.options.some(option => !option.trim())) {
      toast({ title: "Error", description: "Please fill in all answer options", variant: "destructive" });
      return false;
    }
    if (formData.timeLimit < 10 || formData.timeLimit > 300) {
      toast({ title: "Error", description: "Time limit must be between 10 and 300 seconds", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getQuestionFloor = (question: QuizQuestion) => {
    const lecture = lectures.find(l => l.id === question.lectureId);
    return lecture ? lecture.floor : 0;
  };

  const filteredQuestions = questions.filter(q => {
    const matchesDifficulty = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    const matchesFloor = selectedFloor === "all" || getQuestionFloor(q).toString() === selectedFloor;
    return matchesDifficulty && matchesFloor;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-tower-green/20 text-tower-green border-tower-green/30";
      case "medium": return "bg-tower-gold/20 text-tower-gold border-tower-gold/30";
      case "hard": return "bg-tower-red/20 text-tower-red border-tower-red/30";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getLectureTitle = (lectureId: string) => {
    const lecture = lectures.find(l => l.id === lectureId);
    return lecture ? `${lecture.title} (Floor ${lecture.floor})` : "Unknown Lecture";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-semibold text-tower-gold">Question Management</h2>
          <p className="text-muted-foreground mt-2">Create and manage quiz questions for your lectures</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-tower-gold hover:bg-tower-gold/90 text-background font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-cinzel text-tower-purple">Add New Question</DialogTitle>
            </DialogHeader>
            <QuestionForm
              formData={formData}
              setFormData={setFormData}
              lectures={lectures}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending}
              onCancel={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cinzel text-tower-gold">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-2">
              <Label className="text-foreground">Difficulty Level</Label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Floor Level</Label>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(floor => (
                    <SelectItem key={floor} value={floor.toString()}>
                      Floor {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="font-cinzel text-xl text-tower-purple">Questions ({filteredQuestions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="border border-border rounded-lg p-6 bg-card/30 hover:bg-card/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`${getDifficultyColor(question.difficulty)} border font-medium`}>
                        {question.difficulty.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="border-tower-gold/30 text-tower-gold">
                        {question.timeLimit}s Timer
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-lg mb-4 text-foreground">{question.question}</h4>
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, index) => (
                        <div
                          key={index}
                          className={`text-sm p-3 rounded-md flex items-center gap-3 ${
                            index === question.correctAnswer
                              ? "bg-tower-gold/20 text-tower-gold font-medium border border-tower-gold/30"
                              : "bg-muted/50 text-muted-foreground border border-border/50"
                          }`}
                        >
                          <span className="font-bold w-8 text-center">{String.fromCharCode(65 + index)}</span>
                          <span className="flex-1">{option}</span>
                          {index === question.correctAnswer && (
                            <span className="text-xs bg-tower-gold text-background px-3 py-1 rounded-full font-bold">
                              ✓ CORRECT
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-tower-purple" />
                      <span className="font-medium">{getLectureTitle(question.lectureId)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(question)}
                      className="hover:bg-tower-purple/10 hover:border-tower-purple/30"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="hover:bg-destructive/10 hover:border-destructive/30">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-destructive">Delete Question</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone and will affect any quizzes that use this question.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(question.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
            {filteredQuestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No questions found matching the current filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-cinzel text-tower-purple">Edit Question</DialogTitle>
          </DialogHeader>
          <QuestionForm
            formData={formData}
            setFormData={setFormData}
            lectures={lectures}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            onCancel={handleCloseEditDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface QuestionFormData {
  lectureId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
}

interface QuestionFormProps {
  formData: QuestionFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionFormData>>;
  lectures: Lecture[];
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onCancel: () => void;
}

function QuestionForm({ formData, setFormData, lectures, onSubmit, isLoading, onCancel }: QuestionFormProps) {
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="lecture">Lecture</Label>
        <Select value={formData.lectureId} onValueChange={(value) => updateFormData("lectureId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a lecture" />
          </SelectTrigger>
          <SelectContent>
            {lectures.map((lecture) => (
              <SelectItem key={lecture.id} value={lecture.id}>
                Floor {lecture.floor}: {lecture.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          value={formData.question}
          onChange={(e) => updateFormData("question", e.target.value)}
          placeholder="Enter the question text"
          required
        />
      </div>

      <div>
        <Label>Answer Options</Label>
        <p className="text-sm text-muted-foreground mb-3">Select the radio button for the correct answer</p>
        <div className="space-y-3">
          {formData.options.map((option, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={formData.correctAnswer === index}
                  onChange={() => updateFormData("correctAnswer", index)}
                  className="w-4 h-4 text-tower-gold focus:ring-tower-gold"
                />
              </div>
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Enter option ${index + 1}`}
                className="flex-1"
                required
              />
              <div className="w-8 h-8 rounded-full bg-tower-purple/20 border border-tower-purple/30 flex items-center justify-center">
                <span className="text-sm font-bold text-tower-purple">
                  {String.fromCharCode(65 + index)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={formData.difficulty} onValueChange={(value: "easy" | "medium" | "hard") => updateFormData("difficulty", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
          <Input
            id="timeLimit"
            type="number"
            min="10"
            max="300"
            value={formData.timeLimit}
            onChange={(e) => updateFormData("timeLimit", parseInt(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Question"}
        </Button>
      </div>
    </form>
  );
}