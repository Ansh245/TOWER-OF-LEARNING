# Tower of Learning - Gamified Learning Platform

## Overview

Tower of Learning is a gamified educational platform inspired by Tower of God, combining competitive gaming aesthetics with learning management. Students progress through vertical "floors" of the tower by completing lectures and quizzes, earning XP, leveling up, and engaging in real-time knowledge battles with other students. Teachers monitor student progress through analytics dashboards.

The platform features a dark fantasy theme with dramatic visual elements, vertical progression tracking, and competitive gaming intensity for battles. The core learning loop involves: completing lectures → taking quizzes → earning XP/advancing floors → engaging in PvP battles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite for build tooling and hot module replacement during development.

**Routing**: Client-side routing via Wouter (lightweight React router), with protected routes based on authentication state and user roles (student vs admin).

**State Management**: 
- TanStack Query (React Query) for server state management and caching
- React Context for authentication state (AuthContext)
- Local state with React hooks for component-level state

**UI Component System**: Radix UI primitives with custom styling via shadcn/ui components. The design system implements a dark-only fantasy theme with:
- Typography: Cinzel (fantasy serif for headers), Inter (body text), Bebas Neue (stats/numbers)
- Custom color tokens defined in CSS variables
- Tailwind CSS for utility-first styling
- Class Variance Authority for component variants

**Key Pages**:
- Landing: Marketing/hero page for unauthenticated users
- Login: Simple email/display name authentication with role selection (student or admin)
- Dashboard (Student): XP progress, current floor, lecture access, battle matchmaking
- Lecture: Content display → quiz interface → results
- Battle: Real-time WebSocket-based PvP quiz battles
- Leaderboard: Rankings by XP, floor progress, and battle statistics
- Admin Panel: Full user management with analytics, delete users, and reset user progress

### Backend Architecture

**Framework**: Express.js (Node.js) with TypeScript

**API Pattern**: RESTful endpoints for CRUD operations, with WebSocket integration for real-time battle functionality.

**Core Routes**:
- `/api/auth/*` - User registration/login (simplified auth without actual Firebase implementation)
- `/api/progress/*` - User progress tracking and lecture completion
- `/api/lectures/*` - Lecture content and quiz questions
- `/api/leaderboard` - Student rankings and statistics
- `/api/battle/*` - Battle creation, matchmaking, and WebSocket connections
- `/api/admin/users` - Get all users for admin management
- `/api/admin/users/:id` - DELETE user or reset user progress

**WebSocket System**: Real-time bidirectional communication for PvP battles using the `ws` library. Battle state managed in-memory with Map structures tracking:
- Active WebSocket connections per user
- Battle rooms with player scores and current question state
- Matchmaking queue by floor level

**Session Management**: Users stored in localStorage on client, no actual session middleware (simplified for prototype).

### Data Storage

**Database**: PostgreSQL via Neon serverless (configured but may need provisioning)

**ORM**: Drizzle ORM for type-safe database queries and schema management

**Schema Design**:

**Users Table**: Stores student/admin accounts with progression metrics
- Authentication: email, displayName, firebaseUid (placeholder)
- Progression: currentFloor, level, xp, streak, lecturesCompleted
- Battle stats: battlesWon, battlesLost
- Role differentiation: student vs admin

**Lectures Table**: Content organized by floor and order
- Hierarchical: floor number, orderInFloor
- Content: title, content (text), imageUrl
- Rewards: xpReward, difficulty rating

**QuizQuestions Table**: Multiple choice questions linked to lectures
- Question data: question text, options array (JSONB), correctAnswer index
- Metadata: timeLimit, difficulty
- Foreign key: lectureId

**UserProgress Table**: Tracking individual lecture completion
- Completion metrics: completed flag, score, timeSpent
- Timestamps: completedAt
- Foreign keys: userId, lectureId

**Battles Table**: Record of PvP quiz battles
- Participants: player1Id, player2Id
- Outcome: winner, player scores, questions array
- Metadata: floor level, status, timestamps

**MatchmakingQueue Table**: Active matchmaking entries
- Matching criteria: userId, floor, status
- Timestamps for queue management

**Data Seeding**: Initial data populated via storage layer with sample lectures and quiz questions for multiple floors.

### External Dependencies

**Database Service**: Neon serverless PostgreSQL (connection via `@neondatabase/serverless` with WebSocket support)

**UI Component Library**: Radix UI primitives for accessible, unstyled components (dialogs, dropdowns, popovers, etc.)

**Fonts**: Google Fonts CDN for Cinzel, Inter, and Bebas Neue typography

**Build Tools**: 
- Vite for frontend bundling and dev server
- esbuild for server-side bundling in production
- Tailwind CSS + PostCSS for styling pipeline

**Validation**: Zod for schema validation (integrated with Drizzle via drizzle-zod)

**Date Handling**: date-fns for timestamp formatting and manipulation

**Real-time Communication**: Native WebSocket (ws library) for battle system

**Development Tools**: 
- Replit-specific plugins for dev banner, cartographer, and error overlay
- TypeScript for type safety across stack

**Note**: The application references Firebase authentication in requirements but implements a simplified auth system without actual Firebase integration. The backend uses local state rather than persistent sessions.

## Recent Changes (Current Session)

### Floor Progression System
- **Change**: Floor advancement now occurs after completing ANY lecture with 70%+ score instead of requiring all lectures on a floor
- **Implementation**: Simplified logic to avoid complex database counting; immediate advancement on quiz completion with passing score
- **Validation**: Floor advances from 1→2→...→10 correctly through the tower

### Admin Panel Implementation
- **Converted teacher role to admin role** throughout the system
- **Updated schema**: `role` field now uses enum `["student", "admin"]` instead of `["student", "teacher"]`
- **Admin Features**:
  - View all users with full statistics (floor, level, XP, battle record)
  - **Delete users**: Permanently remove users from the system
  - **Reset progress**: Reset individual user progress back to Floor 1 with XP = 0
- **New API Endpoints**:
  - `GET /api/admin/users` - Retrieve all users
  - `DELETE /api/admin/users/:id` - Delete user
  - `POST /api/admin/users/:id/reset` - Reset user progress
- **Frontend Updates**:
  - Updated login page to show "Admin" option instead of "Teacher"
  - New admin panel UI with user management table
  - Delete and Reset buttons for each user
  - Real-time invalidation of user list after mutations
- **Authentication**:
  - Updated auth context to accept "admin" role
  - Protected `/admin` route with admin role restriction
  - Proper role-based navigation redirects