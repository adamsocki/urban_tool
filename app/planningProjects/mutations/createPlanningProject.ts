import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"
import { PlanningProjectType, PlanningProjectStatus } from "db"

const CreatePlanningProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(PlanningProjectType).optional(),
})

export default resolver.pipe(
  resolver.zod(CreatePlanningProjectSchema),
  resolver.authorize(),
  async (input, ctx) => {
    const { name, description, type } = input

    if (!ctx.session.orgId) {
      throw new Error("No organization found")
    }

    const planningProject = await db.planningProject.create({
      data: {
        name: name || "Untitled Planning Project",
        description: description || "",
        type: type || PlanningProjectType.CUSTOM,
        status: PlanningProjectStatus.DRAFT,
        organizationId: ctx.session.orgId,
        createdById: ctx.session.userId,
      },
    })

    return planningProject
  }
)
