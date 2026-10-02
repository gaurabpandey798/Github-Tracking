# IdeaX CodeMonitor - Organizer Frontend

Development monitoring and audit dashboard for the **IdeaX 2026 Hackathon**.

The frontend communicates with the existing Spring Boot backend running on `http://localhost:8085` to monitor team repositories, capture immutable audit checkpoints during sprint freezes, and review heuristic activity flags.

---

## Tech Stack & Architecture

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom IdeaX palette tokens:
  - Primary: `#1B2560`
  - Secondary: `#2E45A2`
  - Accent: `#9EDCE6`
  - Light Background: `#F2F6FF`
  - Neutral Text: `#1F2937`
  - White Cards: `#FFFFFF`
- **Icons**: Lucide React (minimal dependency)
- **API Client**: Centralized typed client layer (`lib/api/`) with automated Next.js proxying to prevent browser CORS restrictions and securely handle HTTP Basic Authentication.

---

## Phase 1 Modules

1. **Dashboard (`/`)**:
   - Live Event Status (`ACTIVE`) and start timestamps.
   - Prominently featured **Current Sprint Card** (Sprint 2) with status, audit checkpoints count, and progress bar.
   - Aggregate metric cards for Registered Teams, Tracked Participants, Repositories, and Open Review Flags.
   - Sprints schedule overview and recent open review flags queue.

2. **Sprint Management (`/sprints`)**:
   - Full sprint audit table with columns: *Sprint*, *Status*, *Released At*, *Frozen At*, *Checkpoints*, *Action*.
   - Status badges: `NOT_STARTED`, `ACTIVE`, `FROZEN`.
   - Deep inspection modal/panel via `GET /api/admin/sprints/{id}` displaying:
     - Release notes and audit freeze notes with author timestamps.
     - **Checkpoint Display**: Recorded HEAD commit SHA (with copy helper), commit count, developer count, files changed, additions/deletions diffs, first and last activity timestamps.
     - Recent commits list with SHA, author, and code diff statistics.
     - Associated sprint review flags.

3. **Sprint Release & Freeze Dialogs**:
   - **Release Dialog (`POST /api/admin/sprints/{id}/release`)**: Mandatory organizer note, pre-flight checks, confirmation modal.
   - **Freeze Dialog (`POST /api/admin/sprints/{id}/freeze`)**: Mandatory audit note. Clearly explains:
     > *"Freeze creates an immutable audit checkpoint. It does not lock the GitHub repository."*
     Displays *"Sprint Frozen (Audit Checkpoint)"* post-freeze.

4. **Organizer Review Center (`/review-center`)**:
   - Heuristic review flag queues (`GET /api/admin/review-flags`) with dual Table and Card views.
   - Status filters (`ALL`, `OPEN`, `REVIEWED`, `DISMISSED`).
   - Supported flag types: `LARGE_COMMIT`, `BULK_CHANGE`, `UNKNOWN_CONTRIBUTOR`, `FORCE_PUSH`, `HISTORY_CHANGE`, `SUDDEN_ACTIVITY`, `NO_ACTIVITY`, and `POST_CHECKPOINT_ACTIVITY`.
   - **Ethical Audit Principles**: Uses objective wording (*"Review Recommended"*, *"Activity Flag"*, *"Requires Organizer Review"*) and explains post-checkpoint activity.
   - **Resolve Dialog (`POST /api/admin/review-flags/{id}/resolve`)**: Organizers can mark flags as `REVIEWED` or `DISMISSED` with an audit note.

5. **Phase 2 Placeholders**:
   - Teams, Repositories, Developers, Checkpoints, Commits, Activity, Reports show clean "Coming soon" state.
   - Settings page includes a live backend connection test and credential manager.

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (tested with Node v24)
- Running IdeaX Backend on port `8085` (`http://localhost:8085`)

### 2. Environment Configuration
The `.env.local` file contains configuration for the backend:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8085
NEXT_PUBLIC_API_USERNAME=admin
NEXT_PUBLIC_API_PASSWORD=admin123
BACKEND_INTERNAL_URL=http://localhost:8085
```

### 3. Installation & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
```bash
npm run build
npm run start
```
