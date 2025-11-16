import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"
import { PlanningProjectType, PlanningProjectStatus } from "db"

const UpdatePlanningProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(PlanningProjectType).optional(),
  status: z.nativeEnum(PlanningProjectStatus).optional(),
  config: z.any().optional(),
  conversationHistory: z.any().optional(),
})

export default resolver.pipe(
  resolver.zod(UpdatePlanningProjectSchema),
  resolver.authorize(),
  async (input, ctx) => {
    const { id, ...data } = input

    // Check authorization - user must belong to same organization as project
    const project = await db.planningProject.findFirst({
      where: { id },
      select: { organizationId: true },
    })

    if (!project) {
      throw new Error("Planning project not found")
    }

    if (project.organizationId !== ctx.session.orgId) {
      throw new Error("Not authorized to update this project")
    }

    const updatedProject = await db.planningProject.update({
      where: { id },
      data,
    })

    return updatedProject
  }
)
