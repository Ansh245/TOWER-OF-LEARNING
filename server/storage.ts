import { 
  users, lectures, quizQuestions, userProgress, battles, matchmakingQueue,
  type User, type InsertUser, 
  type Lecture, type InsertLecture,
  type QuizQuestion, type InsertQuizQuestion,
  type UserProgress, type InsertUserProgress,
  type Battle, type InsertBattle,
  type MatchmakingEntry, type InsertMatchmakingEntry,
  calculateLevel
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllStudents(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  getLeaderboard(limit?: number): Promise<User[]>;
  
  // Lectures
  getLecture(id: string): Promise<Lecture | undefined>;
  getLectureByFloorAndOrder(floor: number, orderInFloor: number): Promise<Lecture | undefined>;
  getLecturesForFloor(floor: number): Promise<Lecture[]>;
  createLecture(lecture: InsertLecture): Promise<Lecture>;
  
  // Quiz Questions
  getQuestionsForLecture(lectureId: string): Promise<QuizQuestion[]>;
  getAllQuestions(): Promise<QuizQuestion[]>;
  getQuestion(id: string): Promise<QuizQuestion | undefined>;
  createQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuestion(id: string, updates: Partial<QuizQuestion>): Promise<QuizQuestion | undefined>;
  deleteQuestion(id: string): Promise<void>;
  
  // User Progress
  getUserProgress(userId: string, lectureId: string): Promise<UserProgress | undefined>;
  getUserProgressForFloor(userId: string, floor: number): Promise<UserProgress[]>;
  createProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateProgress(id: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined>;
  
  // Battles
  getBattle(id: string): Promise<Battle | undefined>;
  getUserBattles(userId: string): Promise<Battle[]>;
  createBattle(battle: InsertBattle): Promise<Battle>;
  updateBattle(id: string, updates: Partial<Battle>): Promise<Battle | undefined>;
  
  // Matchmaking
  joinMatchmaking(entry: InsertMatchmakingEntry): Promise<MatchmakingEntry>;
  findMatch(userId: string, floor: number): Promise<MatchmakingEntry | undefined>;
  leaveMatchmaking(userId: string): Promise<void>;
  
  // Seed Data
  seedInitialData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    // Calculate new level if XP is being updated
    if (updates.xp !== undefined) {
      console.log(`📈 Updating XP for user ${id}: ${updates.xp}`);
      const newLevel = calculateLevel(updates.xp);
      console.log(`📊 calculateLevel(${updates.xp}) = ${newLevel}`);
      updates.level = newLevel;
    }
    
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (user) {
      console.log(`✅ User ${id} updated: level=${user.level}, xp=${user.xp}`);
    }
    return user || undefined;
  }

  async getAllStudents(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "student")).orderBy(desc(users.currentFloor));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.currentFloor), desc(users.xp));
  }

  async deleteUser(id: string): Promise<void> {
    // Delete user progress first
    await db.delete(userProgress).where(eq(userProgress.userId, id));
    // Delete user battles
    await db.delete(battles).where(eq(battles.player1Id, id));
    await db.delete(battles).where(eq(battles.player2Id, id));
    // Delete from matchmaking queue
    await db.delete(matchmakingQueue).where(eq(matchmakingQueue.userId, id));
    // Delete user
    await db.delete(users).where(eq(users.id, id));
  }

  async resetUserProgress(id: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({
        currentFloor: 1,
        xp: 0,
        level: 1,
        lecturesCompleted: 0,
        streak: 0,
        battlesWon: 0,
        battlesLost: 0,
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getLeaderboard(limit: number = 100): Promise<User[]> {
    return db.select()
      .from(users)
      .where(eq(users.role, "student"))
      .orderBy(desc(users.currentFloor), desc(users.xp))
      .limit(limit);
  }

  // Lectures
  async getLecture(id: string): Promise<Lecture | undefined> {
    const [lecture] = await db.select().from(lectures).where(eq(lectures.id, id));
    return lecture || undefined;
  }

  async getLectureByFloorAndOrder(floor: number, orderInFloor: number): Promise<Lecture | undefined> {
    const [lecture] = await db.select()
      .from(lectures)
      .where(and(eq(lectures.floor, floor), eq(lectures.orderInFloor, orderInFloor)));
    return lecture || undefined;
  }

  async getLecturesForFloor(floor: number): Promise<Lecture[]> {
    return db.select()
      .from(lectures)
      .where(eq(lectures.floor, floor))
      .orderBy(asc(lectures.orderInFloor));
  }

  async createLecture(lecture: InsertLecture): Promise<Lecture> {
    const [created] = await db.insert(lectures).values(lecture).returning();
    return created;
  }

  // Quiz Questions
  async getQuestionsForLecture(lectureId: string): Promise<QuizQuestion[]> {
    return db.select()
      .from(quizQuestions)
      .where(eq(quizQuestions.lectureId, lectureId));
  }

  async createQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [created] = await db.insert(quizQuestions).values(question).returning();
    return created;
  }

  async getAllQuestions(): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions).orderBy(desc(quizQuestions.id));
  }

  async getQuestion(id: string): Promise<QuizQuestion | undefined> {
    const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, id));
    return question || undefined;
  }

  async updateQuestion(id: string, updates: Partial<QuizQuestion>): Promise<QuizQuestion | undefined> {
    const [updated] = await db.update(quizQuestions)
      .set(updates)
      .where(eq(quizQuestions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
  }

  // User Progress
  async getUserProgress(userId: string, lectureId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.lectureId, lectureId)));
    return progress || undefined;
  }

  async getUserProgressForFloor(userId: string, floor: number): Promise<UserProgress[]> {
    const floorLectures = await this.getLecturesForFloor(floor);
    const lectureIds = floorLectures.map(l => l.id);
    
    if (lectureIds.length === 0) return [];
    
    return db.select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        sql`${userProgress.lectureId} = ANY(${lectureIds})`
      ));
  }

  async createProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [created] = await db.insert(userProgress).values(progress).returning();
    return created;
  }

  async updateProgress(id: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const [updated] = await db.update(userProgress)
      .set(updates)
      .where(eq(userProgress.id, id))
      .returning();
    return updated || undefined;
  }

  // Battles
  async getBattle(id: string): Promise<Battle | undefined> {
    const [battle] = await db.select().from(battles).where(eq(battles.id, id));
    return battle || undefined;
  }

  async getUserBattles(userId: string): Promise<Battle[]> {
    return db.select()
      .from(battles)
      .where(sql`${battles.player1Id} = ${userId} OR ${battles.player2Id} = ${userId}`)
      .orderBy(desc(battles.createdAt));
  }

  async createBattle(battle: InsertBattle): Promise<Battle> {
    const [created] = await db.insert(battles).values(battle).returning();
    return created;
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<Battle | undefined> {
    const [updated] = await db.update(battles)
      .set(updates)
      .where(eq(battles.id, id))
      .returning();
    return updated || undefined;
  }

  // Matchmaking
  async joinMatchmaking(entry: InsertMatchmakingEntry): Promise<MatchmakingEntry> {
    // Remove existing entries for this user first
    await this.leaveMatchmaking(entry.userId);
    const [created] = await db.insert(matchmakingQueue).values(entry).returning();
    return created;
  }

  async findMatch(userId: string, floor: number): Promise<MatchmakingEntry | undefined> {
    const [match] = await db.select()
      .from(matchmakingQueue)
      .where(and(
        eq(matchmakingQueue.floor, floor),
        sql`${matchmakingQueue.userId} != ${userId}`
      ))
      .orderBy(asc(matchmakingQueue.joinedAt))
      .limit(1);
    return match || undefined;
  }

  async leaveMatchmaking(userId: string): Promise<void> {
    await db.delete(matchmakingQueue).where(eq(matchmakingQueue.userId, userId));
  }

  // Seed initial data
  async seedInitialData(): Promise<void> {
    // Check if lectures exist
    const [userCount] = await db.select({ count: count() }).from(users);
    if (userCount.count > 0) {
      console.log("Data already seeded.");
      return;
    }

    // Comprehensive lecture curriculum - 10 floors × 10 lectures
    const sampleLectures = this.generateComprehensiveCurriculum();

    // Insert lectures
    for (const lecture of sampleLectures) {
      const [created] = await db.insert(lectures).values(lecture).returning();
      
      // Add quiz questions for each lecture
      const questions = this.generateQuestionsForLecture(created.id, lecture.title);
      for (const q of questions) {
        await db.insert(quizQuestions).values(q);
      }
    }
    // Seed sample students
    const sampleStudents: InsertUser[] = [
      { displayName: 'Alice', email: 'alice@example.com', role: 'student', passwordHash: await bcrypt.hash('password', 10), level: 5, xp: 450, currentFloor: 2, battlesWon: 3, battlesLost: 1, lecturesCompleted: 15 },
      { displayName: 'Bob', email: 'bob@example.com', role: 'student', passwordHash: await bcrypt.hash('password', 10), level: 3, xp: 250, currentFloor: 1, battlesWon: 1, battlesLost: 2, lecturesCompleted: 8 },
      { displayName: 'Charlie', email: 'charlie@example.com', role: 'student', passwordHash: await bcrypt.hash('password', 10), level: 8, xp: 750, currentFloor: 3, battlesWon: 5, battlesLost: 0, lecturesCompleted: 25 },
      { displayName: 'David', email: 'david@example.com', role: 'student', passwordHash: await bcrypt.hash('password', 10), level: 2, xp: 150, currentFloor: 1, battlesWon: 0, battlesLost: 1, lecturesCompleted: 5 },
      { displayName: 'Eve', email: 'eve@example.com', role: 'student', passwordHash: await bcrypt.hash('password', 10), level: 10, xp: 1000, currentFloor: 4, battlesWon: 8, battlesLost: 2, lecturesCompleted: 35 },
    ];

    for (const student of sampleStudents) {
      await this.createUser(student);
    }
  }
 
  private generateComprehensiveCurriculum() {
    const curriculum: Omit<InsertLecture, 'id' | 'createdAt'>[] = [];
    
    // Floor 1: General Knowledge - History
    const floor1 = [
      { title: "Ancient Civilizations", content: "Explore the rise and fall of Egypt, Mesopotamia, and the Indus Valley. Understand early human societies.", videoUrl: "https://www.youtube.com/embed/V-j9L3eYVn8", difficulty: "easy" as const, xp: 50 },
      { title: "Classical World", content: "Learn about Greece, Rome, and the foundations of Western civilization.", videoUrl: "https://www.youtube.com/embed/h0qI41ECAY8", difficulty: "easy" as const, xp: 50 },
      { title: "Medieval Period", content: "Discover the Middle Ages in Europe, the Islamic Golden Age, and Asian kingdoms.", videoUrl: "https://www.youtube.com/embed/JlVjRKqCx0Y", difficulty: "easy" as const, xp: 50 },
      { title: "Age of Exploration", content: "Understand global exploration, trade routes, and early colonization.", videoUrl: "https://www.youtube.com/embed/Y4gWr8VvN7s", difficulty: "easy" as const, xp: 50 },
      { title: "Industrial Revolution", content: "Learn how technology and society transformed in the 18th-19th centuries.", videoUrl: "https://www.youtube.com/embed/zhL5XQ56M2E", difficulty: "easy" as const, xp: 50 },
      { title: "Modern History Part 1", content: "Explore World Wars, revolutions, and 20th-century transformations.", videoUrl: "https://www.youtube.com/embed/pVqnqKhWY9c", difficulty: "easy" as const, xp: 60 },
      { title: "Modern History Part 2", content: "Understand Cold War, decolonization, and contemporary global events.", videoUrl: "https://www.youtube.com/embed/3MZECnVlXmA", difficulty: "easy" as const, xp: 60 },
      { title: "Cultural Movements", content: "Study Renaissance, Enlightenment, and artistic movements throughout history.", videoUrl: "https://www.youtube.com/embed/lkB6bC7fMKs", difficulty: "easy" as const, xp: 60 },
      { title: "Historical Figures", content: "Learn about influential leaders, philosophers, and innovators who shaped our world.", videoUrl: "https://www.youtube.com/embed/Nj3K1XHTCPQ", difficulty: "easy" as const, xp: 60 },
      { title: "History Mastery", content: "Integrate historical knowledge and understand cause-and-effect relationships.", videoUrl: "https://www.youtube.com/embed/YKRoSiI0TgE", difficulty: "medium" as const, xp: 75 },
    ];

    // Floor 2: Science & Nature
    const floor2 = [
      { title: "Physics Basics", content: "Understand motion, forces, energy, and fundamental laws of nature.", videoUrl: "https://www.youtube.com/embed/ZA8nrSensua", difficulty: "medium" as const, xp: 75 },
      { title: "Chemistry Fundamentals", content: "Learn about atoms, elements, compounds, and chemical reactions.", videoUrl: "https://www.youtube.com/embed/h8kyKDJFkQ8", difficulty: "medium" as const, xp: 75 },
      { title: "Biology Essentials", content: "Explore cells, genetics, evolution, and life processes.", videoUrl: "https://www.youtube.com/embed/nV7eFkKVOGU", difficulty: "medium" as const, xp: 75 },
      { title: "Human Anatomy", content: "Study the human body systems: skeletal, circulatory, nervous, and more.", videoUrl: "https://www.youtube.com/embed/FnY-HK9DYDA", difficulty: "medium" as const, xp: 75 },
      { title: "Ecology & Environment", content: "Understand ecosystems, biodiversity, climate, and environmental challenges.", videoUrl: "https://www.youtube.com/embed/C6l4wIR5t04", difficulty: "medium" as const, xp: 75 },
      { title: "Astronomy", content: "Explore the universe, stars, planets, galaxies, and space exploration.", videoUrl: "https://www.youtube.com/embed/MKe-7zBT3_I", difficulty: "medium" as const, xp: 75 },
      { title: "Earth Sciences", content: "Learn about geology, weather systems, plate tectonics, and natural disasters.", videoUrl: "https://www.youtube.com/embed/iCvmsMzlF70", difficulty: "medium" as const, xp: 85 },
      { title: "Modern Physics", content: "Understand quantum mechanics, relativity, and contemporary physics.", videoUrl: "https://www.youtube.com/embed/JQVcPRbYfEA", difficulty: "medium" as const, xp: 85 },
      { title: "Biotechnology", content: "Explore genetic engineering, medicine, and biological applications.", videoUrl: "https://www.youtube.com/embed/6tUGrxvIAXs", difficulty: "medium" as const, xp: 85 },
      { title: "Science Mastery", content: "Integrate scientific knowledge and understand interdisciplinary connections.", videoUrl: "https://www.youtube.com/embed/X8A8QJkEAeQ", difficulty: "hard" as const, xp: 100 },
    ];

    // Floor 3: Geography & Culture
    const floor3 = [
      { title: "World Geography", content: "Study continents, countries, landforms, and geographic features.", videoUrl: "https://www.youtube.com/embed/O5beDiYou_s", difficulty: "medium" as const, xp: 75 },
      { title: "Population & Demographics", content: "Understand human population distribution, migration, and demographics.", videoUrl: "https://www.youtube.com/embed/oaJ_BzVKHt4", difficulty: "medium" as const, xp: 75 },
      { title: "World Religions", content: "Explore major religions: Christianity, Islam, Buddhism, Hinduism, Judaism.", videoUrl: "https://www.youtube.com/embed/l4qn1uLbU-Q", difficulty: "medium" as const, xp: 75 },
      { title: "Global Cultures", content: "Learn about diverse cultures, traditions, customs, and social practices worldwide.", videoUrl: "https://www.youtube.com/embed/gp9YfRj9_Jc", difficulty: "medium" as const, xp: 75 },
      { title: "Political Systems", content: "Understand democracy, autocracy, monarchy, and different governmental structures.", videoUrl: "https://www.youtube.com/embed/NKVsVJBhYr0", difficulty: "medium" as const, xp: 75 },
      { title: "Economics Basics", content: "Learn supply-demand, markets, trade, and economic systems.", videoUrl: "https://www.youtube.com/embed/3ez10ADR64A", difficulty: "hard" as const, xp: 100 },
      { title: "Global Politics", content: "Explore international relations, organizations, and geopolitical conflicts.", videoUrl: "https://www.youtube.com/embed/4ug3zheIXQU", difficulty: "hard" as const, xp: 100 },
      { title: "Languages & Communication", content: "Understand language families, linguistic diversity, and translation.", videoUrl: "https://www.youtube.com/embed/wODjR0pYWh8", difficulty: "hard" as const, xp: 100 },
      { title: "Urban & Rural Development", content: "Learn about urbanization, city planning, and rural community structures.", videoUrl: "https://www.youtube.com/embed/DZ-EPmLfF80", difficulty: "hard" as const, xp: 100 },
      { title: "Geography Mastery", content: "Integrate geographic knowledge with culture, politics, and environment.", videoUrl: "https://www.youtube.com/embed/FqxR_V7oKWc", difficulty: "hard" as const, xp: 125 },
    ];

    // Floor 4: Technology & Innovation
    const floor4 = [
      { title: "Technology History", content: "Trace technological innovations from antiquity to the digital age.", videoUrl: "https://www.youtube.com/embed/lh3ZeHvJkdU", difficulty: "hard" as const, xp: 100 },
      { title: "Computing Pioneers", content: "Learn about inventors and pioneers in computing and information technology.", videoUrl: "https://www.youtube.com/embed/ZDjTHALVc5s", difficulty: "hard" as const, xp: 100 },
      { title: "Internet & Communications", content: "Understand the history and impact of the internet and digital communication.", videoUrl: "https://www.youtube.com/embed/9hIQjrMHTv4", difficulty: "hard" as const, xp: 100 },
      { title: "Artificial Intelligence", content: "Explore AI history, machine learning, and future implications.", videoUrl: "https://www.youtube.com/embed/BRzjs44z7ro", difficulty: "hard" as const, xp: 100 },
      { title: "Biotechnology & Medicine", content: "Learn about medical innovations, vaccines, and healthcare technology.", videoUrl: "https://www.youtube.com/embed/VRe33CE8gak", difficulty: "hard" as const, xp: 125 },
      { title: "Energy & Sustainability", content: "Understand renewable energy, fossil fuels, and sustainable technology.", videoUrl: "https://www.youtube.com/embed/KuYHjSHEd-U", difficulty: "hard" as const, xp: 125 },
      { title: "Space Technology", content: "Explore space exploration, satellites, and future space missions.", videoUrl: "https://www.youtube.com/embed/YN0FGJ4pD7g", difficulty: "hard" as const, xp: 125 },
      { title: "Nanotechnology", content: "Learn about nano-scale science and its applications in various fields.", videoUrl: "https://www.youtube.com/embed/J_A0tU-jm-A", difficulty: "hard" as const, xp: 125 },
      { title: "Cybersecurity", content: "Understand digital security, privacy, and cyber threats.", videoUrl: "https://www.youtube.com/embed/S0jU-8awKO0", difficulty: "hard" as const, xp: 150 },
      { title: "Tech Mastery", content: "Integrate technological knowledge with societal impact and ethics.", videoUrl: "https://www.youtube.com/embed/YXlJBJr1WJc", difficulty: "hard" as const, xp: 150 },
    ];

    // Floor 5: Literature & Arts
    const floor5 = [
      { title: "World Literature", content: "Explore classic and contemporary literature from around the globe.", videoUrl: "https://www.youtube.com/embed/pqYOKnDKB0s", difficulty: "hard" as const, xp: 100 },
      { title: "Poetry & Verse", content: "Understand poetry forms, famous poets, and poetic techniques.", videoUrl: "https://www.youtube.com/embed/5hJ3IgQGIHg", difficulty: "hard" as const, xp: 125 },
      { title: "Drama & Theater", content: "Learn about plays, dramatic theory, and theatrical traditions.", videoUrl: "https://www.youtube.com/embed/8tZdLvPhNFk", difficulty: "hard" as const, xp: 125 },
      { title: "Visual Arts", content: "Study painting, sculpture, photography, and visual artistic movements.", videoUrl: "https://www.youtube.com/embed/O67nMrWMNHE", difficulty: "hard" as const, xp: 150 },
      { title: "Music History", content: "Explore music genres, composers, instruments, and musical evolution.", videoUrl: "https://www.youtube.com/embed/zTdF_Yd-pT4", difficulty: "hard" as const, xp: 150 },
      { title: "Film & Cinema", content: "Learn about cinema history, filmmaking techniques, and film analysis.", videoUrl: "https://www.youtube.com/embed/K5le9sVp85c", difficulty: "hard" as const, xp: 150 },
      { title: "Architecture", content: "Understand architectural styles, famous buildings, and design principles.", videoUrl: "https://www.youtube.com/embed/P7-g3aY5p5s", difficulty: "hard" as const, xp: 175 },
      { title: "Contemporary Art", content: "Explore modern and contemporary art movements and artists.", videoUrl: "https://www.youtube.com/embed/a2BqOvLtYLw", difficulty: "hard" as const, xp: 175 },
      { title: "Digital Media & Design", content: "Learn about graphic design, animation, and digital art forms.", videoUrl: "https://www.youtube.com/embed/pFZDxMSXYNg", difficulty: "hard" as const, xp: 175 },
      { title: "Arts Mastery", content: "Integrate artistic knowledge with cultural and historical context.", videoUrl: "https://www.youtube.com/embed/TsZGNi2j0xc", difficulty: "hard" as const, xp: 200 },
    ];

    // Floor 6: Philosophy & Ethics
    const floor6 = [
      { title: "Ancient Philosophy", content: "Study Socrates, Plato, Aristotle, and pre-Socratic philosophers.", videoUrl: "https://www.youtube.com/embed/D25pHJjBDLg", difficulty: "hard" as const, xp: 125 },
      { title: "Eastern Philosophy", content: "Explore Confucianism, Taoism, Buddhism, and Indian philosophical traditions.", videoUrl: "https://www.youtube.com/embed/JOWf6P32RTY", difficulty: "hard" as const, xp: 125 },
      { title: "Medieval & Modern Philosophy", content: "Learn about thinkers from Renaissance through Enlightenment.", videoUrl: "https://www.youtube.com/embed/Y9PsKpjMfV0", difficulty: "hard" as const, xp: 125 },
      { title: "19th-20th Century Thought", content: "Study Kant, Hegel, Marx, Nietzsche, and existentialist philosophers.", videoUrl: "https://www.youtube.com/embed/RZu1t3FwQBo", difficulty: "hard" as const, xp: 125 },
      { title: "Ethics & Morality", content: "Understand ethical systems, moral philosophy, and practical ethics.", videoUrl: "https://www.youtube.com/embed/6Z8JKxOrUW0", difficulty: "hard" as const, xp: 150 },
      { title: "Logic & Reasoning", content: "Learn formal logic, arguments, and critical thinking skills.", videoUrl: "https://www.youtube.com/embed/dC_86CQ6vxo", difficulty: "hard" as const, xp: 150 },
      { title: "Metaphysics", content: "Explore the nature of reality, existence, and fundamental being.", videoUrl: "https://www.youtube.com/embed/5bN6PbMGrKE", difficulty: "hard" as const, xp: 150 },
      { title: "Epistemology", content: "Understand knowledge, truth, belief, and how we know things.", videoUrl: "https://www.youtube.com/embed/wEpCwH_gL_s", difficulty: "hard" as const, xp: 175 },
      { title: "Applied Ethics", content: "Explore bioethics, environmental ethics, and contemporary ethical issues.", videoUrl: "https://www.youtube.com/embed/W7l0mfLuMxs", difficulty: "hard" as const, xp: 175 },
      { title: "Philosophy Mastery", content: "Integrate philosophical thinking into worldview and decision-making.", videoUrl: "https://www.youtube.com/embed/grgmVeL4yAI", difficulty: "hard" as const, xp: 200 },
    ];

    // Floor 7: Mathematics & Logic
    const floor7 = [
      { title: "Number Systems", content: "Understand integers, rationals, reals, and number theory basics.", videoUrl: "https://www.youtube.com/embed/c-HWUUhcj-Y", difficulty: "medium" as const, xp: 75 },
      { title: "Algebra", content: "Learn equations, polynomials, factoring, and algebraic manipulation.", videoUrl: "https://www.youtube.com/embed/NybHckSEQBI", difficulty: "medium" as const, xp: 75 },
      { title: "Geometry", content: "Explore shapes, angles, proofs, and spatial relationships.", videoUrl: "https://www.youtube.com/embed/agxvgVaHGRo", difficulty: "medium" as const, xp: 100 },
      { title: "Trigonometry", content: "Understand angles, sine, cosine, tangent, and trigonometric functions.", videoUrl: "https://www.youtube.com/embed/g3aVvqsPqKo", difficulty: "hard" as const, xp: 125 },
      { title: "Calculus Basics", content: "Learn limits, derivatives, and integrals in calculus.", videoUrl: "https://www.youtube.com/embed/WUvTyaaNkzM", difficulty: "hard" as const, xp: 125 },
      { title: "Statistics & Probability", content: "Understand data analysis, distributions, and probabilistic thinking.", videoUrl: "https://www.youtube.com/embed/R-7M0tC_i-A", difficulty: "hard" as const, xp: 125 },
      { title: "Linear Algebra", content: "Explore matrices, vectors, and linear transformations.", videoUrl: "https://www.youtube.com/embed/fNk_zzpj3Zo", difficulty: "hard" as const, xp: 150 },
      { title: "Complex Mathematics", content: "Learn abstract algebra, group theory, and advanced topics.", videoUrl: "https://www.youtube.com/embed/x_n34Yt5Z58", difficulty: "hard" as const, xp: 150 },
      { title: "Mathematical Applications", content: "See how mathematics applies to physics, engineering, and economics.", videoUrl: "https://www.youtube.com/embed/i6AZs_uV3bI", difficulty: "hard" as const, xp: 150 },
      { title: "Math Mastery", content: "Master mathematical thinking and problem-solving.", videoUrl: "https://www.youtube.com/embed/1rRMT_G6S5o", difficulty: "hard" as const, xp: 200 },
    ];

    // Floor 8: Psychology & Human Behavior
    const floor8 = [
      { title: "Psychology Foundations", content: "Learn the history and major perspectives in psychology.", videoUrl: "https://www.youtube.com/embed/xsppYgCJSqc", difficulty: "hard" as const, xp: 125 },
      { title: "Cognitive Psychology", content: "Understand perception, memory, thinking, and problem-solving.", videoUrl: "https://www.youtube.com/embed/2toOXAbQoQw", difficulty: "hard" as const, xp: 125 },
      { title: "Developmental Psychology", content: "Explore human development from infancy through adulthood.", videoUrl: "https://www.youtube.com/embed/KO6nPbKo1HU", difficulty: "hard" as const, xp: 150 },
      { title: "Social Psychology", content: "Learn about group behavior, attitudes, persuasion, and social influence.", videoUrl: "https://www.youtube.com/embed/SJVqN5oi6nQ", difficulty: "hard" as const, xp: 150 },
      { title: "Personality Theories", content: "Understand different personality frameworks and assessment.", videoUrl: "https://www.youtube.com/embed/4y9V7DX_pnc", difficulty: "hard" as const, xp: 150 },
      { title: "Mental Health", content: "Learn about disorders, therapy, treatment, and mental wellness.", videoUrl: "https://www.youtube.com/embed/lGGl8x0Qgbw", difficulty: "hard" as const, xp: 150 },
      { title: "Motivation & Emotion", content: "Explore drives, emotions, stress, and human motivation.", videoUrl: "https://www.youtube.com/embed/6O0tARWiMhc", difficulty: "hard" as const, xp: 175 },
      { title: "Learning & Conditioning", content: "Understand classical conditioning, operant conditioning, and learning.", videoUrl: "https://www.youtube.com/embed/FJ-d2Sj4GBQ", difficulty: "hard" as const, xp: 175 },
      { title: "Applied Psychology", content: "Learn about psychology in workplace, education, and clinical settings.", videoUrl: "https://www.youtube.com/embed/nYkOLxEYSVw", difficulty: "hard" as const, xp: 175 },
      { title: "Psychology Mastery", content: "Integrate psychological knowledge to understand human behavior.", videoUrl: "https://www.youtube.com/embed/Rf-kMvyOBLo", difficulty: "hard" as const, xp: 200 },
    ];

    // Floor 9: Society & Social Issues
    const floor9 = [
      { title: "Sociology Basics", content: "Understand society, social structures, and institutions.", videoUrl: "https://www.youtube.com/embed/O1e3H0aT6dU", difficulty: "hard" as const, xp: 150 },
      { title: "Social Inequality", content: "Explore poverty, class, race, gender, and intersectionality.", videoUrl: "https://www.youtube.com/embed/h8HKUAE0j2w", difficulty: "hard" as const, xp: 150 },
      { title: "Education Systems", content: "Learn about education worldwide, pedagogy, and learning systems.", videoUrl: "https://www.youtube.com/embed/GCNUxRXhLrw", difficulty: "hard" as const, xp: 150 },
      { title: "Criminal Justice", content: "Understand law, criminal systems, punishment, and rehabilitation.", videoUrl: "https://www.youtube.com/embed/G0m1cT6PJx8", difficulty: "hard" as const, xp: 175 },
      { title: "Human Rights", content: "Explore fundamental rights, international law, and social justice.", videoUrl: "https://www.youtube.com/embed/JlWhNQRWfvQ", difficulty: "hard" as const, xp: 175 },
      { title: "Health & Healthcare", content: "Learn about public health, medical systems, and wellness.", videoUrl: "https://www.youtube.com/embed/GXMlsacMKDE", difficulty: "hard" as const, xp: 175 },
      { title: "Sociology of Work", content: "Understand labor, employment, entrepreneurship, and career.", videoUrl: "https://www.youtube.com/embed/vNKwMlKTKhI", difficulty: "hard" as const, xp: 200 },
      { title: "Environmental Issues", content: "Explore climate change, pollution, conservation, and sustainability.", videoUrl: "https://www.youtube.com/embed/bZCNKT4UuJg", difficulty: "hard" as const, xp: 200 },
      { title: "Global Development", content: "Understand poverty reduction, development, and international cooperation.", videoUrl: "https://www.youtube.com/embed/Io5eOAVfIe4", difficulty: "hard" as const, xp: 200 },
      { title: "Society Mastery", content: "Integrate social knowledge to understand contemporary issues.", videoUrl: "https://www.youtube.com/embed/YZ8Md-VrGiQ", difficulty: "hard" as const, xp: 250 },
    ];

    // Floor 10: Wisdom & Integration
    const floor10 = [
      { title: "Comparative Traditions", content: "Compare wisdom traditions across cultures and religions.", videoUrl: "https://www.youtube.com/embed/YRf8HF-_nEY", difficulty: "hard" as const, xp: 175 },
      { title: "Well-being & Happiness", content: "Learn about quality of life, happiness, and human flourishing.", videoUrl: "https://www.youtube.com/embed/_7cJz51B_J8", difficulty: "hard" as const, xp: 175 },
      { title: "Leadership & Influence", content: "Understand leadership styles, influence, and effective communication.", videoUrl: "https://www.youtube.com/embed/wBbhLpkT4R8", difficulty: "hard" as const, xp: 200 },
      { title: "Creativity & Innovation", content: "Explore creative thinking, innovation, and problem-solving.", videoUrl: "https://www.youtube.com/embed/xfBioPV9YkE", difficulty: "hard" as const, xp: 200 },
      { title: "Decision Making", content: "Learn about rationality, bias, risk, and strategic thinking.", videoUrl: "https://www.youtube.com/embed/uGGLXrLdXmQ", difficulty: "hard" as const, xp: 200 },
      { title: "Systems Thinking", content: "Understand complex systems, emergence, and interconnectedness.", videoUrl: "https://www.youtube.com/embed/kkS9qINGT5c", difficulty: "hard" as const, xp: 200 },
      { title: "Future Studies", content: "Explore future trends, scenarios, and speculative thinking.", videoUrl: "https://www.youtube.com/embed/KHrJKg9_1hg", difficulty: "hard" as const, xp: 225 },
      { title: "Global Challenges", content: "Understand existential risks and humanity's grand challenges.", videoUrl: "https://www.youtube.com/embed/V4K1PbP4JGc", difficulty: "hard" as const, xp: 225 },
      { title: "Personal Growth", content: "Learn about self-improvement, resilience, and life purpose.", videoUrl: "https://www.youtube.com/embed/l_zrweP-XAk", difficulty: "hard" as const, xp: 250 },
      { title: "Master of Knowledge", content: "Integrate all knowledge into comprehensive wisdom.", videoUrl: "https://www.youtube.com/embed/GWKWB4GnvVA", difficulty: "hard" as const, xp: 300 },
    ];

    const allFloors = [floor1, floor2, floor3, floor4, floor5, floor6, floor7, floor8, floor9, floor10];
    
    allFloors.forEach((floorLectures, floorIndex) => {
      const floor = floorIndex + 1;
      floorLectures.forEach((lecture, orderIndex) => {
        curriculum.push({
          floor,
          orderInFloor: orderIndex + 1,
          title: lecture.title,
          content: `<p>${lecture.content}</p><p><strong>Key Concepts:</strong></p><ul><li>Understand the core ideas</li><li>Learn practical applications</li><li>Connect to broader knowledge</li></ul>`,
          videoUrl: (lecture as any).videoUrl || null,
          difficulty: lecture.difficulty,
          xpReward: lecture.xp,
        });
      });
    });

    return curriculum;
  }

  private generateQuestionsForLecture(lectureId: string, title: string): InsertQuizQuestion[] {
    // Map of all lecture titles to their quiz questions
    const questionSets: Record<string, InsertQuizQuestion[]> = {
      // Floor 1
      "What is Programming?": [
        { lectureId, question: "What is the primary purpose of programming?", options: ["To store data", "To give instructions to computers", "To browse the internet", "To design graphics"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "Which is NOT a benefit of learning programming?", options: ["Solve problems", "Automate tasks", "Guaranteed wealth", "Create applications"], correctAnswer: 2, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "Programming is best described as:", options: ["Hardware design", "A language computers understand", "Internet browsing", "File management"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
      ],
      "Your First Program": [
        { lectureId, question: "What does 'Hello World' typically demonstrate?", options: ["Output in programming", "Memory management", "Database queries", "Networking"], correctAnswer: 0, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "Syntax refers to:", options: ["Program output", "Rules for writing code", "Data storage", "Computer hardware"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "What happens when syntax is incorrect?", options: ["Program still runs", "Compiler generates errors", "Computer crashes", "Data is lost"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
      ],
      "Variables and Types": [
        { lectureId, question: "What is a variable?", options: ["A constant value", "A container for storing data", "A type of loop", "An error message"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "Which is a Boolean value?", options: ["42", '"text"', "true", "3.14"], correctAnswer: 2, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "What data type stores text?", options: ["Number", "Boolean", "String", "Array"], correctAnswer: 2, difficulty: "easy", timeLimit: 30 },
      ],
      "Input and Output": [
        { lectureId, question: "How do you get user input in programming?", options: ["Display text", "Use input functions", "Store variables", "Create loops"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "What does output mean?", options: ["Reading data", "Displaying data", "Storing data", "Deleting data"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "User interaction is important for:", options: ["Speed", "Making programs useful", "Memory management", "Security"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
      ],
      "Operators and Math": [
        { lectureId, question: "What does + operator do?", options: ["Subtraction", "Addition", "Multiplication", "Division"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "How do you calculate 10 / 3?", options: ["3", "3.33", "30", "0.3"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "Logical operators include:", options: ["+ and -", "AND, OR, NOT", "* and /", "< and >"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
      ],
      "If Statements": [
        { lectureId, question: "If statements are used to:", options: ["Repeat code", "Make decisions", "Store data", "Delete files"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "What does == check?", options: ["Assignment", "Equality", "Greater than", "Less than"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "Conditions must evaluate to:", options: ["A number", "Text", "True or False", "An array"], correctAnswer: 2, difficulty: "easy", timeLimit: 30 },
      ],
      "Else and Else If": [
        { lectureId, question: "What does 'else' do?", options: ["Handles the if case", "Handles when if is false", "Repeats code", "Breaks loops"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "'Else if' allows:", options: ["One condition", "Two conditions", "Multiple conditions", "No conditions"], correctAnswer: 2, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "Only one block executes in if/else if/else:", options: ["True", "False", "Sometimes", "Always"], correctAnswer: 0, difficulty: "easy", timeLimit: 30 },
      ],
      "Loops: While": [
        { lectureId, question: "While loops repeat until:", options: ["A number", "Condition becomes false", "Function ends", "Program crashes"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "What can cause infinite loops?", options: ["Correct syntax", "Never-false conditions", "Few iterations", "Short code"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "Counter variables are typically used in:", options: ["Variables", "Functions", "Loops", "Arrays"], correctAnswer: 2, difficulty: "easy", timeLimit: 30 },
      ],
      "Loops: For": [
        { lectureId, question: "For loops iterate over:", options: ["Conditions", "Ranges or collections", "Variables", "Functions"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "For loop syntax includes:", options: ["Only condition", "Start, condition, increment", "Just increment", "No parameters"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
        { lectureId, question: "For loops are better than while when:", options: ["Always", "For known iterations", "Never", "Rarely"], correctAnswer: 1, difficulty: "easy", timeLimit: 30 },
      ],
      "Floor 1 Mastery": [
        { lectureId, question: "Combining multiple concepts creates:", options: ["Simple variables", "Complete programs", "Single loops", "Basic functions"], correctAnswer: 1, difficulty: "medium", timeLimit: 30 },
        { lectureId, question: "Program logic includes:", options: ["Just output", "Variables, conditions, loops", "Only functions", "No structure"], correctAnswer: 1, difficulty: "medium", timeLimit: 30 },
        { lectureId, question: "Best practice is to:", options: ["Use no comments", "Document your code", "Avoid testing", "Use vague names"], correctAnswer: 1, difficulty: "medium", timeLimit: 30 },
      ],
      // Floor 2 sample
      "Arrays Basics": [
        { lectureId, question: "What is an array?", options: ["Single value", "Ordered collection", "Function", "Loop"], correctAnswer: 1, difficulty: "medium", timeLimit: 30 },
        { lectureId, question: "Array indices start at:", options: ["1", "0", "-1", "Random"], correctAnswer: 1, difficulty: "medium", timeLimit: 30 },
        { lectureId, question: "Arrays store:", options: ["One type only", "Mixed types", "Functions only", "No data"], correctAnswer: 1, difficulty: "medium", timeLimit: 30 },
      ],
      // Add similar patterns for other lectures...
    };

    // Default questions for unlisted titles
    const baseDifficulty = title.includes("Mastery") || title.includes("Challenge") ? "hard" : title.includes("Floor") ? "medium" : "easy";
    return questionSets[title] || [
      { lectureId, question: `What is the main topic of ${title}?`, options: ["Unrelated concept", title, "Programming basics", "Theory only"], correctAnswer: 1, difficulty: baseDifficulty, timeLimit: 30 },
      { lectureId, question: `Why is ${title} important?`, options: ["It isn't", "Foundation for further learning", "Rarely used", "Outdated"], correctAnswer: 1, difficulty: baseDifficulty, timeLimit: 30 },
      { lectureId, question: `${title} helps you understand:`, options: ["Unrelated skills", "Core programming concepts", "Only theory", "Nothing practical"], correctAnswer: 1, difficulty: baseDifficulty, timeLimit: 30 },
    ];
  }
}

export const storage = new DatabaseStorage();
