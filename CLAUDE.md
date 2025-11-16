# CLAUDE.md - AI Assistant Guide for Placemark

This document provides comprehensive guidance for AI assistants working with the Placemark codebase. Last updated: 2025-11-16

## Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Codebase Structure](#codebase-structure)
- [Key Architectural Patterns](#key-architectural-patterns)
- [Development Workflows](#development-workflows)
- [Coding Conventions](#coding-conventions)
- [Testing Guidelines](#testing-guidelines)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

**Placemark** is a full-stack geospatial web application for importing, creating, editing, visualizing, and publishing geographic data. It supports 20+ geospatial formats and features real-time collaboration with offline-first architecture.

**Key Capabilities:**
- Multi-format geospatial data conversion (GeoJSON, KML, Shapefile, GPX, etc.)
- Web-based map editing with drawing and algorithmic operations
- Offline-first sync with Replicache
- Real-time collaboration with presence tracking
- Multi-tenant organization support
- Public map publishing

**Repository:** Open source version of previously commercial SaaS product

---

## Technology Stack

### Core Framework
- **Blitz.js 2.0** - Full-stack React framework (extends Next.js)
- **Next.js 14** - React framework with SSR/SSG
- **React 18** - UI library
- **TypeScript 5** - Strict mode enabled

### Database & ORM
- **PostgreSQL 14+** - Primary database (required)
- **Prisma 5** - ORM and migrations (`db/schema.prisma`)
- **node-pg** - Direct PostgreSQL client for performance-critical paths

### State Management (3 Layers)
1. **Server State:** React Query (via Blitz RPC)
2. **Synchronized State:** Replicache (offline-first sync engine)
3. **Ephemeral State:** Jotai (atomic state management) + XState (state machines)

### Styling
- **Tailwind CSS 3** - Utility-first CSS framework
- **classed-components** - Component styling pattern
- **Radix UI** - Headless UI primitives (primary component library)

### Mapping & GIS
- **Mapbox GL JS 2** - Map rendering engine
- **Deck.gl 8.8** - WebGL-powered visualization overlays
- **Turf.js** - Geospatial analysis and operations
- **proj4/mproj** - Coordinate system transformations
- **FlatGeobuf** - High-performance binary geospatial format

### Key Libraries
- **TipTap** - Rich text editor (ProseMirror-based)
- **CodeMirror 6** - JSON editor for properties
- **React Hot Toast** - Notifications
- **purify-ts** - Functional programming (Either/Maybe types)
- **zod** - Runtime schema validation

### Testing
- **Vitest** - Test runner (91+ test files)
- **@testing-library/react** - Component testing
- **jsdom** - DOM simulation

### Infrastructure & Services
- **Sentry** - Error tracking (required)
- **Postmark** - Email delivery (optional)
- **WorkOS** - SSO/SAML (optional)
- **Logtail** - Structured logging (optional)
- **Cloudflare** - CDN and image optimization (optional)

### Package Management
- **pnpm 8.11.0** - Required (lockfile present, do not use npm/yarn)
- **Volta** - Node version pinning (20.11.0)

---

## Codebase Structure

```
urban_tool/
├── app/                          # Blitz.js application code
│   ├── auth/                     # Authentication mutations & components
│   ├── components/               # Reusable React components
│   │   ├── dialogs/             # Modal dialogs
│   │   ├── panels/              # Feature editor panels
│   │   └── ...                  # Shared UI components
│   ├── context/                  # React context providers
│   ├── core/                     # Core utilities and layouts
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Business logic & utilities
│   │   ├── convert/             # Format conversion (20+ formats)
│   │   ├── geometry/            # Geospatial operations
│   │   ├── map_operations/      # Map manipulation functions
│   │   └── ...                  # Various utilities
│   ├── organizations/            # Organization CRUD
│   ├── memberships/              # Team membership logic
│   ├── users/                    # User management
│   ├── wrappedFeatureCollections/ # Main map document logic
│   └── ...                       # Other domain modules
├── pages/                        # Next.js pages & API routes
│   ├── api/                      # API endpoints
│   │   ├── rpc/                 # Blitz RPC handler
│   │   ├── replicache-push      # Client → Server sync
│   │   ├── replicache-pull      # Server → Client sync
│   │   └── v1/                  # Public REST API
│   ├── map/[id]                 # Map editor (main app)
│   ├── public/[id]              # Public map viewer
│   └── settings/                # Settings pages
├── db/                          # Database
│   ├── schema.prisma           # Prisma schema (source of truth)
│   └── migrations/             # Prisma migrations
├── state/                       # Global state (Jotai atoms)
│   └── jotai.ts                # Main atom definitions
├── types/                       # TypeScript type definitions
├── workers/                     # Web Workers
├── vendor/                      # Vendored dependencies
├── test/                        # Test utilities & fixtures
├── integrations/                # Third-party service integrations
├── mailers/                     # Email templates
├── styles/                      # Global CSS
├── public/                      # Static assets
└── docs/                        # Documentation
    ├── architecture.md          # Architecture details
    └── docker.md               # Docker setup
```

### Important Files
- `package.json` - Dependencies (name: "placemark")
- `tsconfig.json` - TypeScript strict mode config
- `next.config.js` - Next.js config with Sentry
- `tailwind.config.js` - Tailwind customization
- `vitest.config.ts` - Test configuration
- `.env` - Environment variables (see env files in app/lib/)
- `render.yaml` - Render.com deployment blueprint

---

## Key Architectural Patterns

### 1. Blitz.js RPC Pattern

**Structure:**
```
app/[domain]/
  mutations/
    createThing.ts      # Server-side data modification
    updateThing.ts
    deleteThing.ts
  queries/
    getThing.ts         # Server-side data fetching
    getThings.ts
```

**Mutation Example:**
```typescript
// app/wrappedFeatures/mutations/updateWrappedFeature.ts
import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const UpdateFeatureSchema = z.object({
  id: z.string(),
  feature: z.object({ ... })
})

export default resolver.pipe(
  resolver.zod(UpdateFeatureSchema),   // 1. Validate input
  resolver.authorize(),                 // 2. Require auth
  async ({ id, feature }, ctx) => {     // 3. Execute
    // Check authorization
    await authorizeWFC(ctx.session.userId, ...)

    // Perform mutation
    return await db.wrappedFeature.update({
      where: { id },
      data: { feature }
    })
  }
)
```

**Client Usage:**
```typescript
import updateWrappedFeature from "app/wrappedFeatures/mutations/updateWrappedFeature"
import { useMutation } from "@blitzjs/rpc"

const [updateFeature] = useMutation(updateWrappedFeature)
await updateFeature({ id: "123", feature: {...} })
```

### 2. Offline-First with Replicache

**Architecture:**
- Client maintains IndexedDB cache
- Optimistic updates for instant UI
- Background sync via push/pull endpoints
- Version-based conflict resolution

**Mutation Flow:**
```typescript
// Client-side Replicache mutation
await rep.mutate.updateFeature({
  id: "123",
  feature: {...}
})
// → Immediately updates local state
// → Queued for sync to server
// → Push to /api/replicache-push
// → Other clients notified via WebSocket "poke"
// → Clients pull updates from /api/replicache-pull
```

**Key Files:**
- `app/lib/replicache/client.ts` - Client mutators
- `app/lib/replicache/validaton.ts` - Server mutation validation
- `pages/api/replicache-push.ts` - Process client mutations
- `pages/api/replicache-pull.ts` - Send state to clients

**Important:** All mutations must increment version counters for sync to work.

### 3. Three-Layer State Management

**Layer 1: Server State (React Query via Blitz)**
```typescript
// Cached server data, auto-refetching
const [wfc] = useQuery(getWrappedFeatureCollection, { id })
```

**Layer 2: Synchronized State (Replicache)**
```typescript
// Features, folders, layer configs - synced to server
const features = useSubscribe(rep, async (tx) => {
  return await tx.scan({ prefix: "feature/" }).toArray()
})
```

**Layer 3: Ephemeral State (Jotai)**
```typescript
// Local-only state: selection, UI mode, dialogs
import { dataAtom, selectionAtom } from "state/jotai"

const selection = useAtomValue(selectionAtom)
const [mode, setMode] = useAtom(modeAtom)
```

**Key Jotai Atoms** (`state/jotai.ts`):
- `dataAtom` - Feature/folder maps, selection, ID mapping
- `modeAtom` - Current editing mode (draw, select, vertex, etc.)
- `selectionAtom` - Selected features/folders
- `dialogAtom` - Modal dialog state
- `momentLogAtom` - Undo/redo history
- `presencesAtom` - Collaborator cursors/viewports

### 4. Data Immutability Pattern

**Pristine vs Derived:**
- **Stored:** Pristine GeoJSON features (database/Replicache)
- **Derived:** Rendered geometries, statistics, Mapbox IDs

**Key Principle:** Never mutate feature geometry directly. Always create new objects.

```typescript
// ❌ WRONG - Mutates original
feature.geometry.coordinates[0] = newPoint

// ✅ CORRECT - Creates new object
const updated = {
  ...feature,
  geometry: {
    ...feature.geometry,
    coordinates: [newPoint, ...feature.geometry.coordinates.slice(1)]
  }
}
```

### 5. Utility Object Pattern (U-Objects)

Instead of classes, the codebase uses utility objects providing methods for plain objects.

**Example:**
```typescript
// app/lib/utils/uselection.ts
export const USelection = {
  none(): Selection {
    return { type: "none" }
  },

  single(id: string): Selection {
    return { type: "single", id }
  },

  ids(selection: Selection): string[] {
    return selection.type === "single" ? [selection.id] : selection.ids
  }
}

// Usage
const sel = USelection.single("feature-123")
const ids = USelection.ids(sel) // ["feature-123"]
```

**Other U-Objects:**
- `UWrappedFeature` - Feature utilities
- `UIDMap` - ID mapping (UUID ↔ Mapbox numeric IDs)
- `UMomentLog` - Undo/redo operations

### 6. Error Handling with Either Types

**purify-ts** Either types for operations that can fail:

```typescript
import { Either, Left, Right } from "purify-ts"

function parseGeoJSON(data: string): Either<string, GeoJSON> {
  try {
    const parsed = JSON.parse(data)
    if (isValidGeoJSON(parsed)) {
      return Right(parsed)
    }
    return Left("Invalid GeoJSON structure")
  } catch (e) {
    return Left("JSON parse error")
  }
}

// Usage
parseGeoJSON(input)
  .map(geojson => convertToFeatures(geojson))
  .mapLeft(error => toast.error(error))
  .ifRight(features => saveFeatures(features))
```

**Testing Either:**
```typescript
expect(result).toBeRight()
expect(result).toEqualRight(expectedValue)
expect(result).toBeLeft()
```

### 7. Fractional Indexing for Ordering

Features and folders use fractional indexing for reordering without renumbering.

```typescript
// Features have an `at` field (string)
{ id: "1", at: "a0" }
{ id: "2", at: "a1" }

// Reorder by generating fractional index between two positions
import { generateKeyBetween } from "fractional-indexing"

const newAt = generateKeyBetween("a0", "a1") // "a0V"
```

**Important:** Always use fractional-indexing library, don't generate manually.

---

## Development Workflows

### Initial Setup

```bash
# Prerequisites
# - PostgreSQL 14+ running
# - Node 20.11.0 (via Volta or nvm)
# - pnpm 8.11.0

# Install dependencies
pnpm install

# Setup database
createdb placemark
psql -c "CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE placemark TO postgres;" placemark

# Run migrations
npx prisma migrate reset  # Creates schema and seeds

# Configure environment
cp .env.example .env      # If exists, otherwise create .env
# Edit .env with required variables (see app/lib/env_server.ts)

# Start dev server
pnpm dev                  # Runs on http://localhost:3000
```

### Database Workflows

**Create Migration:**
```bash
# 1. Edit db/schema.prisma
# 2. Generate migration
npx prisma migrate dev --name add_user_preferences

# This will:
# - Create SQL migration file
# - Apply migration to database
# - Regenerate Prisma Client
```

**Reset Database:**
```bash
npx prisma migrate reset   # ⚠️ Deletes all data, reapplies migrations
```

**Prisma Studio (DB GUI):**
```bash
pnpm studio                # Opens GUI at http://localhost:5555
```

**Important:** After schema changes, restart dev server to regenerate types.

### Testing Workflows

**Run All Tests:**
```bash
pnpm test                  # Vitest run
```

**Watch Mode:**
```bash
pnpm test:watch           # Re-runs on file changes
```

**Run Specific Test:**
```bash
pnpm test path/to/file.test.ts
```

**Test File Locations:**
- Colocated: `component.tsx` → `component.test.tsx`
- Integration: `app/[domain]/__tests__/`

**Writing Tests:**
```typescript
import { describe, it, expect } from "vitest"

describe("USelection", () => {
  it("creates single selection", () => {
    const sel = USelection.single("id-123")
    expect(sel).toEqual({ type: "single", id: "id-123" })
  })

  it("parses GeoJSON successfully", () => {
    const result = parseGeoJSON('{"type":"Feature",...}')
    expect(result).toBeRight()
  })
})
```

### Git Workflows

**Current Branch:** `claude/claude-md-mi16a02u717rop70-01TmVKHbnJJv1CVGnbCEwHJT`

**Commit Pattern:**
```bash
# Make changes
git add .
git commit -m "feat: add feature export to CSV format"

# Push to remote
git push -u origin claude/claude-md-mi16a02u717rop70-01TmVKHbnJJv1CVGnbCEwHJT
```

**Commit Message Convention:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `docs:` - Documentation

### Build & Deploy

**Production Build:**
```bash
pnpm build                # Next.js production build
pnpm start                # Starts production server
```

**Environment Variables:**
- Development: `.env` file (gitignored)
- Production: Set in hosting platform (Render, Railway, etc.)
- See `app/lib/env_server.ts` and `app/lib/env_client.ts` for required vars

**Docker:**
```bash
docker-compose up         # See docs/docker.md
```

---

## Coding Conventions

### TypeScript

**Strict Mode:** Enabled in `tsconfig.json`
```typescript
// ✅ GOOD - Explicit types
function calculateArea(feature: GeoJSON.Feature): number {
  return area(feature)
}

// ❌ BAD - Implicit any
function calculateArea(feature) {
  return area(feature)
}
```

**Avoid Type Assertions:**
```typescript
// ❌ BAD
const value = data as MyType

// ✅ GOOD - Use type guards
function isMyType(data: unknown): data is MyType {
  return typeof data === "object" && data !== null && "key" in data
}

if (isMyType(data)) {
  // TypeScript knows data is MyType
}
```

**Switch Exhaustiveness:**
```typescript
function handleMode(mode: Mode): string {
  switch (mode) {
    case "select": return "Select features"
    case "draw": return "Draw features"
    case "vertex": return "Edit vertices"
    default: {
      const _exhaustive: never = mode  // Compile error if case missing
      return _exhaustive
    }
  }
}
```

### Naming Conventions

**General:**
- Use full words, avoid abbreviations (except standard geo terms)
- `camelCase` for variables/functions
- `PascalCase` for types/interfaces/components
- `SCREAMING_SNAKE_CASE` for constants

**Geospatial Terms:**
- `feature` - GeoJSON Feature
- `wrappedFeature` - Feature with Placemark metadata
- `wfc` - WrappedFeatureCollection (in comments/code only)
- `fc` - FeatureCollection (GeoJSON)

**Prefixes:**
- `U` prefix - Utility objects (`USelection`, `UIDMap`)
- `I` prefix - Avoid for interfaces (just use name without prefix)

**Files:**
- Component files: `PascalCase.tsx`
- Utility files: `camelCase.ts` or `kebab-case.ts`
- Test files: `name.test.ts` or `name.test.tsx`

### Component Patterns

**Prefer Function Components:**
```typescript
import { FC } from "react"

interface Props {
  feature: WrappedFeature
  onUpdate: (feature: WrappedFeature) => void
}

export const FeatureCard: FC<Props> = ({ feature, onUpdate }) => {
  return (
    <div className="rounded border p-4">
      {/* ... */}
    </div>
  )
}
```

**Use Radix UI for Primitives:**
```typescript
import * as Dialog from "@radix-ui/react-dialog"

export const FeatureDialog: FC = () => (
  <Dialog.Root>
    <Dialog.Trigger>Open</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className="fixed ...">
        {/* ... */}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
)
```

**Styling with Tailwind:**
```typescript
// ✅ GOOD - Tailwind utilities
<div className="flex items-center gap-2 rounded bg-gray-100 p-4">

// For repeated patterns, use classed-components
import { classed } from "classed-components"

const Card = classed.div("rounded border p-4 shadow-sm")

<Card>Content</Card>
```

### State Management

**When to Use Each Layer:**

| State Type | Tool | Example |
|------------|------|---------|
| Server data (user, orgs) | Blitz Query | `useQuery(getCurrentUser)` |
| Synced map data (features) | Replicache | `useSubscribe(rep, tx => ...)` |
| UI state (dialogs, mode) | Jotai | `useAtom(dialogAtom)` |
| Complex flows | XState | File save notifications |
| User preferences | Jotai + localStorage | `atomWithStorage("theme", "light")` |

**Atom Definition:**
```typescript
// state/jotai.ts
import { atom } from "jotai"

export const selectionAtom = atom<Selection>(USelection.none())

// Derived atom
export const selectedIdsAtom = atom((get) => {
  const selection = get(selectionAtom)
  return USelection.ids(selection)
})

// Writable derived atom
export const modeAtom = atom(
  (get) => get(dataAtom).mode,
  (get, set, newMode: Mode) => {
    set(dataAtom, { ...get(dataAtom), mode: newMode })
  }
)
```

### Validation

**Always Use Zod in Mutations:**
```typescript
import { z } from "zod"

const CreateFeatureSchema = z.object({
  wrappedFeatureCollectionId: z.string().uuid(),
  feature: z.object({
    type: z.literal("Feature"),
    geometry: z.object({
      type: z.enum(["Point", "LineString", "Polygon"]),
      coordinates: z.array(z.any())  // Could be more specific
    }),
    properties: z.record(z.any())
  })
})

// In mutation
resolver.pipe(
  resolver.zod(CreateFeatureSchema),
  async (input, ctx) => { ... }
)
```

### Error Handling

**Use Either for Expected Failures:**
```typescript
import { Either, Left, Right } from "purify-ts"

function convertToGeoJSON(data: unknown): Either<string, GeoJSON.FeatureCollection> {
  if (!isValidFormat(data)) {
    return Left("Unsupported format")
  }

  try {
    return Right(convert(data))
  } catch (error) {
    return Left(`Conversion failed: ${error}`)
  }
}
```

**Throw for Unexpected Errors:**
```typescript
if (!user) {
  throw new Error("User not found") // Will be caught by Sentry
}
```

**API Errors:**
```typescript
import { NotFoundError } from "blitz"

if (!record) {
  throw new NotFoundError()  // Returns 404 to client
}
```

### Performance

**Virtualize Long Lists:**
```typescript
import { useVirtual } from "react-virtual"

const parentRef = useRef<HTMLDivElement>(null)
const rowVirtualizer = useVirtual({
  size: features.length,
  parentRef,
  estimateSize: useCallback(() => 50, [])
})

return (
  <div ref={parentRef} className="h-96 overflow-auto">
    <div style={{ height: `${rowVirtualizer.totalSize}px` }}>
      {rowVirtualizer.virtualItems.map(virtualRow => (
        <div key={virtualRow.index}>
          {features[virtualRow.index].name}
        </div>
      ))}
    </div>
  </div>
)
```

**Use Web Workers for Heavy Computation:**
```typescript
// workers/convert.ts
import { expose } from "comlink"

export const api = {
  convertShapefile: async (buffer: ArrayBuffer) => {
    // Heavy processing
    return result
  }
}

expose(api)

// In component
import { wrap } from "comlink"
const worker = wrap<typeof api>(new Worker(new URL("workers/convert", import.meta.url)))

const result = await worker.convertShapefile(buffer)
```

**Memoize Expensive Computations:**
```typescript
import { useMemo } from "react"

const statistics = useMemo(() => {
  return calculateStatistics(features)  // Expensive
}, [features])
```

---

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from "vitest"

describe("FeatureConverter", () => {
  describe("convertKML", () => {
    it("converts valid KML to GeoJSON", () => {
      const kml = '<kml>...</kml>'
      const result = convertKML(kml)

      expect(result).toBeRight()
      expect(result).toMatchObject({
        type: "FeatureCollection",
        features: expect.any(Array)
      })
    })

    it("returns error for invalid KML", () => {
      const invalid = 'not kml'
      const result = convertKML(invalid)

      expect(result).toBeLeft()
    })
  })
})
```

### Custom Matchers

**Either Types:**
```typescript
expect(result).toBeRight()
expect(result).toBeLeft()
expect(result).toEqualRight(expectedValue)
expect(result).toEqualLeft("error message")
```

**Maybe Types:**
```typescript
expect(value).toBeJust()
expect(value).toBeNothing()
```

### Mocking

**Mock Prisma:**
```typescript
import db from "db"
import { vi } from "vitest"

vi.mock("db", () => ({
  default: {
    wrappedFeature: {
      findMany: vi.fn(),
      create: vi.fn()
    }
  }
}))

// In test
vi.mocked(db.wrappedFeature.findMany).mockResolvedValue([...])
```

**Mock Blitz Context:**
```typescript
const mockCtx = {
  session: {
    userId: "user-123",
    orgId: "org-456",
    $authorize: vi.fn()
  }
}
```

---

## Common Tasks

### Adding a New Feature to the Map Editor

**1. Define Database Schema:**
```prisma
// db/schema.prisma
model WrappedFeature {
  id        String   @id @default(uuid())
  // ... existing fields
  newField  String?  // Add new field
}
```

```bash
npx prisma migrate dev --name add_feature_new_field
```

**2. Create Mutation:**
```typescript
// app/wrappedFeatures/mutations/updateNewField.ts
import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const Schema = z.object({
  id: z.string(),
  newField: z.string()
})

export default resolver.pipe(
  resolver.zod(Schema),
  resolver.authorize(),
  async ({ id, newField }, ctx) => {
    // Authorization check
    const feature = await db.wrappedFeature.findFirst({
      where: { id },
      include: { wrappedFeatureCollection: true }
    })

    if (feature?.wrappedFeatureCollection.organizationId !== ctx.session.orgId) {
      throw new Error("Unauthorized")
    }

    return await db.wrappedFeature.update({
      where: { id },
      data: { newField }
    })
  }
)
```

**3. Add to Replicache (if synced):**
```typescript
// app/lib/replicache/client.ts
export const mutators = {
  // ... existing mutators
  async updateFeatureNewField(tx: WriteTransaction, args: { id: string, newField: string }) {
    const existing = await tx.get(`feature/${args.id}`)
    if (!existing) return

    await tx.put(`feature/${args.id}`, {
      ...existing,
      newField: args.newField
    })
  }
}

// app/lib/replicache/validation.ts
case "updateFeatureNewField": {
  const Schema = z.object({
    id: z.string(),
    newField: z.string()
  })

  const parsed = Schema.safeParse(args)
  if (!parsed.success) return false

  // Process server-side
  await db.wrappedFeature.update({
    where: { id: parsed.data.id },
    data: { newField: parsed.data.newField }
  })

  return true
}
```

**4. Create UI Component:**
```typescript
// app/components/panels/NewFieldPanel.tsx
import { FC } from "react"
import { useAtomValue } from "jotai"
import { selectionAtom } from "state/jotai"
import { useReplicache } from "app/lib/replicache/context"

export const NewFieldPanel: FC = () => {
  const selection = useAtomValue(selectionAtom)
  const rep = useReplicache()

  if (selection.type !== "single") return null

  const handleUpdate = async (value: string) => {
    await rep.mutate.updateFeatureNewField({
      id: selection.id,
      newField: value
    })
  }

  return (
    <div className="p-4">
      <label>New Field</label>
      <input
        type="text"
        onChange={(e) => handleUpdate(e.target.value)}
        className="rounded border px-2 py-1"
      />
    </div>
  )
}
```

**5. Add Tests:**
```typescript
// app/wrappedFeatures/mutations/updateNewField.test.ts
import { describe, it, expect } from "vitest"
import updateNewField from "./updateNewField"

describe("updateNewField", () => {
  it("updates the field", async () => {
    const result = await updateNewField(
      { id: "123", newField: "value" },
      mockCtx
    )

    expect(result.newField).toBe("value")
  })
})
```

### Adding a New File Format Converter

**1. Create Converter:**
```typescript
// app/lib/convert/local/my_format.ts
import { Either, Left, Right } from "purify-ts"
import type { ConvertResult } from "../types"

export function myFormatToGeoJSONFeatureCollection(
  data: ArrayBuffer
): Either<string, ConvertResult> {
  try {
    // Parse format
    const parsed = parseMyFormat(data)

    // Convert to GeoJSON
    const features = parsed.items.map(item => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [item.lon, item.lat]
      },
      properties: { ...item.metadata }
    }))

    return Right({
      type: "success" as const,
      result: {
        type: "FeatureCollection" as const,
        features
      }
    })
  } catch (error) {
    return Left(`Failed to parse: ${error}`)
  }
}
```

**2. Register Format:**
```typescript
// app/lib/convert/utils.ts
export const IMPORTABLE_FORMATS = {
  // ... existing formats
  ".myformat": {
    name: "My Format",
    converter: myFormatToGeoJSONFeatureCollection
  }
}
```

**3. Add Tests:**
```typescript
// app/lib/convert/local/my_format.test.ts
import { describe, it, expect } from "vitest"
import { myFormatToGeoJSONFeatureCollection } from "./my_format"

describe("myFormatToGeoJSONFeatureCollection", () => {
  it("converts valid file", () => {
    const buffer = new TextEncoder().encode("valid data")
    const result = myFormatToGeoJSONFeatureCollection(buffer)

    expect(result).toBeRight()
    expect(result).toMatchObject({
      type: "success",
      result: {
        type: "FeatureCollection",
        features: expect.any(Array)
      }
    })
  })
})
```

### Adding a New Map Operation

**1. Create Operation Function:**
```typescript
// app/lib/map_operations/buffer.ts
import buffer from "@turf/buffer"
import { Either, Right, Left } from "purify-ts"

export function bufferFeatures(
  features: GeoJSON.Feature[],
  distance: number,
  units: "meters" | "kilometers" = "meters"
): Either<string, GeoJSON.Feature[]> {
  try {
    const buffered = features.map(feature => {
      const result = buffer(feature, distance, { units })
      if (!result) throw new Error("Buffer failed")
      return result
    })

    return Right(buffered)
  } catch (error) {
    return Left(`Buffer operation failed: ${error}`)
  }
}
```

**2. Add UI Trigger:**
```typescript
// app/components/dialogs/BufferDialog.tsx
import { FC, useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { selectionAtom, dataAtom } from "state/jotai"
import { bufferFeatures } from "app/lib/map_operations/buffer"
import { useReplicache } from "app/lib/replicache/context"

export const BufferDialog: FC = () => {
  const selection = useAtomValue(selectionAtom)
  const data = useAtomValue(dataAtom)
  const rep = useReplicache()
  const [distance, setDistance] = useState(100)

  const handleBuffer = async () => {
    const selectedFeatures = USelection.ids(selection)
      .map(id => data.features.get(id))
      .filter(Boolean)

    const result = bufferFeatures(selectedFeatures, distance)

    result
      .mapLeft(error => toast.error(error))
      .ifRight(async buffered => {
        // Create new features
        for (const feature of buffered) {
          await rep.mutate.createFeature({ feature })
        }
      })
  }

  return (
    <Dialog.Root>
      {/* Dialog UI */}
      <button onClick={handleBuffer}>Buffer</button>
    </Dialog.Root>
  )
}
```

---

## Troubleshooting

### Common Issues

**Issue: Type errors after schema change**
```bash
# Solution: Regenerate Prisma Client
npx prisma generate

# Restart dev server
```

**Issue: Database connection errors**
```bash
# Check PostgreSQL is running
# macOS:
brew services list

# Ubuntu:
sudo systemctl status postgresql

# Check .env has correct DATABASE_URL
DATABASE_URL=postgres://postgres:postgres@localhost:5432/placemark
```

**Issue: pnpm install fails**
```bash
# Clear cache and retry
pnpm store prune
pnpm install
```

**Issue: Tests failing with module resolution errors**
```bash
# Make sure vitest.config.ts includes paths
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()]
})
```

**Issue: Replicache not syncing**
- Check WebSocket connection (browser console)
- Verify version increments in mutations
- Check `/api/replicache-pull` returns data
- Ensure `rep.mutate.*` calls are awaited

**Issue: Build errors with "Cannot find module"**
```bash
# Ensure @blitzjs packages are same version
pnpm list @blitzjs/auth @blitzjs/next @blitzjs/rpc

# Should all be 2.0.2
```

### Environment Variables

**Required Minimum (.env):**
```bash
DATABASE_URL="postgres://postgres:postgres@localhost:5432/placemark"
SESSION_SECRET_KEY="generate-with-openssl-rand-hex-32"

# Replicache (required for sync)
REPLICACHE_LICENSE_KEY="your-key"

# GitHub OAuth (required for Gist integration)
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
```

**Optional Services:**
```bash
# Error tracking
SENTRY_DSN="your-sentry-dsn"

# Email
POSTMARK_TOKEN="your-token"

# SSO
WORKOS_API_KEY="your-key"
WORKOS_CLIENT_ID="your-client-id"

# Logging
LOGTAIL_TOKEN="your-token"

# Cloudflare
CLOUDFLARE_ACCOUNT_ID="your-id"
CLOUDFLARE_IMAGES_TOKEN="your-token"
```

**Check Required Vars:**
```typescript
// See app/lib/env_server.ts and app/lib/env_client.ts
// App will crash on startup if required vars are missing
```

### Debugging

**Enable Verbose Logging:**
```typescript
// Add to any file
import { logger } from "integrations/log"

logger.debug("Debug info", { data })
logger.info("Info message")
logger.warn("Warning")
logger.error("Error", error)
```

**Prisma Query Logging:**
```typescript
// db/index.ts
const db = new PrismaClient({
  log: ["query", "info", "warn", "error"]
})
```

**Replicache Debug:**
```typescript
const rep = useReplicache()
console.log(await rep.query(tx => tx.scan().toArray()))
```

---

## Additional Resources

### Documentation
- `docs/architecture.md` - Detailed architecture notes
- `docs/docker.md` - Docker deployment guide
- `docs/performance.md` - Performance optimization notes
- `README.md` - Setup instructions

### External Documentation
- [Blitz.js Docs](https://blitzjs.com/docs)
- [Replicache Docs](https://doc.replicache.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [Jotai Docs](https://jotai.org)
- [Radix UI Docs](https://www.radix-ui.com)
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Turf.js Docs](https://turfjs.org)

### Code References
When referencing code locations, use the format `file_path:line_number`:
- Example: "Feature validation happens in `app/lib/replicache/validation.ts:145`"

---

## Summary: Key Principles for AI Assistants

1. **Always validate with Zod** in mutations/queries
2. **Use Either types** for expected failures, throw for unexpected
3. **Never mutate** - create new objects for state updates
4. **Check authorization** before any data modification
5. **Use Replicache** for synced data (features, folders, layers)
6. **Use Jotai** for ephemeral UI state (selection, mode, dialogs)
7. **Virtualize lists** over 50 items for performance
8. **Colocate tests** with source files
9. **Follow fractional indexing** for ordering
10. **Use pnpm** - never npm or yarn

This codebase is production-grade with strong typing, comprehensive error handling, and offline-first architecture. Maintain these standards when making changes.

---

**Last Updated:** 2025-11-16
**Codebase Version:** Blitz.js 2.0.2, Next.js 14, React 18, TypeScript 5
