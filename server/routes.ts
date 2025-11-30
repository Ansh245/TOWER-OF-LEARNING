import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.ts";
import { insertUserSchema, insertLectureSchema, calculateLevel, getAdaptiveDifficulty, getDifficultyMultiplier } from "@shared/schema";
import bcrypt from "bcryptjs";

// WebSocket connections for real-time battles
const battleConnections = new Map<string, { 
  ws: WebSocket; 
  odId: string;
  battleId?: string;
}>();

const activeBattles = new Map<string, {
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  currentQuestion: number;
  questions: any[];
  status: "waiting" | "active" | "completed";
}>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed initial data
  try {
    await storage.seedInitialData();
    console.log("Initial data seeded successfully");
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }

  // ============ AUTH ROUTES ============
  
  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, displayName, role, password, firebaseUid } = req.body;
      
      if (!email || !password || !displayName) {
        return res.status(400).json({ error: "Email, password, and display name are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (user) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create new user
      const newUser = await storage.createUser({
        email,
        displayName: displayName || email.split("@")[0],
        passwordHash,
        role: role || "student",
        firebaseUid,
        currentFloor: 1,
        level: 1,
        xp: 0,
        streak: 0,
        battlesWon: 0,
        battlesLost: 0,
        lecturesCompleted: 0,
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      console.log("Login attempt:", { email, passwordLength: password?.length });
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Get user
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log("User not found:", email);
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      console.log("User found, comparing password...");
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      console.log("Password valid:", isPasswordValid);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/auth/user/:email", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // ============ USER ROUTES ============
  
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // ============ LEADERBOARD ============
  
  app.get("/api/leaderboard", async (_req: Request, res: Response) => {
    try {
      const rankings = await storage.getLeaderboard(100);
      res.json({ rankings, userRank: null });
    } catch (error) {
      console.error("Leaderboard error:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  // ============ USER ROUTES ============

  app.get("/api/user/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Dev endpoint: Set user to floor 10 with 10 lectures completed (for testing battles)
  app.post("/api/dev/test-floor/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update user to floor 10 with 10 lectures completed
      const updatedUser = await storage.updateUser(userId, {
        currentFloor: 10,
        lecturesCompleted: 10,
        xp: Math.max(user.xp, 1000), // Ensure enough XP for level progression
      });
      
      // Mark all lectures on floor 10 as completed
      const floor10Lectures = await storage.getLecturesForFloor(10);
      for (const lecture of floor10Lectures) {
        const existing = await storage.getUserProgress(userId, lecture.id);
        if (existing) {
          await storage.updateProgress(existing.id, { completed: true, quizScore: 100 });
        } else {
          await storage.createProgress({
            userId,
            lectureId: lecture.id,
            quizScore: 100,
            completed: true,
            timeTaken: 600,
          });
        }
      }
      
      console.log(`🧪 DEV: User ${userId} set to Floor 10 with 10 lectures completed`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Dev endpoint error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Dev endpoint: promote a user to admin (development only)
  app.post("/api/dev/make-admin/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUser(userId, { role: "admin" });
      console.log(`🧪 DEV: User ${userId} promoted to admin`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Dev make-admin error:", error);
      res.status(500).json({ error: "Failed to promote user to admin" });
    }
  });

  // ============ LECTURE ROUTES ============
  
  app.get("/api/lectures/floor/:floor", async (req: Request, res: Response) => {
    try {
      const floor = parseInt(req.params.floor);
      const lectures = await storage.getLecturesForFloor(floor);
      res.json(lectures);
    } catch (error) {
      console.error("Get lectures error:", error);
      res.status(500).json({ error: "Failed to get lectures" });
    }
  });

  app.get("/api/lectures/:id", async (req: Request, res: Response) => {
    try {
      const lecture = await storage.getLecture(req.params.id);
      if (!lecture) {
        return res.status(404).json({ error: "Lecture not found" });
      }
      res.json(lecture);
    } catch (error) {
      console.error("Get lecture error:", error);
      res.status(500).json({ error: "Failed to get lecture" });
    }
  });

  app.get("/api/lectures/next/:userId", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get all lectures for current floor
      const floorLectures = await storage.getLecturesForFloor(user.currentFloor);
      
      if (floorLectures.length === 0) {
        return res.json({ 
          floorComplete: true, 
          needsBattle: false,
          nextFloor: user.currentFloor + 1 
        });
      }
      
      // Find first uncompleted lecture
      for (const lecture of floorLectures) {
        const progress = await storage.getUserProgress(user.id, lecture.id);
        if (!progress || !progress.completed) {
          return res.json(lecture);
        }
      }
      
      // All lectures completed on this floor
      res.json({ 
        floorComplete: true, 
        needsBattle: false,
        nextFloor: user.currentFloor + 1 
      });
    } catch (error) {
      console.error("Get next lecture error:", error);
      res.status(500).json({ error: "Failed to get next lecture" });
    }
  });

  // Teacher: Create lecture
  app.post("/api/lectures", async (req: Request, res: Response) => {
    try {
      const lecture = await storage.createLecture(req.body);
      res.status(201).json(lecture);
    } catch (error) {
      console.error("Create lecture error:", error);
      res.status(500).json({ error: "Failed to create lecture" });
    }
  });

  // ============ QUIZ ROUTES ============
  
  app.get("/api/quiz/:lectureId", async (req: Request, res: Response) => {
    try {
      const questions = await storage.getQuestionsForLecture(req.params.lectureId);
      // Shuffle options for each question but remember correct answer
      const shuffledQuestions = questions.map(q => ({
        ...q,
        options: q.options,
      }));
      res.json(shuffledQuestions);
    } catch (error) {
      console.error("Get quiz error:", error);
      res.status(500).json({ error: "Failed to get quiz questions" });
    }
  });

  app.post("/api/quiz/submit", async (req: Request, res: Response) => {
    try {
      const { userId, lectureId, answers, timeTaken } = req.body;
      
      // Get questions and calculate score
      const questions = await storage.getQuestionsForLecture(lectureId);
      let correctCount = 0;
      
      questions.forEach((q, index) => {
        if (answers[index] === q.correctAnswer) {
          correctCount++;
        }
      });
      
      const score = questions.length > 0 
        ? Math.round((correctCount / questions.length) * 100) 
        : 0;
      
      // Get lecture for XP reward
      const lecture = await storage.getLecture(lectureId);
      const xpEarned = lecture 
        ? Math.round(lecture.xpReward * (score / 100))
        : 0;
      
      console.log(`Quiz Submit: lectureId=${lectureId}, score=${score}, xpEarned=${xpEarned}, lecture.xpReward=${lecture?.xpReward}`);
      
      // Check existing progress
      let progress = await storage.getUserProgress(userId, lectureId);
      
      if (progress) {
        // Update existing progress
        await storage.updateProgress(progress.id, {
          quizScore: score,
          timeTaken,
          completed: score >= 70, // 70% to pass
          completedAt: score >= 70 ? new Date() : undefined,
        });
      } else {
        // Create new progress
        await storage.createProgress({
          userId,
          lectureId,
          quizScore: score,
          timeTaken,
          completed: score >= 70,
          completedAt: score >= 70 ? new Date() : undefined,
        });
      }
      
      // Update user XP and lectures completed if passed
      let floorAdvanced = false;
      let updatedUser = null;
      
      if (score >= 70) {
        const user = await storage.getUser(userId);
        if (user) {
          const newXp = (user.xp || 0) + xpEarned;
          const newLecturesCompleted = (user.lecturesCompleted || 0) + 1;
          
          console.log(`\n🎓 Quiz PASSED for user ${userId}`);
          console.log(`  Before: XP=${user.xp}, level=${user.level}, lecturesCompleted=${user.lecturesCompleted}`);
          console.log(`  Adding: +${xpEarned} XP`);
          console.log(`  After: XP will be=${newXp}`);
          
          let updates: any = {
            xp: newXp,
            lecturesCompleted: newLecturesCompleted,
          };
          
          // Check if all lectures on current floor are completed
          const floorLectures = await storage.getLecturesForFloor(user.currentFloor);
          let completedOnFloor = 0;
          console.log(`\n  Checking floor ${user.currentFloor}: Total lectures = ${floorLectures.length}`);
          
          for (const lec of floorLectures) {
            // If this is the lecture we just completed, count it as completed (score >= 70)
            if (lec.id === lectureId && score >= 70) {
              completedOnFloor++;
              console.log(`    ✓ Lecture "${lec.title}": completed = true (just submitted with score ${score})`);
            } else {
              const lectureProgress = await storage.getUserProgress(userId, lec.id);
              console.log(`    ${lectureProgress?.completed ? '✓' : '○'} Lecture "${lec.title}": completed = ${lectureProgress?.completed || false}`);
              if (lectureProgress?.completed) {
                completedOnFloor++;
              }
            }
          }
          
          console.log(`\n  Floor ${user.currentFloor}: ${completedOnFloor}/${floorLectures.length} lectures completed`);
          
          // Advance floor only after completing ALL lectures on current floor
          if (completedOnFloor === floorLectures.length && user.currentFloor < 10) {
            updates.currentFloor = user.currentFloor + 1;
            floorAdvanced = true;
            console.log(`  🚀 FLOOR ADVANCED! All lectures on floor ${user.currentFloor} completed. Moving to floor ${user.currentFloor + 1}`);
          } else if (floorLectures.length > 0) {
            console.log(`  ⏳ Need ${floorLectures.length - completedOnFloor} more lecture(s) to advance floor`);
          }
          
          // Update user - level will be auto-calculated based on XP
          updatedUser = await storage.updateUser(userId, updates);
          console.log(`User AFTER DB update: XP=${updatedUser?.xp}, level=${updatedUser?.level}`);
        }
      }
      
      res.json({
        score,
        correctCount,
        totalQuestions: questions.length,
        passed: score >= 70,
        xpEarned: score >= 70 ? xpEarned : 0,
        floorAdvanced,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Submit quiz error:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // ============ PROGRESS ROUTES ============
  
  app.get("/api/progress/:userId", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const floorLectures = await storage.getLecturesForFloor(user.currentFloor);
      
      res.json({
        user,
        currentFloorProgress: [],
        totalFloorLectures: floorLectures.length,
        completedCount: 0,
      });
    } catch (error) {
      console.error("Get progress error:", error);
      res.status(500).json({ error: "Failed to get progress" });
    }
  });

  // ============ BATTLE ROUTES ============
  
  app.get("/api/battles/user/:userId", async (req: Request, res: Response) => {
    try {
      const battles = await storage.getUserBattles(req.params.userId);
      res.json(battles);
    } catch (error) {
      console.error("Get battles error:", error);
      res.status(500).json({ error: "Failed to get battles" });
    }
  });

  app.get("/api/battles/:id", async (req: Request, res: Response) => {
    try {
      const battle = await storage.getBattle(req.params.id);
      if (!battle) {
        return res.status(404).json({ error: "Battle not found" });
      }
      res.json(battle);
    } catch (error) {
      console.error("Get battle error:", error);
      res.status(500).json({ error: "Failed to get battle" });
    }
  });

  // ============ TEACHER ROUTES ============
  
  app.get("/api/teacher/students", async (_req: Request, res: Response) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ error: "Failed to get students" });
    }
  });

  app.get("/api/teacher/student-performance", async (_req: Request, res: Response) => {
    try {
      const students = await storage.getAllStudents();
      const performanceData = students.map(s => ({
        name: s.displayName,
        level: s.level,
        floor: s.currentFloor,
        battlesWon: s.battlesWon,
        battlesLost: s.battlesLost,
      }));
      res.json(performanceData);
    } catch (error) {
      console.error("Get student performance error:", error);
      res.status(500).json({ error: "Failed to get student performance data" });
    }
  });

  // Question Management Routes (Teacher/Admin)
  app.get("/api/teacher/questions", async (_req: Request, res: Response) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Get questions error:", error);
      res.status(500).json({ error: "Failed to get questions" });
    }
  });

  app.get("/api/teacher/questions/:id", async (req: Request, res: Response) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Get question error:", error);
      res.status(500).json({ error: "Failed to get question" });
    }
  });

  app.post("/api/teacher/questions", async (req: Request, res: Response) => {
    try {
      const question = await storage.createQuestion(req.body);
      res.status(201).json(question);
    } catch (error) {
      console.error("Create question error:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.patch("/api/teacher/questions/:id", async (req: Request, res: Response) => {
    try {
      const question = await storage.updateQuestion(req.params.id, req.body);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Update question error:", error);
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/teacher/questions/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete question error:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // ============ ADMIN ROUTES ============
  
  // Get system statistics
  app.get("/api/admin/stats", async (_req: Request, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const students = allUsers.filter(u => u.role === "student");
      const teachers = allUsers.filter(u => u.role === "teacher");
      const admins = allUsers.filter(u => u.role === "admin");
      
      res.json({
        totalUsers: allUsers.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalAdmins: admins.length,
        systemHealth: "operational",
      });
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ error: "Failed to get admin stats" });
    }
  });

  // Get all users for admin management
  app.get("/api/admin/users", async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Return minimal data for admin panel
      res.json(users.map(u => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        role: u.role,
        level: u.level,
        xp: u.xp,
        currentFloor: u.currentFloor,
        lecturesCompleted: u.lecturesCompleted,
        battlesWon: u.battlesWon,
        battlesLost: u.battlesLost,
        createdAt: u.createdAt,
      })));
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Reset user progress (admin only)
  app.post("/api/admin/reset-user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Reset user to initial state
      const updatedUser = await storage.updateUser(userId, {
        currentFloor: 1,
        level: 1,
        xp: 0,
        lecturesCompleted: 0,
        battlesWon: 0,
        battlesLost: 0,
        streak: 0,
      });
      
      console.log(`🔧 ADMIN: User ${userId} progress reset`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Reset user error:", error);
      res.status(500).json({ error: "Failed to reset user" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/delete-user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user is admin (prevent deleting admins)
      if (user.role === "admin") {
        return res.status(403).json({ error: "Cannot delete admin users" });
      }
      
      // Delete user and their progress
      await storage.deleteUser(userId);
      
      console.log(`🗑️ ADMIN: User ${userId} (${user.email}) deleted`);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Promote user to teacher (admin only)
  app.post("/api/admin/promote-teacher/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update user role to teacher
      const updatedUser = await storage.updateUser(userId, {
        role: "teacher",
      });
      
      console.log(`⬆️ ADMIN: User ${userId} (${user.email}) promoted to teacher`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Promote user error:", error);
      res.status(500).json({ error: "Failed to promote user" });
    }
  });

  // ===== POWER CONTROLS (ADMIN ONLY) =====
  
  // Increase user level
  app.post("/api/admin/increase-level/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { amount = 1 } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const newLevel = Math.max(1, user.level + amount);
      const updatedUser = await storage.updateUser(userId, { level: newLevel });
      
      console.log(`⬆️ ADMIN: ${user.email} level increased to ${newLevel}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Increase level error:", error);
      res.status(500).json({ error: "Failed to increase level" });
    }
  });

  // Decrease user level
  app.post("/api/admin/decrease-level/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { amount = 1 } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const newLevel = Math.max(1, user.level - amount);
      const updatedUser = await storage.updateUser(userId, { level: newLevel });
      
      console.log(`⬇️ ADMIN: ${user.email} level decreased to ${newLevel}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Decrease level error:", error);
      res.status(500).json({ error: "Failed to decrease level" });
    }
  });

  // Set user level directly
  app.post("/api/admin/set-level/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { level } = req.body;
      
      if (!level || level < 1) {
        return res.status(400).json({ error: "Invalid level" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const updatedUser = await storage.updateUser(userId, { level });
      
      console.log(`📊 ADMIN: ${user.email} level set to ${level}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Set level error:", error);
      res.status(500).json({ error: "Failed to set level" });
    }
  });

  // Set user XP directly
  app.post("/api/admin/set-xp/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { xp } = req.body;
      
      if (xp === undefined || xp < 0) {
        return res.status(400).json({ error: "Invalid XP" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const updatedUser = await storage.updateUser(userId, { xp });
      
      console.log(`⭐ ADMIN: ${user.email} XP set to ${xp}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Set XP error:", error);
      res.status(500).json({ error: "Failed to set XP" });
    }
  });

  // Add XP to user
  app.post("/api/admin/add-xp/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { amount = 100 } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const newXp = Math.max(0, (user.xp || 0) + amount);
      const updatedUser = await storage.updateUser(userId, { xp: newXp });
      
      console.log(`⭐ ADMIN: ${user.email} gained ${amount} XP (total: ${newXp})`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Add XP error:", error);
      res.status(500).json({ error: "Failed to add XP" });
    }
  });

  // Set user floor/level progression
  app.post("/api/admin/set-floor/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { floor } = req.body;
      
      if (!floor || floor < 1 || floor > 12) {
        return res.status(400).json({ error: "Invalid floor (1-12)" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const updatedUser = await storage.updateUser(userId, { currentFloor: floor });
      
      console.log(`🏢 ADMIN: ${user.email} floor set to ${floor}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Set floor error:", error);
      res.status(500).json({ error: "Failed to set floor" });
    }
  });

  // Set user battle stats
  app.post("/api/admin/set-battle-stats/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { battlesWon = 0, battlesLost = 0, streak = 0 } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const updatedUser = await storage.updateUser(userId, {
        battlesWon,
        battlesLost,
        streak,
      });
      
      console.log(`⚔️ ADMIN: ${user.email} battle stats set to W:${battlesWon} L:${battlesLost} S:${streak}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Set battle stats error:", error);
      res.status(500).json({ error: "Failed to set battle stats" });
    }
  });

  // Demote teacher to student
  app.post("/api/admin/demote-teacher/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        role: "student",
      });
      
      console.log(`⬇️ ADMIN: User ${userId} (${user.email}) demoted to student`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Demote teacher error:", error);
      res.status(500).json({ error: "Failed to demote teacher" });
    }
  });

  // Grant admin role to user
  app.post("/api/admin/grant-admin/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        role: "admin",
      });
      
      console.log(`👑 ADMIN: User ${userId} (${user.email}) granted admin role`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Grant admin error:", error);
      res.status(500).json({ error: "Failed to grant admin role" });
    }
  });

  // Revoke admin role
  app.post("/api/admin/revoke-admin/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        role: "student",
      });
      
      console.log(`⛔ ADMIN: Admin privileges revoked for ${user.email}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Revoke admin error:", error);
      res.status(500).json({ error: "Failed to revoke admin role" });
    }
  });

  // Set lectures completed
  app.post("/api/admin/set-lectures/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { lecturesCompleted = 0 } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const updatedUser = await storage.updateUser(userId, { lecturesCompleted });
      
      console.log(`📚 ADMIN: ${user.email} lectures completed set to ${lecturesCompleted}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Set lectures error:", error);
      res.status(500).json({ error: "Failed to set lectures" });
    }
  });

  // Reset user progress (clear to Level 1, Floor 1)
  app.post("/api/admin/reset-progress/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const updatedUser = await storage.updateUser(userId, {
        level: 1,
        xp: 0,
        currentFloor: 1,
        battlesWon: 0,
        battlesLost: 0,
        streak: 0,
        lecturesCompleted: 0,
      });
      
      console.log(`🔄 ADMIN: ${user.email} progress completely reset`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Reset progress error:", error);
      res.status(500).json({ error: "Failed to reset progress" });
    }
  });

  // Bulk promote users to teacher
  app.post("/api/admin/bulk-promote", async (req: Request, res: Response) => {
    try {
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "Invalid user IDs" });
      }
      
      const results = [];
      for (const userId of userIds) {
        const user = await storage.getUser(userId);
        if (user) {
          const updated = await storage.updateUser(userId, { role: "teacher" });
          results.push(updated);
        }
      }
      
      console.log(`⬆️ ADMIN: Bulk promoted ${results.length} users to teacher`);
      res.json({ promotedCount: results.length, users: results });
    } catch (error) {
      console.error("Bulk promote error:", error);
      res.status(500).json({ error: "Failed to bulk promote users" });
    }
  });

  // Wipe all user data (dangerous - admin only)
  app.post("/api/admin/system/reset-all", async (req: Request, res: Response) => {
    try {
      // This is a destructive operation - be very careful
      const allUsers = await storage.getAllUsers();
      
      for (const user of allUsers) {
        if (user.role !== "admin") {
          await storage.updateUser(user.id, {
            level: 1,
            xp: 0,
            currentFloor: 1,
            battlesWon: 0,
            battlesLost: 0,
            streak: 0,
            lecturesCompleted: 0,
          });
        }
      }
      
      console.log(`🚨 ADMIN: SYSTEM RESET - All user progress cleared`);
      res.json({ message: "All user progress reset", usersAffected: allUsers.length - 1 });
    } catch (error) {
      console.error("System reset error:", error);
      res.status(500).json({ error: "Failed to reset system" });
    }
  });

  // Get detailed user info (admin view)
  app.get("/api/admin/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get user's battle history
      const battles = await storage.getUserBattles(userId);
      
      res.json({
        user,
        battleHistory: battles,
        totalBattles: battles.length,
        battleStats: {
          wins: user.battlesWon || 0,
          losses: user.battlesLost || 0,
          winRate: user.battlesWon + user.battlesLost > 0 
            ? Math.round((user.battlesWon / (user.battlesWon + user.battlesLost)) * 100) 
            : 0,
          streak: user.streak || 0,
        },
      });
    } catch (error) {
      console.error("Get user details error:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });

  // ===== END POWER CONTROLS =====

  // ============ WEBSOCKET SERVER FOR BATTLES ============
  
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    let odId = "";

    ws.on("message", async (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "join":
            // User joins with their ID
            odId = message.odId;
            battleConnections.set(odId, { ws, odId });
            ws.send(JSON.stringify({ type: "joined", odId }));
            break;

          case "find_match":
            // Find or create a match
            const { floor } = message;
            
            // Join matchmaking queue
            await storage.joinMatchmaking({ userId: odId, floor });
            
            // Look for an opponent
            const opponent = await storage.findMatch(odId, floor);
            
            if (opponent) {
              // Match found - create battle
              await storage.leaveMatchmaking(opponent.userId);
              await storage.leaveMatchmaking(odId);
              
              // Get questions for battle (from floor lectures)
              const floorLectures = await storage.getLecturesForFloor(floor);
              let allQuestions: any[] = [];
              
              for (const lecture of floorLectures) {
                const questions = await storage.getQuestionsForLecture(lecture.id);
                allQuestions = [...allQuestions, ...questions];
              }
              
              // Shuffle and pick 5 questions
              const battleQuestions = allQuestions
                .sort(() => Math.random() - 0.5)
                .slice(0, 5);
              
              // Create battle record
              const battle = await storage.createBattle({
                floor,
                player1Id: odId,
                player2Id: opponent.userId,
                player1Score: 0,
                player2Score: 0,
                status: "active",
                xpReward: 200,
              });
              
              // Store battle state
              activeBattles.set(battle.id, {
                player1Id: odId,
                player2Id: opponent.userId,
                player1Score: 0,
                player2Score: 0,
                currentQuestion: 0,
                questions: battleQuestions,
                status: "active",
              });
              
              // Get opponent user info
              const player1 = await storage.getUser(odId);
              const player2 = await storage.getUser(opponent.userId);
              
              // Notify both players
              const matchData = {
                type: "match_found",
                battleId: battle.id,
                player1: { id: odId, displayName: player1?.displayName, level: player1?.level },
                player2: { id: opponent.userId, displayName: player2?.displayName, level: player2?.level },
                totalQuestions: battleQuestions.length,
              };
              
              const opponentConnection = battleConnections.get(opponent.userId);
              if (opponentConnection) {
                opponentConnection.ws.send(JSON.stringify(matchData));
                opponentConnection.battleId = battle.id;
              }
              
              ws.send(JSON.stringify(matchData));
              battleConnections.set(odId, { ws, odId, battleId: battle.id });
              
              // Send first question after brief delay
              setTimeout(() => {
                const firstQuestion = battleQuestions[0];
                const questionData = {
                  type: "question",
                  questionIndex: 0,
                  question: firstQuestion.question,
                  options: firstQuestion.options,
                  timeLimit: firstQuestion.timeLimit,
                };
                
                ws.send(JSON.stringify(questionData));
                if (opponentConnection) {
                  opponentConnection.ws.send(JSON.stringify(questionData));
                }
              }, 3000);
            } else {
              // No opponent found, waiting in queue
              ws.send(JSON.stringify({ type: "waiting", message: "Searching for opponent..." }));
            }
            break;

          case "answer":
            // Player submits an answer
            const { battleId, questionIndex, answer, timeRemaining } = message;
            const battle = activeBattles.get(battleId);
            
            if (!battle) {
              ws.send(JSON.stringify({ type: "error", message: "Battle not found" }));
              break;
            }
            
            const question = battle.questions[questionIndex];
            const isCorrect = answer === question.correctAnswer;
            const points = isCorrect ? Math.max(10, timeRemaining) : 0;
            
            // Update score
            if (odId === battle.player1Id) {
              battle.player1Score += points;
            } else {
              battle.player2Score += points;
            }
            
            // Send result to player
            ws.send(JSON.stringify({
              type: "answer_result",
              correct: isCorrect,
              correctAnswer: question.correctAnswer,
              pointsEarned: points,
              yourScore: odId === battle.player1Id ? battle.player1Score : battle.player2Score,
              opponentScore: odId === battle.player1Id ? battle.player2Score : battle.player1Score,
            }));
            
            // Check if all questions answered
            if (questionIndex >= battle.questions.length - 1) {
              // Battle complete
              battle.status = "completed";
              
              const winnerId = battle.player1Score > battle.player2Score 
                ? battle.player1Id 
                : battle.player2Score > battle.player1Score 
                  ? battle.player2Id 
                  : null;
              
              // Update battle record
              await storage.updateBattle(battleId, {
                player1Score: battle.player1Score,
                player2Score: battle.player2Score,
                winnerId: winnerId,
                status: "completed",
                completedAt: new Date(),
              });
              
              // Update user stats
              if (winnerId) {
                const winner = await storage.getUser(winnerId);
                const loserId = winnerId === battle.player1Id ? battle.player2Id : battle.player1Id;
                const loser = await storage.getUser(loserId);
                
                if (winner) {
                  await storage.updateUser(winnerId, {
                    battlesWon: (winner.battlesWon || 0) + 1,
                    xp: (winner.xp || 0) + 200,
                  });
                }
                if (loser) {
                  await storage.updateUser(loserId, {
                    battlesLost: (loser.battlesLost || 0) + 1,
                    xp: (loser.xp || 0) + 50, // Consolation XP
                  });
                }
              }
              
              // Notify both players
              const battleResult = {
                type: "battle_complete",
                winnerId,
                player1Score: battle.player1Score,
                player2Score: battle.player2Score,
                xpEarned: winnerId === odId ? 200 : 50,
              };
              
              ws.send(JSON.stringify(battleResult));
              
              const opponentConn = odId === battle.player1Id 
                ? battleConnections.get(battle.player2Id) 
                : battleConnections.get(battle.player1Id);
              if (opponentConn) {
                opponentConn.ws.send(JSON.stringify(battleResult));
              }
              
              // Cleanup
              activeBattles.delete(battleId);
            } else {
              // Send next question after delay
              setTimeout(() => {
                const nextQ = battle.questions[questionIndex + 1];
                battle.currentQuestion = questionIndex + 1;
                
                const questionData = {
                  type: "question",
                  questionIndex: questionIndex + 1,
                  question: nextQ.question,
                  options: nextQ.options,
                  timeLimit: nextQ.timeLimit,
                };
                
                // Send to both players
                const p1Conn = battleConnections.get(battle.player1Id);
                const p2Conn = battleConnections.get(battle.player2Id);
                
                if (p1Conn) p1Conn.ws.send(JSON.stringify(questionData));
                if (p2Conn) p2Conn.ws.send(JSON.stringify(questionData));
              }, 2000);
            }
            break;

          case "leave_queue":
            await storage.leaveMatchmaking(odId);
            ws.send(JSON.stringify({ type: "left_queue" }));
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", message: "An error occurred" }));
      }
    });

    ws.on("close", async () => {
      if (odId) {
        await storage.leaveMatchmaking(odId);
        battleConnections.delete(odId);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return httpServer;
}
