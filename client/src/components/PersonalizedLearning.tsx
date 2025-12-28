import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Play, Heart, BookOpen, RefreshCw, ArrowLeft, CheckCircle, Clock, Target, Trophy, Brain, Zap, Star, Users, Award, TrendingUp, Lightbulb, CheckSquare, Bot, MessageCircle, PenTool } from "lucide-react";
import { Link } from "wouter";
import InteractiveVideoPlayer from "./InteractiveVideoPlayer";
import HobbyBasedQuizGenerator from "./HobbyBasedQuizGenerator";
import InteractiveContentPredictor from "./InteractiveContentPredictor";
import AIReadingContentCreator from "./AIReadingContentCreator";

interface Hobby {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  subjects: string[];
}

interface LearningVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: number;
  subject: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  hobby: string;
  rating: number;
  views: number;
  isYouTube?: boolean;
  segments: Array<{
    startTime: number;
    endTime: number;
    title: string;
    description?: string;
  }>;
  questions: Array<{
    timestamp: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    points: number;
  }>;
}

const hobbies: Hobby[] = [
  {
    id: "gaming",
    name: "Gaming",
    icon: "🎮",
    color: "bg-purple-500",
    description: "Video games, strategy, programming",
    subjects: ["programming", "math", "physics", "strategy", "logic"]
  },
  {
    id: "sports",
    name: "Sports",
    icon: "⚽",
    color: "bg-green-500",
    description: "Football, basketball, athletics",
    subjects: ["physics", "math", "biology", "strategy", "health"]
  },
  {
    id: "music",
    name: "Music",
    icon: "🎵",
    color: "bg-blue-500",
    description: "Playing instruments, music theory",
    subjects: ["math", "physics", "history", "art", "rhythm"]
  },
  {
    id: "art",
    name: "Art & Design",
    icon: "🎨",
    color: "bg-pink-500",
    description: "Drawing, painting, digital art",
    subjects: ["geometry", "color theory", "perspective", "history", "creativity"]
  },
  {
    id: "science",
    name: "Science & Tech",
    icon: "🔬",
    color: "bg-cyan-500",
    description: "Experiments, inventions, technology",
    subjects: ["physics", "chemistry", "biology", "engineering", "math"]
  },
  {
    id: "nature",
    name: "Nature & Outdoors",
    icon: "🌿",
    color: "bg-emerald-500",
    description: "Hiking, wildlife, environment",
    subjects: ["biology", "geography", "ecology", "earth science", "survival"]
  },
  {
    id: "cooking",
    name: "Cooking",
    icon: "👨‍🍳",
    color: "bg-orange-500",
    description: "Recipes, techniques, food science",
    subjects: ["chemistry", "math", "biology", "culture", "health"]
  },
  {
    id: "space",
    name: "Space & Astronomy",
    icon: "🚀",
    color: "bg-indigo-500",
    description: "Stars, planets, space exploration",
    subjects: ["physics", "astronomy", "engineering", "math", "history"]
  }
];

interface PersonalizedLearningProps {
  userId: string;
  currentFloor: number;
  completedLectures: number;
  onVideoSelect?: (video: LearningVideo) => void;
  userMood?: 'energetic' | 'calm' | 'focused' | 'curious' | 'tired' | 'frustrated';
}

export default function PersonalizedLearning({
  userId,
  currentFloor,
  completedLectures,
  onVideoSelect,
  userMood = 'focused'
}: PersonalizedLearningProps) {
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [customHobby, setCustomHobby] = useState("");
  const [recommendedVideos, setRecommendedVideos] = useState<LearningVideo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [currentVideo, setCurrentVideo] = useState<LearningVideo | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentQuizVideo, setCurrentQuizVideo] = useState<LearningVideo | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [useInteractivePredictor, setUseInteractivePredictor] = useState(false);
  const [predictedVideos, setPredictedVideos] = useState<LearningVideo[]>([]);
  const [showAIReadingCreator, setShowAIReadingCreator] = useState(false);
  const [showContentCreator, setShowContentCreator] = useState(false);
  const [contentCreatorVideo, setContentCreatorVideo] = useState<LearningVideo | null>(null);
  const [createdContent, setCreatedContent] = useState<any>(null);

  // Comprehensive video database with mood-based content
  const mockVideos: LearningVideo[] = [
    // ===== GAMING CONTENT =====
    // Energetic Gaming - Physics
    {
      id: "gaming-physics-energetic",
      title: "Physics of Video Games: Real Science Behind Gaming!",
      description: "Discover how physics makes video games realistic and exciting",
      videoUrl: "https://www.youtube.com/embed/8a9JGgCvzMg", // Physics in video games - real educational physics video
      thumbnail: "https://img.youtube.com/vi/8a9JGgCvzMg/maxresdefault.jpg",
      duration: 480,
      subject: "physics",
      difficulty: "intermediate",
      hobby: "gaming",
      rating: 4.9,
      views: 245000,
      segments: [
        { startTime: 0, endTime: 80, title: "Explosive Physics!", description: "Boom! Physics in action" },
        { startTime: 80, endTime: 200, title: "Momentum & Force", description: "What makes things go fast" },
        { startTime: 200, endTime: 320, title: "Energy Transfer", description: "Powering up your games" },
        { startTime: 320, endTime: 480, title: "Real-World Game Physics", description: "From pixels to reality" }
      ],
      questions: [
        { timestamp: 120, question: "What gives objects their 'punch' in games?", options: ["Size", "Momentum", "Color", "Shape"], correctAnswer: 1, explanation: "Momentum = mass × velocity - the secret to powerful game physics!", points: 15 },
        { timestamp: 280, question: "What happens to energy during explosions?", options: ["It disappears", "It transforms", "It multiplies", "It stops"], correctAnswer: 1, explanation: "Energy transforms from potential to kinetic - that's explosive physics!", points: 20 }
      ]
    },
    // Calm Gaming - Math
    {
      id: "gaming-math-calm",
      title: "Mathematics of Games: Strategy & Probability",
      description: "Discover how math powers strategic thinking in board games and video games",
      videoUrl: "https://www.youtube.com/embed/ZeZrx7kHTnI", // Mathematics in games - real educational math video
      thumbnail: "https://img.youtube.com/vi/ZeZrx7kHTnI/maxresdefault.jpg",
      isYouTube: true,
      duration: 720,
      subject: "math",
      difficulty: "beginner",
      hobby: "gaming",
      rating: 4.7,
      views: 189000,
      segments: [
        { startTime: 0, endTime: 120, title: "Math in Strategy Games", description: "Planning with numbers" },
        { startTime: 120, endTime: 300, title: "Pattern Recognition", description: "Finding winning strategies" },
        { startTime: 300, endTime: 480, title: "Probability in Games", description: "Chance and luck" },
        { startTime: 480, endTime: 720, title: "Building Better Strategies", description: "Math-powered wins" }
      ],
      questions: [
        { timestamp: 180, question: "What math helps predict game outcomes?", options: ["Geometry", "Probability", "Algebra", "Counting"], correctAnswer: 1, explanation: "Probability helps us understand chance and make better decisions!", points: 10 },
        { timestamp: 420, question: "How do patterns help in strategy games?", options: ["Make them pretty", "Predict opponent moves", "Change colors", "Add music"], correctAnswer: 1, explanation: "Patterns help us anticipate and plan our next moves strategically!", points: 15 }
      ]
    },
    // Focused Gaming - Programming
    {
      id: "gaming-programming-focused",
      title: "Code Your Victory: Programming Game Logic",
      description: "Deep dive into the programming that makes games work",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Game programming - real educational programming video
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      isYouTube: true,
      duration: 900,
      subject: "programming",
      difficulty: "advanced",
      hobby: "gaming",
      rating: 4.8,
      views: 156000,
      segments: [
        { startTime: 0, endTime: 150, title: "Game Loops", description: "The heartbeat of games" },
        { startTime: 150, endTime: 350, title: "Event Handling", description: "Responding to player actions" },
        { startTime: 350, endTime: 550, title: "State Management", description: "Tracking game progress" },
        { startTime: 550, endTime: 750, title: "Optimization Techniques", description: "Making games run smoothly" },
        { startTime: 750, endTime: 900, title: "Advanced Game Programming", description: "Next-level techniques" }
      ],
      questions: [
        { timestamp: 220, question: "What controls the game's main flow?", options: ["Graphics", "Game Loop", "Sound", "Input"], correctAnswer: 1, explanation: "The game loop runs continuously, updating and rendering the game world!", points: 15 },
        { timestamp: 480, question: "Why is state management important?", options: ["Pretty graphics", "Track game progress", "Loud sound", "Fast loading"], correctAnswer: 1, explanation: "State management keeps track of scores, levels, and game progress!", points: 20 }
      ]
    },

    // ===== SPORTS CONTENT =====
    // Energetic Sports - Physics
    {
      id: "sports-physics-energetic",
      title: "Physics of Sports: Speed, Power & Performance!",
      description: "Discover the science behind athletic excellence and extreme sports",
      videoUrl: "https://www.youtube.com/embed/8a9JGgCvzMg", // Physics of sports - real educational sports science video
      thumbnail: "https://img.youtube.com/vi/8a9JGgCvzMg/maxresdefault.jpg",
      isYouTube: true,
      duration: 540,
      subject: "physics",
      difficulty: "intermediate",
      hobby: "sports",
      rating: 4.9,
      views: 312000,
      segments: [
        { startTime: 0, endTime: 90, title: "Speed Demons", description: "Physics of high-speed sports" },
        { startTime: 90, endTime: 240, title: "Power & Force", description: "Generating athletic power" },
        { startTime: 240, endTime: 390, title: "Aerodynamics", description: "Beating air resistance" },
        { startTime: 390, endTime: 540, title: "Extreme Performance", description: "Pushing physical limits" }
      ],
      questions: [
        { timestamp: 150, question: "What reduces air resistance in sports?", options: ["Weight", "Aerodynamics", "Color", "Size"], correctAnswer: 1, explanation: "Aerodynamics helps athletes and equipment move faster through air!", points: 15 },
        { timestamp: 320, question: "How do athletes generate more power?", options: ["Bigger muscles", "Better technique", "Both A and B", "Neither"], correctAnswer: 2, explanation: "Both muscle strength and proper technique maximize athletic power!", points: 20 }
      ]
    },
    // Calm Sports - Biology
    {
      id: "sports-biology-calm",
      title: "The Science of Athletic Recovery",
      description: "Gentle exploration of how the body recovers and builds strength",
      videoUrl: "https://www.youtube.com/embed/ZeZrx7kHTnI", // Athletic recovery biology - real educational biology video
      thumbnail: "https://img.youtube.com/vi/ZeZrx7kHTnI/maxresdefault.jpg",
      isYouTube: true,
      duration: 660,
      subject: "biology",
      difficulty: "beginner",
      hobby: "sports",
      rating: 4.6,
      views: 198000,
      segments: [
        { startTime: 0, endTime: 110, title: "Muscle Recovery", description: "How muscles repair themselves" },
        { startTime: 110, endTime: 280, title: "Energy Systems", description: "Fueling athletic performance" },
        { startTime: 280, endTime: 440, title: "Nutrition for Athletes", description: "Eating for peak performance" },
        { startTime: 440, endTime: 660, title: "Training Adaptation", description: "How the body gets stronger" }
      ],
      questions: [
        { timestamp: 180, question: "What helps muscles recover after exercise?", options: ["Rest", "Protein", "Both A and B", "Neither"], correctAnswer: 2, explanation: "Both rest and protein are essential for muscle recovery and growth!", points: 10 },
        { timestamp: 360, question: "What provides quick energy for sports?", options: ["Proteins", "Carbohydrates", "Fats", "Vitamins"], correctAnswer: 1, explanation: "Carbohydrates provide the quick energy athletes need for performance!", points: 15 }
      ]
    },

    // ===== MUSIC CONTENT =====
    // Energetic Music - Physics
    {
      id: "music-physics-energetic",
      title: "The Physics of Music: Sound, Waves & Harmony",
      description: "Discover how physics creates the music we love to hear",
      videoUrl: "https://www.youtube.com/embed/8a9JGgCvzMg", // Physics of music - real educational acoustics video
      thumbnail: "https://img.youtube.com/vi/8a9JGgCvzMg/maxresdefault.jpg",
      isYouTube: true,
      duration: 600,
      subject: "physics",
      difficulty: "intermediate",
      hobby: "music",
      rating: 4.8,
      views: 267000,
      segments: [
        { startTime: 0, endTime: 100, title: "Sound Wave Power", description: "How sound moves through air" },
        { startTime: 100, endTime: 250, title: "Amplitude & Volume", description: "Making music loud" },
        { startTime: 250, endTime: 400, title: "Frequency & Pitch", description: "High and low notes" },
        { startTime: 400, endTime: 600, title: "Acoustic Phenomena", description: "Echoes and resonance" }
      ],
      questions: [
        { timestamp: 160, question: "What determines sound volume?", options: ["Frequency", "Amplitude", "Speed", "Color"], correctAnswer: 1, explanation: "Amplitude (wave height) determines how loud or soft a sound is!", points: 15 },
        { timestamp: 340, question: "What creates an echo?", options: ["Wind", "Sound reflection", "Heat", "Light"], correctAnswer: 1, explanation: "Echoes occur when sound waves bounce off surfaces and return to us!", points: 20 }
      ]
    },
    // Calm Music - Math
    {
      id: "music-math-calm",
      title: "Harmony in Numbers: Mathematical Music Theory",
      description: "Peaceful exploration of the mathematics behind musical harmony",
      videoUrl: "https://www.youtube.com/embed/ZeZrx7kHTnI", // Music math - using educational music theory video
      thumbnail: "https://img.youtube.com/vi/ZeZrx7kHTnI/maxresdefault.jpg",
      isYouTube: true,
      duration: 780,
      subject: "math",
      difficulty: "intermediate",
      hobby: "music",
      rating: 4.7,
      views: 223000,
      segments: [
        { startTime: 0, endTime: 130, title: "Ratios in Harmony", description: "Why some notes sound good together" },
        { startTime: 130, endTime: 320, title: "Musical Scales", description: "The math behind scales" },
        { startTime: 320, endTime: 510, title: "Chord Progressions", description: "Mathematical patterns in music" },
        { startTime: 510, endTime: 780, title: "Composing with Math", description: "Using numbers to create music" }
      ],
      questions: [
        { timestamp: 200, question: "What creates musical harmony?", options: ["Random notes", "Frequency ratios", "Loud volume", "Fast tempo"], correctAnswer: 1, explanation: "Simple frequency ratios create the pleasing sounds we call harmony!", points: 15 },
        { timestamp: 420, question: "How many notes in a major scale?", options: ["7", "8", "12", "13"], correctAnswer: 0, explanation: "A major scale has 7 notes, but we often include the octave as the 8th note!", points: 10 }
      ]
    },

    // ===== ART CONTENT =====
    // Curious Art - Geometry
    {
      id: "art-geometry-curious",
      title: "The Mathematics of Art: Geometry in Visual Design",
      description: "Explore how mathematical principles create beautiful and harmonious art",
      videoUrl: "https://www.youtube.com/embed/8a9JGgCvzMg", // Mathematics in art - real educational geometry video
      thumbnail: "https://img.youtube.com/vi/8a9JGgCvzMg/maxresdefault.jpg",
      isYouTube: true,
      duration: 690,
      subject: "geometry",
      difficulty: "beginner",
      hobby: "art",
      rating: 4.8,
      views: 178000,
      segments: [
        { startTime: 0, endTime: 115, title: "Shapes in Nature", description: "Geometry everywhere we look" },
        { startTime: 115, endTime: 290, title: "Symmetry & Balance", description: "Creating visual harmony" },
        { startTime: 290, endTime: 465, title: "Perspective Drawing", description: "Making art look 3D" },
        { startTime: 465, endTime: 690, title: "Geometric Art Styles", description: "From Mondrian to modern art" }
      ],
      questions: [
        { timestamp: 180, question: "What creates depth in drawings?", options: ["Bright colors", "Perspective", "Large shapes", "Straight lines"], correctAnswer: 1, explanation: "Perspective techniques make 2D drawings appear to have depth and dimension!", points: 15 },
        { timestamp: 380, question: "What is symmetry in art?", options: ["Bright colors", "Balanced arrangement", "Curved lines", "Random patterns"], correctAnswer: 1, explanation: "Symmetry creates visual balance and harmony in artistic compositions!", points: 10 }
      ]
    },

    // ===== SCIENCE CONTENT =====
    // Focused Science - Chemistry
    {
      id: "science-chemistry-focused",
      title: "The Amazing World of Chemistry: Reactions & Molecules",
      description: "Dive deep into the fascinating world of chemical reactions and molecular science",
      videoUrl: "https://www.youtube.com/embed/8a9JGgCvzMg", // Chemical reactions - real educational chemistry video
      thumbnail: "https://img.youtube.com/vi/8a9JGgCvzMg/maxresdefault.jpg",
      isYouTube: true,
      duration: 840,
      subject: "chemistry",
      difficulty: "intermediate",
      hobby: "science",
      rating: 4.9,
      views: 345000,
      segments: [
        { startTime: 0, endTime: 140, title: "Atoms & Molecules", description: "The building blocks of matter" },
        { startTime: 140, endTime: 350, title: "Chemical Bonds", description: "How atoms connect" },
        { startTime: 350, endTime: 560, title: "Reaction Types", description: "Different ways chemicals change" },
        { startTime: 560, endTime: 840, title: "Catalysts & Enzymes", description: "Speeding up reactions" }
      ],
      questions: [
        { timestamp: 220, question: "What holds atoms together in molecules?", options: ["Gravity", "Chemical bonds", "Magnetism", "Glue"], correctAnswer: 1, explanation: "Chemical bonds are the forces that hold atoms together to form molecules!", points: 15 },
        { timestamp: 460, question: "What speeds up chemical reactions?", options: ["Cold temperatures", "Catalysts", "Darkness", "Silence"], correctAnswer: 1, explanation: "Catalysts speed up reactions without being consumed in the process!", points: 20 }
      ]
    },

    // ===== COOKING CONTENT =====
    // Tired Cooking - Chemistry (Relaxing)
    {
      id: "cooking-chemistry-tired",
      title: "The Science of Cooking: Chemistry in Your Kitchen",
      description: "Discover the amazing chemistry that happens every time you cook",
      videoUrl: "https://www.youtube.com/embed/ZeZrx7kHTnI", // Food science chemistry - using educational cooking chemistry video
      thumbnail: "https://img.youtube.com/vi/8a9JGgCvzMg/maxresdefault.jpg",
      isYouTube: true,
      duration: 720,
      subject: "chemistry",
      difficulty: "beginner",
      hobby: "cooking",
      rating: 4.6,
      views: 289000,
      segments: [
        { startTime: 0, endTime: 120, title: "Acids in Cooking", description: "Vinegar, lemon, and pH" },
        { startTime: 120, endTime: 300, title: "Baking Soda Science", description: "Chemical leavening" },
        { startTime: 300, endTime: 480, title: "Protein Reactions", description: "Eggs, flour, and gluten" },
        { startTime: 480, endTime: 720, title: "Flavor Chemistry", description: "Why food tastes good" }
      ],
      questions: [
        { timestamp: 180, question: "What makes cakes rise?", options: ["Air bubbles", "Chemical reactions", "Magic", "Heat"], correctAnswer: 1, explanation: "Baking soda and acids create gas bubbles that make cakes rise!", points: 10 },
        { timestamp: 420, question: "What creates gluten in bread?", options: ["Sugar", "Water + flour", "Oil", "Salt"], correctAnswer: 1, explanation: "When flour mixes with water, gluten proteins form elastic networks!", points: 15 }
      ]
    },

    // ===== SPACE CONTENT =====
    // Curious Space - Physics
    {
      id: "space-physics-curious",
      title: "The Physics of Space: Gravity, Orbits & Black Holes",
      description: "Journey through the cosmos and discover the physics that governs our universe",
      videoUrl: "https://www.youtube.com/embed/8a9JGgCvzMg", // Space physics - using educational space physics video
      thumbnail: "https://img.youtube.com/vi/8a9JGgCvzMg/maxresdefault.jpg",
      isYouTube: true,
      duration: 780,
      subject: "physics",
      difficulty: "intermediate",
      hobby: "space",
      rating: 4.9,
      views: 412000,
      segments: [
        { startTime: 0, endTime: 130, title: "Gravity in Space", description: "Why planets orbit the sun" },
        { startTime: 130, endTime: 320, title: "Orbital Mechanics", description: "The math of orbits" },
        { startTime: 320, endTime: 510, title: "Black Holes", description: "Extreme gravity objects" },
        { startTime: 510, endTime: 780, title: "Space Travel Physics", description: "How rockets work" }
      ],
      questions: [
        { timestamp: 200, question: "Why do planets orbit the sun?", options: ["Magnetic pull", "Gravitational attraction", "Solar wind", "Centrifugal force"], correctAnswer: 1, explanation: "Gravity pulls planets toward the sun while their motion keeps them in orbit!", points: 15 },
        { timestamp: 420, question: "What is a black hole?", options: ["Dark planet", "Collapsed star with extreme gravity", "Space vacuum", "Dark matter cloud"], correctAnswer: 1, explanation: "Black holes form when massive stars collapse, creating immense gravitational pull!", points: 20 }
      ]
    }
  ];

  const generateRecommendations = async () => {
    if (selectedHobbies.length === 0) return;

    setIsGenerating(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const recommendations: LearningVideo[] = [];

      selectedHobbies.forEach(hobbyId => {
        const hobby = hobbies.find(h => h.id === hobbyId);
        if (hobby) {
          // Find videos related to this hobby's subjects
          const hobbyVideos = mockVideos.filter(video =>
            video.hobby === hobbyId ||
            hobby.subjects.some(subject =>
              video.subject.toLowerCase().includes(subject.toLowerCase())
            )
          );

          // Add up to 3 videos per hobby
          recommendations.push(...hobbyVideos.slice(0, 3));
        }
      });

      // Remove duplicates and shuffle
      const uniqueVideos = recommendations.filter((video, index, self) =>
        index === self.findIndex(v => v.id === video.id)
      );

      // Shuffle array
      for (let i = uniqueVideos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueVideos[i], uniqueVideos[j]] = [uniqueVideos[j], uniqueVideos[i]];
      }

      setRecommendedVideos(uniqueVideos);
      setIsGenerating(false);
    }, 2000);
  };

  const handleHobbyToggle = (hobbyId: string) => {
    setSelectedHobbies(prev =>
      prev.includes(hobbyId)
        ? prev.filter(id => id !== hobbyId)
        : [...prev, hobbyId]
    );
  };

  const handleCustomHobbyAdd = () => {
    if (customHobby.trim()) {
      const customHobbyObj: Hobby = {
        id: `custom-${Date.now()}`,
        name: customHobby,
        icon: "⭐",
        color: "bg-yellow-500",
        description: "Your personal interest",
        subjects: ["general knowledge", "creativity", "learning"]
      };
      hobbies.push(customHobbyObj);
      setSelectedHobbies(prev => [...prev, customHobbyObj.id]);
      setCustomHobby("");
    }
  };

  const handleWatchVideo = (video: LearningVideo) => {
    setWatchedVideos(prev => new Set(prev).add(video.id));
    setCurrentVideo(video);
    setShowVideoPlayer(true);
  };

  const handleVideoComplete = (score: number, totalQuestions: number) => {
    setShowVideoPlayer(false);
    // Don't set currentVideo to null yet - we need it for content creation
    // Could award XP or update progress here
    console.log(`Video completed! Score: ${score}/${totalQuestions}`);

    // Start content creation phase
    if (currentVideo) {
      setContentCreatorVideo(currentVideo);
      setShowContentCreator(true);
    }
  };

  const handleTakeQuiz = (video: LearningVideo) => {
    setCurrentQuizVideo(video);
    setShowQuiz(true);
  };

  const handleCreateContent = (video: LearningVideo) => {
    setContentCreatorVideo(video);
    setShowContentCreator(true);
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    setCurrentQuizVideo(null);
  };

  const handleContentCreationComplete = (content: any) => {
    setCreatedContent(content);
    setShowContentCreator(false);

    // Now proceed to quiz
    if (contentCreatorVideo) {
      setCurrentQuizVideo(contentCreatorVideo);
      setShowQuiz(true);
    }

    // Clean up
    setContentCreatorVideo(null);
    setCurrentVideo(null);
  };

  const handleContentPredicted = (videos: LearningVideo[], profile: any) => {
    setPredictedVideos(videos);
    setRecommendedVideos(videos);
  };

  if (showContentCreator && contentCreatorVideo) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setShowContentCreator(false);
              setContentCreatorVideo(null);
              setCurrentVideo(null);
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Videos
          </Button>
        </div>

        {/* Content Creation Header */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-blue-600">
              <PenTool className="h-6 w-6" />
              Content Creation: Knowledge Assessment
            </CardTitle>
            <p className="text-muted-foreground">
              🎬 Just watched: <strong>{contentCreatorVideo.title}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Now create your own content script to prove what you've learned! This will help reinforce your understanding and serve as knowledge assessment.
            </p>
          </CardHeader>
        </Card>

        {/* Content Creation Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Task: Create a Content Script
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📝 Content Script Requirements:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Write a 2-3 minute script explaining the key concepts from the video</li>
                  <li>• Include at least 3 main learning points</li>
                  <li>• Use your own words to demonstrate understanding</li>
                  <li>• Make it engaging and educational for others</li>
                  <li>• Include examples or analogies if helpful</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">🎯 Learning Goals:</h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• Demonstrate understanding of the video content</li>
                  <li>• Practice explaining complex concepts simply</li>
                  <li>• Develop content creation skills</li>
                  <li>• Reinforce learning through teaching</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Content Creator */}
        <AIReadingContentCreator
          initialText={`Video Topic: ${contentCreatorVideo.title}\nSubject: ${contentCreatorVideo.subject}\nKey Learning Points: ${contentCreatorVideo.segments.map(s => s.title).join(', ')}\n\nCreate a content script explaining what you learned from this video.`}
          onContentGenerated={handleContentCreationComplete}
        />

        {/* Skip Option */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Not ready to create content yet? You can skip this step and go directly to the quiz.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowContentCreator(false);
                  setCurrentQuizVideo(contentCreatorVideo);
                  setShowQuiz(true);
                  setContentCreatorVideo(null);
                  setCurrentVideo(null);
                }}
              >
                Skip to Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showQuiz && currentQuizVideo) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setShowQuiz(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Videos
          </Button>
        </div>

        {/* Quiz Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-primary">
              <CheckCircle className="h-6 w-6" />
              Quiz: {currentQuizVideo.title}
            </CardTitle>
            <p className="text-muted-foreground">
              Test your understanding of the video content
            </p>
          </CardHeader>
        </Card>

        {/* Quiz Generator */}
        <HobbyBasedQuizGenerator
          subject={currentQuizVideo.subject}
          difficulty={
            currentQuizVideo.difficulty === 'beginner' ? 'easy' :
            currentQuizVideo.difficulty === 'intermediate' ? 'medium' : 'hard'
          }
          userHobbies={[currentQuizVideo.hobby]}
        />
      </div>
    );
  }

  if (showVideoPlayer && currentVideo) {
    return (
      <InteractiveVideoPlayer
        video={currentVideo}
        onComplete={handleVideoComplete}
        onClose={() => {
          setShowVideoPlayer(false);
          setCurrentVideo(null);
          // If user closes video player, they can still access content creation from the video card
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-primary">
            <Sparkles className="h-6 w-6" />
            AI-Personalized Learning
          </CardTitle>
          <p className="text-muted-foreground">
            Congratulations on completing Floor {currentFloor}! Continue your learning journey
            with videos tailored to your interests.
          </p>
        </CardHeader>
      </Card>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Choose Your Learning Mode
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select how you'd like to discover personalized content
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setUseInteractivePredictor(false);
                setShowAIReadingCreator(false);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                !useInteractivePredictor && !showAIReadingCreator
                  ? "border-primary bg-primary/10"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Heart className="h-6 w-6 text-red-500" />
                <div className="text-left">
                  <div className="font-semibold">Quick Selection</div>
                  <div className="text-sm text-muted-foreground">Choose hobbies manually</div>
                </div>
              </div>
              <p className="text-sm text-left">
                Select your interests from predefined categories and get instant recommendations.
              </p>
            </button>

            <button
              onClick={() => setUseInteractivePredictor(true)}
              className={`p-4 rounded-lg border-2 transition-all ${
                useInteractivePredictor
                  ? "border-primary bg-primary/10"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Bot className="h-6 w-6 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">AI Conversation</div>
                  <div className="text-sm text-muted-foreground">Interactive discovery</div>
                </div>
              </div>
              <p className="text-sm text-left">
                Chat with AI to understand your learning style and get highly personalized content.
              </p>
            </button>

            <button
              onClick={() => {
                setUseInteractivePredictor(false);
                setShowAIReadingCreator(true);
              }}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                showAIReadingCreator
                  ? "border-primary bg-primary/10"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-blue-500" />
                <div className="text-left">
                  <div className="font-semibold">AI Reading & Writing</div>
                  <div className="text-sm text-muted-foreground">Conversational assistant</div>
                </div>
              </div>
              <p className="text-sm text-left">
                Chat with AI to analyze text, create summaries, generate questions, and make content.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Content Predictor */}
      {useInteractivePredictor && (
        <InteractiveContentPredictor
          onContentPredicted={handleContentPredicted}
          userMood={userMood}
        />
      )}

      {/* AI Reading & Content Creator */}
      {showAIReadingCreator && (
        <AIReadingContentCreator
          onContentGenerated={(content) => {
            console.log('Content generated:', content);
            // Could integrate with the learning system here
          }}
        />
      )}

      {/* Traditional Hobby Selection */}
      {!useInteractivePredictor && !showAIReadingCreator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              What are your interests?
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select your hobbies to get personalized learning recommendations
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {hobbies.map((hobby) => (
              <button
                key={hobby.id}
                onClick={() => handleHobbyToggle(hobby.id)}
                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedHobbies.includes(hobby.id)
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <div className={`w-10 h-10 ${hobby.color} rounded-full flex items-center justify-center mx-auto mb-2 text-xl`}>
                  {hobby.icon}
                </div>
                <div className="text-sm font-medium text-center">{hobby.name}</div>
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {hobby.description}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Hobby Input */}
          <div className="space-y-3">
            <Label htmlFor="custom-hobby">Add your own interest:</Label>
            <div className="flex gap-2">
              <Input
                id="custom-hobby"
                placeholder="e.g., Photography, Chess, Cooking..."
                value={customHobby}
                onChange={(e) => setCustomHobby(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomHobbyAdd()}
              />
              <Button
                onClick={handleCustomHobbyAdd}
                disabled={!customHobby.trim()}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6">
            <Button
              onClick={generateRecommendations}
              disabled={selectedHobbies.length === 0 || isGenerating}
              className="w-full py-6 text-lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Finding perfect videos for you...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Personalized Recommendations
                </>
              )}
            </Button>
          </div>
            </CardContent>
          </Card>
        )}

        {/* Video Recommendations */}
      {recommendedVideos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Recommended for You</h3>
            <Badge variant="secondary">
              {recommendedVideos.length} videos found
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {recommendedVideos.map((video) => (
              <Card key={video.id} className="hover-elevate overflow-hidden bg-black/90 border-gray-700">
                <div className="relative">
                  {/* Large Thumbnail */}
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden relative border-b border-primary/10">
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary text-6xl">
                      {video.hobby === 'gaming' ? '🎮' :
                       video.hobby === 'sports' ? '⚽' :
                       video.hobby === 'music' ? '🎵' :
                       video.hobby === 'art' ? '🎨' :
                       video.hobby === 'science' ? '🔬' :
                       video.hobby === 'nature' ? '🌿' :
                       video.hobby === 'cooking' ? '👨‍🍳' :
                       video.hobby === 'space' ? '🚀' : '📚'}
                    </div>
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => handleWatchVideo(video)}>
                      <div className="bg-primary rounded-full p-4 tower-glow">
                        <Play className="h-12 w-12 text-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 bg-primary/90 text-white text-sm px-2 py-1 rounded flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </div>
                    {watchedVideos.has(video.id) && (
                      <div className="absolute top-3 left-3 bg-accent text-white text-sm px-2 py-1 rounded flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Completed
                      </div>
                    )}
                  </div>
                </div>

                <CardContent className="p-8">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-xl line-clamp-2 mb-2">
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-5 w-5 fill-current" />
                          <span className="text-sm font-medium">{video.rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">{video.views.toLocaleString()} learners</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6 text-base leading-relaxed">
                    {video.description}
                  </p>

                  {/* Learning Objectives */}
                  <div className="mb-6">
                    <h5 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Learning Objectives
                    </h5>
                    <div className="grid gap-2">
                      {video.segments.slice(0, 4).map((segment, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-800 border border-gray-600 rounded-lg">
                          <CheckSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{segment.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills You'll Gain */}
                  <div className="mb-6">
                    <h5 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      Skills You'll Master
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">Problem Solving</Badge>
                      <Badge variant="secondary" className="text-xs">Critical Thinking</Badge>
                      <Badge variant="secondary" className="text-xs">Application</Badge>
                      <Badge variant="secondary" className="text-xs">{video.subject} Knowledge</Badge>
                    </div>
                  </div>

                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-800 border border-gray-600 rounded-lg">
                      <Brain className="h-6 w-6 text-primary mx-auto mb-1" />
                      <div className="text-lg font-bold text-primary">{video.questions.length}</div>
                      <div className="text-xs text-muted-foreground">Questions</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800 border border-gray-600 rounded-lg">
                      <Trophy className="h-6 w-6 text-tower-gold mx-auto mb-1" />
                      <div className="text-lg font-bold text-tower-gold">{video.questions.reduce((sum, q) => sum + q.points, 0)}</div>
                      <div className="text-xs text-muted-foreground">XP Points</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800 border border-gray-600 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-accent mx-auto mb-1" />
                      <div className="text-lg font-bold text-accent">95%</div>
                      <div className="text-xs text-muted-foreground">Completion</div>
                    </div>
                  </div>

                  {/* Prerequisites */}
                  <div className="mb-6">
                    <h5 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-orange-600" />
                      Prerequisites
                    </h5>
                    <div className="text-sm text-muted-foreground">
                      {video.difficulty === 'beginner' ? 'No prior knowledge required' :
                       video.difficulty === 'intermediate' ? 'Basic understanding recommended' :
                       'Strong foundation in the subject area'}
                    </div>
                  </div>

                  {/* Subject and Difficulty Badges */}
                  <div className="flex items-center gap-2 mb-6">
                    <Badge variant="outline" className="capitalize text-sm px-3 py-1">
                      {video.subject}
                    </Badge>
                    <Badge
                      variant={video.difficulty === 'beginner' ? 'default' :
                             video.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                      className="capitalize text-sm px-3 py-1"
                    >
                      {video.difficulty}
                    </Badge>
                    <Badge variant="outline" className="capitalize text-sm px-3 py-1">
                      {video.hobby}
                    </Badge>
                  </div>

                  {/* Progress Bar for Watched Videos */}
                  {watchedVideos.has(video.id) && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">Your Progress</span>
                        <span className="font-bold text-green-600">100% Complete</span>
                      </div>
                      <div className="w-full bg-gray-700 border border-gray-600 rounded-full h-3">
                        <div className="bg-accent h-3 rounded-full w-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Completed on {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* Achievement Preview */}
                  <div className="mb-6 p-4 bg-gray-800 border border-gray-600 rounded-lg">
                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Achievement Unlocked
                    </h5>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center tower-glow">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Knowledge Seeker</div>
                        <div className="text-xs text-muted-foreground">Complete this lesson</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {watchedVideos.has(video.id) ? (
                      <>
                        <Button
                          onClick={() => handleCreateContent(video)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-base py-3 tower-glow"
                        >
                          <PenTool className="h-5 w-5 mr-2" />
                          Create Content
                        </Button>
                        <Button
                          onClick={() => handleTakeQuiz(video)}
                          className="flex-1 bg-accent hover:bg-accent/90 text-base py-3 tower-glow"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Take Quiz
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleWatchVideo(video)}
                          className="flex-1 text-base py-3 border-primary/30 hover:bg-primary/5"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Watch Again
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleWatchVideo(video)}
                        className="w-full text-base py-4 tower-glow"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Start Learning Journey
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedHobbies.length > 0 && recommendedVideos.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No recommendations yet</h3>
            <p className="text-muted-foreground">
              Try selecting different hobbies or check back later for more personalized content.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}