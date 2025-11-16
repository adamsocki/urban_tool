import { describe, it, expect, vi, beforeEach } from "vitest"
import getPlanningProjects from "./getPlanningProjects"
import { PlanningProjectType, PlanningProjectStatus } from "db"

// Mock the database
vi.mock("db", () => ({
  default: {
    planningProject: {
      findMany: vi.fn(),
    },
  },
  PlanningProjectStatus: {
    DRAFT: "DRAFT",
    SCOPING: "SCOPING",
    IN_PROGRESS: "IN_PROGRESS",
    REVIEW: "REVIEW",
    COMPLETE: "COMPLETE",
    ARCHIVED: "ARCHIVED",
  },
}))

describe("getPlanningProjects", () => {
  const mockCtx = {
    session: {
      userId: 1,
      orgId: 1,
      $authorize: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns all planning projects for organization", async () => {
    const mockProjects = [
      {
        id: "project-1",
        name: "Bike Plan",
        description: "Downtown bike infrastructure",
        type: "BIKE_PLAN",
        status: "IN_PROGRESS",
        organizationId: 1,
        createdById: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
        },
        _count: {
          linkedMaps: 2,
        },
      },
      {
        id: "project-2",
        name: "Comprehensive Plan",
        description: "City-wide planning",
        type: "COMPREHENSIVE_PLAN",
        status: "DRAFT",
        organizationId: 1,
        createdById: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
        },
        _count: {
          linkedMaps: 0,
        },
      },
    ]

    const db = await import("db")
    vi.mocked(db.default.planningProject.findMany).mockResolvedValue(
      mockProjects
    )

    const result = await getPlanningProjects({}, mockCtx)

    expect(result).toEqual(mockProjects)
    expect(db.default.planningProject.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 1,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            linkedMaps: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })
  })

  it("filters projects by status", async () => {
    const db = await import("db")
    vi.mocked(db.default.planningProject.findMany).mockResolvedValue([])

    await getPlanningProjects(
      { status: PlanningProjectStatus.IN_PROGRESS },
      mockCtx
    )

    expect(db.default.planningProject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 1,
          status: PlanningProjectStatus.IN_PROGRESS,
        },
      })
    )
  })

  it("throws error when no organization is found", async () => {
    const ctxWithoutOrg = {
      session: {
        userId: 1,
        orgId: undefined,
        $authorize: vi.fn(),
      },
    }

    await expect(
      getPlanningProjects({}, ctxWithoutOrg)
    ).rejects.toThrow("No organization found")
  })
})
