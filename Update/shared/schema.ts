import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - Students and Teachers
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  firebaseUid: varchar("firebase_uid", { length: 255 }).unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  photoUrl: text("photo_url"),
  role: text("role", { enum: ["student", "admin"] }).notNull().default("student"),
  currentFloor: integer("current_floor").notNull().default(1),
  lecturesCompleted: integer("lectures_completed").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  streak: integer("streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  battlesWon: integer("battles_won").notNull().default(0),
  battlesLost: integer("battles_lost").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lectures table
export const lectures = pgTable("lectures", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  floor: integer("floor").notNull(),
  orderInFloor: integer("order_in_floor").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
  xpReward: integer("xp_reward").notNull().default(50),
});

// Quiz questions table
export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  lectureId: varchar("lecture_id", { length: 255 }).notNull().references(() => lectures.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull().$type<string[]>(),
  correctAnswer: integer("correct_answer").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
  timeLimit: integer("time_limit").notNull().default(30),
});

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  lectureId: varchar("lecture_id", { length: 255 }).notNull().references(() => lectures.id),
  completed: boolean("completed").notNull().default(false),
  quizScore: integer("quiz_score"),
  timeTaken: integer("time_taken"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }),
  completedAt: timestamp("completed_at"),
});

// Battle records
export const battles = pgTable("battles", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  floor: integer("floor").notNull(),
  player1Id: varchar("player1_id", { length: 255 }).notNull().references(() => users.id),
  player2Id: varchar("player2_id", { length: 255 }).notNull().references(() => users.id),
  winnerId: varchar("winner_id", { length: 255 }).references(() => users.id),
  player1Score: integer("player1_score").notNull().default(0),
  player2Score: integer("player2_score").notNull().default(0),
  status: text("status", { enum: ["pending", "active", "completed"] }).notNull().default("pending"),
  xpReward: integer("xp_reward").notNull().default(200),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Battle matchmaking queue
export const matchmakingQueue = pgTable("matchmaking_queue", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  floor: integer("floor").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  battlesAsPlayer1: many(battles, { relationName: "player1" }),
  battlesAsPlayer2: many(battles, { relationName: "player2" }),
}));

export const lecturesRelations = relations(lectures, ({ many }) => ({
  questions: many(quizQuestions),
  progress: many(userProgress),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  lecture: one(lectures, {
    fields: [quizQuestions.lectureId],
    references: [lectures.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  lecture: one(lectures, {
    fields: [userProgress.lectureId],
    references: [lectures.id],
  }),
}));

export const battlesRelations = relations(battles, ({ one }) => ({
  player1: one(users, {
    fields: [battles.player1Id],
    references: [users.id],
    relationName: "player1",
  }),
  player2: one(users, {
    fields: [battles.player2Id],
    references: [users.id],
    relationName: "player2",
  }),
  winner: one(users, {
    fields: [battles.winnerId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLectureSchema = createInsertSchema(lectures).omit({
  id: true,
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
});

export const insertBattleSchema = createInsertSchema(battles).omit({
  id: true,
  createdAt: true,
});

export const insertMatchmakingSchema = createInsertSchema(matchmakingQueue).omit({
  id: true,
  joinedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Lecture = typeof lectures.$inferSelect;
export type InsertLecture = z.infer<typeof insertLectureSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type Battle = typeof battles.$inferSelect;
export type InsertBattle = z.infer<typeof insertBattleSchema>;
export type MatchmakingEntry = typeof matchmakingQueue.$inferSelect;
export type InsertMatchmakingEntry = z.infer<typeof insertMatchmakingSchema>;

// Floor names for the Tower theme
export const FLOOR_NAMES: Record<number, string> = {
  1: "The First Steps",
  2: "Halls of Beginning",
  3: "Chamber of Trials",
  4: "Path of Shadows",
  5: "The Proving Grounds",
  6: "Realm of Knowledge",
  7: "Corridors of Wisdom",
  8: "The Enlightened Way",
  9: "Gates of Mastery",
  10: "The Battleground",
};

// XP required per level
export function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Calculate level from total XP
export function calculateLevel(totalXp: number): number {
  let level = 1;
  let xpRequired = 100;
  let xpAccumulated = 0;
  
  while (xpAccumulated + xpRequired <= totalXp) {
    xpAccumulated += xpRequired;
    level++;
    xpRequired = Math.floor(100 * Math.pow(1.5, level - 1));
  }
  
  return level;
}

// Get XP to next level
export function getXpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  let xpAccumulated = 0;
  
  for (let i = 1; i < currentLevel; i++) {
    xpAccumulated += Math.floor(100 * Math.pow(1.5, i - 1));
  }
  
  const nextLevelXp = xpAccumulated + Math.floor(100 * Math.pow(1.5, currentLevel - 1));
  return Math.max(0, nextLevelXp - currentXp);
}

// Adaptive difficulty based on level
export function getAdaptiveDifficulty(level: number): "easy" | "medium" | "hard" {
  if (level <= 2) return "easy";
  if (level <= 5) return "medium";
  return "hard";
}

// XP multiplier based on difficulty
export function getDifficultyMultiplier(difficulty: "easy" | "medium" | "hard"): number {
  if (difficulty === "easy") return 0.8;
  if (difficulty === "medium") return 1.0;
  return 1.5; // Hard = 1.5x XP
}
