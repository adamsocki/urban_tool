import { describe, it, expect, vi, beforeEach } from "vitest"
import createPlanningProject from "./createPlanningProject"
import { PlanningProjectType, PlanningProjectStatus } from "db"

// Mock the database
vi.mock("db", () => ({
  default: {
    planningProject: {
      create: vi.fn(),
    },
  },
  PlanningProjectType: {
    CUSTOM: "CUSTOM",
    COMPREHENSIVE_PLAN: "COMPREHENSIVE_PLAN",
    BIKE_PLAN: "BIKE_PLAN",
    PEDESTRIAN_PLAN: "PEDESTRIAN_PLAN",
    WALKABILITY_STUDY: "WALKABILITY_STUDY",
    TRANSIT_RIDERSHIP_FORECAST: "TRANSIT_RIDERSHIP_FORECAST",
    SS4A_SAFETY_PLAN: "SS4A_SAFETY_PLAN",
    FOOD_DESERT_ANALYSIS: "FOOD_DESERT_ANALYSIS",
    COMMUNITY_HEALTH_PLAN: "COMMUNITY_HEALTH_PLAN",
    NEIGHBORHOOD_PLAN: "NEIGHBORHOOD_PLAN",
    ROAD_DIET_ANALYSIS: "ROAD_DIET_ANALYSIS",
    ROADWAY_REMOVAL_FOR_PARKS: "ROADWAY_REMOVAL_FOR_PARKS",
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

describe("createPlanningProject", () => {
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

  it("creates a planning project with default values", async () => {
    const mockProject = {
      id: "test-id",
      name: "Untitled Planning Project",
      description: "",
      type: PlanningProjectType.CUSTOM,
      status: PlanningProjectStatus.DRAFT,
      organizationId: 1,
      createdById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const db = await import("db")
    vi.mocked(db.default.planningProject.create).mockResolvedValue(mockProject)

    const result = await createPlanningProject({}, mockCtx)

    expect(result).toEqual(mockProject)
    expect(db.default.planningProject.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Untitled Planning Project",
        description: "",
        type: PlanningProjectType.CUSTOM,
        status: PlanningProjectStatus.DRAFT,
        organizationId: 1,
        createdById: 1,
      }),
    })
  })

  it("creates a planning project with custom values", async () => {
    const mockProject = {
      id: "test-id",
      name: "Downtown Bike Plan",
      description: "A comprehensive bike plan",
      type: PlanningProjectType.BIKE_PLAN,
      status: PlanningProjectStatus.DRAFT,
      organizationId: 1,
      createdById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const db = await import("db")
    vi.mocked(db.default.planningProject.create).mockResolvedValue(mockProject)

    const result = await createPlanningProject(
      {
        name: "Downtown Bike Plan",
        description: "A comprehensive bike plan",
        type: PlanningProjectType.BIKE_PLAN,
      },
      mockCtx
    )

    expect(result).toEqual(mockProject)
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
      createPlanningProject({}, ctxWithoutOrg)
    ).rejects.toThrow("No organization found")
  })
})
