# CodeArena — Competitive Programming & Learning Platform

CodeArena is a modern, production-minded competitive programming and computer science learning platform built with a **Laravel 12 REST API** backend and a **React 19 + TypeScript + Tailwind CSS** frontend.

---

## 🌟 Key Features

### 1. Specialized Challenge Editors & Evaluators
- **Standard Code Challenges**: Integrated Monaco Editor (VS Code experience) supporting Python, JavaScript, C++, Java, and 40+ languages. Automatic sample test execution and server-verified hidden test submissions with accurate execution time and memory limits.
- **SQL Lab**: Dedicated SQL query workspace with DDL schema definitions, sample tables, tabular result grids, and comparison against reference queries.
  - *Security*: Executed in isolated, temporary in-memory SQLite PDO connections with strict statement blacklisting (`ATTACH`, `DETACH`, `PRAGMA` blocked). Untrusted SQL never touches production databases.
- **Web Development Sandbox**: Multi-tab live code editor (HTML, CSS, JavaScript) rendering in a strict sandbox iframe (`sandbox="allow-scripts"`) with responsive viewport emulation (Desktop 100%, Tablet 768px, Mobile 375px).
- **Interactive Quizzes**: Multiple-choice assessments on DevOps (Docker, Linux, Bash), Software Architecture, and Design Patterns with server-side scoring and educational explanations.

### 2. Large Challenge Library & Robust Seed/Import System
- **58 Distinct, Handcrafted Challenges**: Spanning Algorithms, Data Structures, Mathematics, Arrays, Strings, Sorting, Searching, Recursion, SQL, HTML/CSS, Docker, Linux, and Software Engineering.
- **5 Difficulty Tiers**: Beginner, Easy, Medium, Hard, and Expert.
- **Admin Import / Export**:
  - Bulk JSON and CSV import with duplicate detection by slug or title.
  - Optional overwrite toggle for updating existing records.
  - One-click library export as JSON or CSV.

### 3. Backend-Managed Programming Language & Technology Catalog
- Dynamic `/api/v1/languages` catalog covering 44 languages and technologies (Python, C++, Java, Go, Rust, TypeScript, PHP, SQL, React, Docker, Linux, etc.).
- Honest evaluator reporting: Each catalog item explicitly reports `evaluator_type` (`judge0`, `sqlite_sandbox`, `client_sandbox`, `quiz_engine`, or `none`) and `is_executable`. Unsupported languages display clear warnings and disable execution actions.

### 4. Learning Roadmaps & Curriculum Tracks
- 8 structured career tracks:
  1. Algorithms & Data Structures
  2. SQL & Database Mastery
  3. Full-Stack Web Development
  4. DevOps, Linux & Docker
  5. Python Mastery
  6. JavaScript & TypeScript Core
  7. PHP & Modern Laravel
  8. Java & Object-Oriented Design
- Visual curriculum module tree with prerequisites, challenge links, and user completion tracking.

### 5. Daily Challenge & Streaks
- Real-time Daily Challenge banner with participation tracking.
- Consecutive day streaks with bonus XP awards.
- Reset countdown timer calculated dynamically.

### 6. Contests & Competitive Standings
- Live, Upcoming, and Past coding contests.
- Contest registration, countdown timers, points, and penalty-time calculation.
- Live public leaderboard with rank badges (Gold, Silver, Bronze medals).

### 7. Gamification, Community & Personal Workspace
- **XP Progression & Levels**: Tiered XP awarded server-side with duplicate-award prevention. Milestone badges (First Solve, Decathlon Coder, Apex Master).
- **Discussions**: Threaded community Q&A per problem with upvoting and accepted answer tagging.
- **Personal Notes**: Auto-saving private scratchpad per challenge.
- **Bookmarks & Collections**: Save favorite problems to custom collections.
- **Notifications**: In-app activity bell with unread count and real-time dropdown.
- **Admin Operations Center**: Live analytics dashboard tracking users, submissions, acceptance rates, 7-day activity trends, and Judge0 health.

### 8. Dark & Light Themes + English & French Translations
- **Theme**: Seamless Light / Dark mode toggle persisted in `localStorage` and synchronized across all pages, modal dialogues, Monaco editor, and SQL tables.
- **Localization**: 100% natural English and French translation coverage via `i18next`.

---

## 🏗 Architecture & Technologies

### Backend (`/backend`)
- **Framework**: Laravel 12 (PHP 8.2+)
- **Authentication**: Laravel Sanctum (token-based SPA authentication)
- **Database**: SQLite / PostgreSQL with Eloquent ORM
- **Testing**: PHPUnit / Pest (`php artisan test` — 26 tests, 344 assertions)

### Frontend (`/frontend`)
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Icons**: Lucide React
- **State & Data Fetching**: TanStack React Query v5
- **Editor**: `@monaco-editor/react`
- **Routing**: React Router v7

---

## 🚀 Getting Started

### Prerequisites
- PHP 8.2+ with `pdo_sqlite` extension
- Composer
- Node.js 18+ and npm

### 1. Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Configure environment
cp .env.example .env
php artisan key:generate

# Run migrations and seed complete dataset
php artisan migrate --force
php artisan db:seed

# Start the Laravel development server
php artisan serve
```

The API will be available at `http://127.0.0.1:8000`.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 🧪 Testing & Validation

### Run Backend Tests

```bash
cd backend
php artisan test
```

*Status: 26 passed tests, 344 assertions.*

### Run Frontend Typecheck & Build

```bash
cd frontend
npm run build
```

*Status: Zero TypeScript errors, Vite production bundle compiled in ~550ms.*

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/health` | GET | API health probe |
| `/api/v1/auth/register` | POST | Register new user account |
| `/api/v1/auth/login` | POST | Authenticate user and issue token |
| `/api/v1/languages` | GET | Catalog of 44 technologies with evaluator health |
| `/api/v1/daily-challenge` | GET | Today's featured challenge and user streak |
| `/api/v1/challenges` | GET | List challenges with search, category, and type filters |
| `/api/v1/challenges/{slug}` | GET | Get challenge details, hints, schema, and templates |
| `/api/v1/challenges/{id}/run` | POST | Execute sample test cases |
| `/api/v1/challenges/{id}/submit` | POST | Submit solution against hidden test cases |
| `/api/v1/challenges/{id}/run-sql` | POST | Execute query against isolated SQL sandbox |
| `/api/v1/challenges/{id}/submit-sql` | POST | Verify SQL solution against expected result set |
| `/api/v1/challenges/{id}/submit-quiz` | POST | Submit multiple-choice answers for quiz challenge |
| `/api/v1/challenges/{id}/bookmark` | POST | Toggle bookmark status for challenge |
| `/api/v1/challenges/{id}/note` | GET/POST | Fetch or update personal notes |
| `/api/v1/challenges/{id}/discussions` | GET/POST | Problem discussions and questions |
| `/api/v1/roadmaps` | GET | All 8 learning tracks with progress |
| `/api/v1/roadmaps/{slug}` | GET | Roadmap curriculum modules and linked challenges |
| `/api/v1/contests` | GET | Live, upcoming, and past contests |
| `/api/v1/contests/{slug}/register` | POST | Register for a contest |
| `/api/v1/contests/{slug}/leaderboard` | GET | Contest scoreboard and standings |
| `/api/v1/leaderboard` | GET | Global hall of fame by verified XP |
| `/api/v1/notifications` | GET | User activity notifications |
| `/api/v1/admin/analytics` | GET | Admin overview metrics, status breakdown, Judge0 health |
| `/api/v1/admin/challenges/import` | POST | Admin bulk JSON / CSV challenge import |
| `/api/v1/admin/challenges/export` | GET | Admin challenge export (JSON or CSV) |

---

## 🔐 Security & Safety

- **SQL Isolation**: All user SQL queries are executed against temporary in-memory SQLite connections with strict connection pooling, statement timeout, and blacklisting of administrative / filesystem pragmas.
- **Web Sandbox Isolation**: HTML/CSS/JS user submissions are rendered within sandboxed iframe containers isolated from application cookies and `localStorage`.
- **Anti-Cheat Scoring**: All test case validations and XP calculations are performed strictly server-side. Public sample cases are available for immediate feedback, while hidden test cases remain strictly confidential on the server.
