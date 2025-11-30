# Design Guidelines: Tower of God Learning Platform

## Design Approach

**Reference-Based Approach: Tower of God + Competitive Gaming Aesthetics**

Drawing inspiration from Tower of God's dark fantasy world combined with modern competitive gaming interfaces (League of Legends, Valorant ranked systems). The design emphasizes vertical progression, epic scale, and competitive intensity while maintaining educational functionality.

**Core Principles:**
- Dramatic vertical hierarchy reflecting tower climbing
- Epic scale with grandiose visual elements
- Competitive gaming intensity for battles
- Clear progression visualization
- Mythical/fantasy atmosphere throughout

---

## Typography System

**Font Families (Google Fonts):**
- Primary: 'Cinzel' (serif, fantasy aesthetic) - for headers, floor titles, dramatic announcements
- Secondary: 'Inter' (sans-serif) - for body text, UI elements, readable content
- Accent: 'Bebas Neue' - for stats, XP counters, level indicators

**Hierarchy:**
- Hero Titles: Cinzel, 4xl-6xl, font-bold
- Floor Headers: Cinzel, 3xl-4xl, font-semibold
- Section Titles: Cinzel, 2xl-3xl, font-semibold
- Stats/Numbers: Bebas Neue, xl-3xl, tracking-wider
- Body Text: Inter, base-lg, font-normal
- UI Labels: Inter, sm-base, font-medium

---

## Layout System

**Spacing Primitives:**
Use Tailwind units of **4, 6, 8, 12, 16** for consistent rhythm
- Tight spacing: p-4, gap-4
- Standard spacing: p-8, gap-8, my-12
- Section spacing: py-16, py-20
- Hero spacing: py-24, py-32

**Container Strategy:**
- Full-width dramatic sections: w-full with max-w-7xl mx-auto
- Content areas: max-w-6xl
- Reading content: max-w-4xl

---

## Page-Specific Layouts

### Landing Page (Pre-Auth)

**Hero Section (100vh):**
- Large atmospheric background image: Dark tower silhouette ascending into mystical clouds/sky
- Centered content with dramatic title overlay
- "Begin Your Ascent" CTA with blurred background (backdrop-blur-md)
- Floating stat cards showing "10,000+ Climbers" and "1,000 Floors Conquered"

**Features Section:**
Three-column grid (lg:grid-cols-3) showcasing:
- Tower Progression (icon + description)
- Epic Battles (icon + description)
- Competitive Rankings (icon + description)

**How It Works Section:**
Vertical timeline visualization with 4 steps:
- Register & Choose Path
- Climb Through Lectures
- Battle Every 10 Floors
- Ascend the Rankings

**Leaderboard Preview:**
Showcase top 5 climbers with floor numbers and levels

**Footer:**
Multi-column layout with Quick Links, About, Contact

### Student Dashboard

**Header Bar:**
- Left: Student avatar + name + current floor number
- Center: "Floor X - The [Floor Name]" in Cinzel
- Right: Streak flame icon + counter, notification bell

**Main Content (Three-Column Layout):**

Left Sidebar (25%):
- Vertical tower progress visualization showing floors 1-100 (scrollable)
- Current position highlighted with pulsing indicator
- Next battle floor marked with crossed swords icon

Center Panel (50%):
- Hero card showing current floor image with atmospheric artwork
- XP progress bar (thick, ornate design)
- Level indicator (large, prominent)
- Primary CTA: "Continue Lecture [X/10]" (full-width, imposing button)
- Secondary CTA: "Join Practice Battle" (outlined)

Right Panel (25%):
- Stats card: Total XP, Win Rate, Battles Won
- Recent achievements (badge list)
- Next milestone preview

### Lecture Module

**Lecture Page:**
- Full-width content area (max-w-4xl mx-auto)
- Lecture title in Cinzel (3xl)
- Progress indicator: "Lecture X/10 - Floor Y"
- Content area with generous padding (p-12)
- Bottom CTA bar: "Continue to Quiz" (sticky, full-width)

**Quiz Page:**
- Centered quiz card (max-w-3xl)
- Timer at top (large, prominent with Bebas Neue)
- Question number indicator
- Question text (Inter, lg)
- Four option cards in 2x2 grid
- Submit button (full-width, dramatic)

**Results Modal:**
- Overlay with backdrop blur
- Large score display (Bebas Neue, 6xl)
- Performance breakdown
- Difficulty selection for next lecture (three card options)
- Adaptive feedback message

### Battle Arena

**Pre-Battle Matchmaking:**
- VS screen with two player cards facing each other
- Countdown timer (dramatic, large)
- Floor stakes: "Winner advances to Floor [X+1]"

**Battle Interface (Full Screen):**
- Split screen with opponent info on right sidebar
- Question area (centered, max-w-2xl)
- Timer bar at top (racing countdown)
- Live score comparison
- Answer submission area

**Results Screen:**
- Winner announcement (full-width hero)
- Victory/Defeat imagery
- XP gained/lost
- Statistics comparison table
- "Return to Tower" CTA

### Teacher Dashboard

**Header:**
- Teacher name + role
- Student count
- Average floor level

**Main Content:**
- Student table with sortable columns:
  - Avatar + Name
  - Current Floor
  - Battle Record (W-L)
  - Average Quiz Score
  - Attention Score
  - Last Active
- Filters: Floor range, performance level
- Charts section (grid layout):
  - Floor distribution (bar chart)
  - Battle outcomes (pie chart)
  - Progress over time (line chart)

### Leaderboard Page

**Header:**
- "Tower Rankings" in Cinzel (5xl)
- Season indicator
- Filter options (All Time, This Month, This Week)

**Ranking List:**
- Top 3 in large podium cards (different sizes)
- Ranks 4-100 in card list with:
  - Rank number (large, Bebas Neue)
  - Avatar
  - Name
  - Current Floor
  - Level
  - Total XP

---

## Component Library

### Navigation
- Top bar with logo, main nav links, profile dropdown
- Mobile: Hamburger menu

### Cards
- Elevated with subtle shadows
- Rounded corners (rounded-lg to rounded-xl)
- Padding: p-6 to p-8

### Buttons
- Primary: Large, full-rounded, font-semibold
- Secondary: Outlined with border-2
- Icon buttons: Circular, p-3
- Battle CTAs: Extra-large with dramatic styling

### Progress Indicators
- XP Bar: h-4, rounded-full, with gradient fill
- Level Indicator: Circular badge with level number
- Floor Progress: Vertical timeline with checkpoints

### Battle Elements
- VS Divider: Diagonal split or centered icon
- Timer: Circular or horizontal bar
- Score Comparison: Side-by-side numerical displays

### Forms
- Input fields: p-4, rounded-lg, border
- Labels: font-medium, mb-2
- Consistent spacing between fields (space-y-6)

### Modals/Overlays
- Centered content (max-w-2xl)
- Backdrop blur effect
- Close button (top-right)
- Generous padding (p-8 to p-12)

---

## Images

**Landing Page Hero:**
- Large atmospheric image of dark tower ascending into clouds/mystical sky
- Should feel epic and imposing
- Placement: Full background with overlay gradient

**Floor Backgrounds:**
- Each floor level should have unique atmospheric artwork
- Used in dashboard hero card and battle arenas
- Style: Fantasy landscapes, mystical environments

**Battle Imagery:**
- VS screen backgrounds: Dramatic lighting, arena-like settings
- Victory/Defeat screens: Corresponding imagery (triumphant vs. somber)

**Icons:**
Use Heroicons for UI elements (outline style for navigation, solid for actions)

---

## Spacing & Rhythm

**Vertical Spacing:**
- Between sections: space-y-16 to space-y-24
- Within sections: space-y-8 to space-y-12
- Card internal: p-6 to p-8

**Grid Systems:**
- Dashboard: 3-column (25% | 50% | 25%)
- Features: 3-column equal (grid-cols-1 md:grid-cols-3)
- Stats: 4-column (grid-cols-2 lg:grid-cols-4)
- Battle comparison: 2-column equal

**Responsive Breakpoints:**
- Mobile: Stack all columns to single column
- Tablet (md): 2-column layouts
- Desktop (lg): Full multi-column layouts

---

## Special Interactions

**Minimal Animations:**
- Progress bar fills (transition-all duration-500)
- Card hover elevations (hover:shadow-xl)
- Battle countdown pulses
- Victory/defeat screen entrance

**No hover states on blurred buttons** - buttons implement their own states