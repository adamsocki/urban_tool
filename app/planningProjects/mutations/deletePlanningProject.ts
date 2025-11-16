import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const DeletePlanningProjectSchema = z.object({
  id: z.string().uuid(),
})

export default resolver.pipe(
  resolver.zod(DeletePlanningProjectSchema),
  resolver.authorize(),
  async (input, ctx) => {
    const { id } = input

    // Check authorization - user must belong to same organization as project
    const project = await db.planningProject.findFirst({
      where: { id },
      select: { organizationId: true },
    })

    if (!project) {
      throw new Error("Planning project not found")
    }

    if (project.organizationId !== ctx.session.orgId) {
      throw new Error("Not authorized to delete this project")
    }

    await db.planningProject.delete({
      where: { id },
    })

    return { success: true }
  }
)
