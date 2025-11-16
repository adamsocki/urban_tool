# Urban Planning Document Automator - Progress Tracker

**Project Goal:** Transform Placemark into an urban planning document automation tool that generates comprehensive planning documents using templates, LLMs, and data analysis.

**Approach:** Iterative, non-breaking development that preserves all existing Placemark functionality while adding planning-specific features.

---

## 🎯 Overall Vision

### Document Types to Support
- Comprehensive Plans
- Bike Plans
- Pedestrian Plans
- Walkability Studies
- Transit Ridership Forecasting
- SS4A Safety Plans
- Food Desert Analysis
- Community Health Plans
- Neighborhood Level Plans
- Road Diet Analysis
- Roadway Removal for Parks
- Custom Projects

### Core Workflow
1. **Define Project** - Create planning project with basic metadata
2. **Chat-Based Scoping** - Interactive Q&A to refine goals and requirements
3. **Data Collection** - Import/link geospatial and demographic data
4. **Analysis** - Automated data processing and statistics
5. **Document Generation** - LLM-assisted narrative + templates
6. **Review & Export** - Human-in-the-loop refinement and final output

### Key Capabilities
- Multiple template types with varying customization levels
- LLM integration for narrative generation, recommendations, and guidance
- Gap identification (missing data, considerations, best practices)
- Link to existing Placemark maps for geospatial data
- Multi-format export (PDF, Word, etc.)

---

## ✅ Phase 1: Foundation & Project Management (COMPLETE)

**Status:** ✅ Complete (Nov 16, 2024)
**Branch:** `claude/urban-planning-automator-01GkEE8gWL15qKenvuLGHaBJ`
**Commit:** `9b7e2a8` - "feat: add planning projects foundation to dashboard"

### What Was Built

#### 1. Database Schema (`db/schema.prisma`)
- ✅ `PlanningProject` model
  - ID, name, description, type, status
  - Organization and user relationships (multi-tenant)
  - `config` JSON field for template preferences and settings
  - `conversationHistory` JSON field for LLM chat storage
  - Timestamps and indexes

- ✅ `PlanningProjectMap` junction table
  - Links projects to maps (many-to-many)
  - Optional `purpose` field
  - Cascade delete rules

- ✅ Enums
  - `PlanningProjectType` (12 types)
  - `PlanningProjectStatus` (6 states: Draft, Scoping, In Progress, Review, Complete, Archived)

#### 2. Backend API (`app/planningProjects/`)
- ✅ Mutations:
  - `createPlanningProject.ts` - Create with validation
  - `updatePlanningProject.ts` - Update with auth checks
  - `deletePlanningProject.ts` - Delete with auth checks

- ✅ Queries:
  - `getPlanningProject.ts` - Fetch single with includes
  - `getPlanningProjects.ts` - List all with filtering

#### 3. Frontend Components
- ✅ `create_planning_project.tsx` - Dialog with form
  - Name, type dropdown, description textarea
  - Validation and error handling

- ✅ `planning_project_list.tsx` - Card-based list
  - Status badges (color-coded)
  - Linked map counts
  - Delete functionality
  - Empty state

- ✅ Dashboard integration (`pages/index.tsx`)
  - Separate section below Maps
  - Clear visual separation
  - Non-breaking changes

#### 4. Tests
- ✅ `createPlanningProject.test.ts`
- ✅ `getPlanningProjects.test.ts`

### Files Changed
```
db/schema.prisma (added models and enums)
pages/index.tsx (added Planning Projects section)
app/components/create_planning_project.tsx (new)
app/components/planning_project_list.tsx (new)
app/planningProjects/mutations/ (3 files)
app/planningProjects/queries/ (2 files)
app/planningProjects/*/tests (2 files)
```

### Migration Required
```bash
npx prisma migrate dev --name add_planning_projects
npx prisma generate
```

---

## 🚧 Phase 2: Project Detail Page & LLM Scoping (IN PROGRESS)

**Status:** 🔄 In Progress
**Goal:** Create interactive project workspace with LLM-assisted scoping

### Objectives

#### 2.1 Project Detail Page
- [ ] Create `/pages/planning-projects/[id].tsx` route
- [ ] Build project header component
  - Display name, type, status
  - Edit controls (inline or modal)
  - Status change dropdown
  - Delete confirmation
- [ ] Create navigation breadcrumbs
- [ ] Add back-to-dashboard link

#### 2.2 Project Information Panel
- [ ] Display project metadata
  - Created by, created date
  - Last updated
  - Description (editable)
- [ ] Show project type badge
- [ ] Status timeline/progress indicator

#### 2.3 LLM Chat Interface
- [ ] Design chat UI component
  - Message list (user/assistant)
  - Input field with send button
  - Loading states
  - Error handling

- [ ] Set up LLM API integration
  - Choose provider (OpenAI/Anthropic/other)
  - Environment variables for API keys
  - Rate limiting considerations
  - Token usage tracking

- [ ] Create chat backend mutations
  - `sendMessage.ts` - Save user message, call LLM, save response
  - Update `conversationHistory` in database
  - Stream responses (optional, for better UX)

- [ ] Implement project-type-specific prompting
  - System prompts for each project type
  - Question templates based on type
  - Best practices guidance
  - Gap identification logic

#### 2.4 Requirements Tracking System
- [ ] Design requirements data model
  - What data is needed?
  - What analysis is required?
  - What considerations should be addressed?

- [ ] Create requirements checklist UI
  - Auto-populated based on project type
  - Checkable items
  - Add custom items
  - Mark as complete/incomplete

- [ ] Build requirements extraction from chat
  - Parse LLM responses for identified needs
  - Automatically add to checklist
  - Highlight gaps

#### 2.5 Linked Maps Section
- [ ] Display currently linked maps
  - Map name, description
  - Feature count
  - Link to map editor
  - Unlink option

- [ ] Add "Link Map" functionality
  - Modal/dropdown to select from user's maps
  - Create `PlanningProjectMap` entry
  - Optional purpose field

- [ ] Show map preview/thumbnail (future)

### Technical Considerations

#### LLM Integration Options
**Option A: OpenAI**
- API: `gpt-4o` or `gpt-4o-mini`
- Streaming: Yes
- Cost: $2.50-$10/1M tokens

**Option B: Anthropic Claude**
- API: `claude-3-5-sonnet` or `claude-3-5-haiku`
- Streaming: Yes
- Cost: $3-$15/1M tokens

**Option C: Open Source (via API)**
- LLaMA 3, Mixtral, etc.
- Self-hosted or via providers
- Lower cost, more control

**Recommendation:** Start with OpenAI `gpt-4o-mini` for cost-effectiveness, easy streaming, and good quality.

#### Database Schema Updates Needed
```prisma
// May need to add:
model ProjectRequirement {
  id                 String          @id @default(uuid())
  planningProjectId  String
  planningProject    PlanningProject @relation(...)
  requirement        String
  completed          Boolean         @default(false)
  source             String?         // "chat", "manual", "template"
  createdAt          DateTime        @default(now())
}
```

#### New Environment Variables
```bash
# LLM API
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Token usage tracking
LLM_BUDGET_LIMIT=1000000  # tokens per month
```

### Files to Create

#### Pages
- `pages/planning-projects/[id].tsx` - Main project detail page

#### Components
- `app/components/planning_projects/project_header.tsx`
- `app/components/planning_projects/project_info_panel.tsx`
- `app/components/planning_projects/chat_interface.tsx`
- `app/components/planning_projects/chat_message.tsx`
- `app/components/planning_projects/requirements_checklist.tsx`
- `app/components/planning_projects/linked_maps_panel.tsx`
- `app/components/planning_projects/link_map_dialog.tsx`

#### Backend
- `app/planningProjects/mutations/sendChatMessage.ts`
- `app/planningProjects/mutations/linkMap.ts`
- `app/planningProjects/mutations/unlinkMap.ts`
- `app/lib/llm/client.ts` - LLM API wrapper
- `app/lib/llm/prompts.ts` - System prompts by project type

#### Tests
- `app/planningProjects/mutations/sendChatMessage.test.ts`
- `app/components/planning_projects/chat_interface.test.tsx`

### Success Criteria
- ✅ Can navigate to project detail page
- ✅ Can chat with LLM about project scope
- ✅ Conversation persists in database
- ✅ Can link/unlink maps to project
- ✅ LLM provides helpful, project-type-specific guidance

---

## 📅 Phase 3: Data Integration & Analysis (PLANNED)

**Status:** 📋 Planned
**Goal:** Extract and analyze data from linked maps

### High-Level Tasks
- [ ] Data extraction pipeline
  - Read features from linked maps
  - Calculate statistics (count, area, length, etc.)
  - Store analysis results

- [ ] Analysis configuration
  - Define analysis types per project type
  - User-configurable analysis parameters
  - Progress tracking for long-running analyses

- [ ] Results display
  - Charts and visualizations
  - Summary statistics
  - Export data to CSV/JSON

---

## 📅 Phase 4: Template System (PLANNED)

**Status:** 📋 Planned
**Goal:** Define and manage document templates

### High-Level Tasks
- [ ] Template data model
  - Sections, subsections
  - Variable placeholders
  - Conditional content

- [ ] Template editor
  - WYSIWYG or markdown-based
  - Insert variables
  - Preview mode

- [ ] Template library
  - Pre-built templates per project type
  - User custom templates
  - Template versioning

---

## 📅 Phase 5: Document Generation (PLANNED)

**Status:** 📋 Planned
**Goal:** Generate complete documents with LLM narratives

### High-Level Tasks
- [ ] LLM narrative generation
  - Generate text from data
  - Follow template structure
  - Incorporate user feedback

- [ ] Document assembly
  - Combine template + data + narratives
  - Apply styling
  - Generate table of contents

- [ ] Export formats
  - PDF (via Puppeteer or similar)
  - Word/DOCX
  - Markdown
  - HTML

- [ ] Review workflow
  - Section-by-section review
  - Edit/regenerate sections
  - Approval process
  - Version history

---

## 🔧 Technical Debt & Improvements

### Current
- None yet (Phase 1 is solid foundation)

### Future Considerations
- WebSocket for real-time LLM streaming
- Background job queue for long analyses
- Caching layer for expensive computations
- Multi-user collaboration on projects
- Audit log for project changes

---

## 📊 Metrics to Track

### Usage
- Number of projects created
- Projects by type
- Projects by status
- LLM token usage
- Documents generated

### Performance
- Page load times
- LLM response times
- Analysis execution times
- Document generation times

---

## 📝 Notes & Decisions

### Nov 16, 2024
- **Decision:** Use parallel project list on dashboard (non-breaking)
- **Decision:** Store conversation history as JSON array (simple, flexible)
- **Decision:** Support 12 project types initially (expandable)
- **Rationale:** Start simple, iterate based on usage

### Next Session Decisions Needed
- [ ] Which LLM provider to use?
- [ ] Streaming vs. non-streaming chat?
- [ ] Requirements as separate model or JSON?
- [ ] Project detail page layout/design?

---

## 🚀 Quick Commands

### Development
```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Run specific test
pnpm test planning_projects

# Database commands
npx prisma studio          # DB GUI
npx prisma migrate dev     # Create migration
npx prisma generate        # Regenerate client
```

### Git
```bash
# Current branch
git status

# Commit changes
git add .
git commit -m "feat: description"

# Push to remote
git push -u origin claude/urban-planning-automator-01GkEE8gWL15qKenvuLGHaBJ
```

---

## 📚 Resources

### Documentation
- Placemark CLAUDE.md - `/home/user/urban_tool/CLAUDE.md`
- This progress doc - `/home/user/urban_tool/URBAN_PLANNING_PROGRESS.md`

### Key Dependencies
- Blitz.js: https://blitzjs.com/docs
- Prisma: https://www.prisma.io/docs
- OpenAI: https://platform.openai.com/docs
- Radix UI: https://www.radix-ui.com

---

**Last Updated:** 2025-11-16
**Current Phase:** Phase 2 - Project Detail & LLM Scoping
**Next Milestone:** Interactive project scoping chat
