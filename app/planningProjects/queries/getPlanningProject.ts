import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const GetPlanningProjectSchema = z.object({
  id: z.string().uuid(),
})

export default resolver.pipe(
  resolver.zod(GetPlanningProjectSchema),
  resolver.authorize(),
  async (input, ctx) => {
    const { id } = input

    const project = await db.planningProject.findFirst({
      where: {
        id,
        organizationId: ctx.session.orgId!,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        linkedMaps: {
          include: {
            wrappedFeatureCollection: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    })

    if (!project) {
      throw new Error("Planning project not found")
    }

    return project
  }
)
