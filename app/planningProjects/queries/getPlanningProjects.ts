import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"
import { PlanningProjectStatus } from "db"

const GetPlanningProjectsSchema = z.object({
  status: z.nativeEnum(PlanningProjectStatus).optional(),
})

export default resolver.pipe(
  resolver.zod(GetPlanningProjectsSchema),
  resolver.authorize(),
  async (input, ctx) => {
    const { status } = input

    if (!ctx.session.orgId) {
      throw new Error("No organization found")
    }

    const projects = await db.planningProject.findMany({
      where: {
        organizationId: ctx.session.orgId,
        ...(status ? { status } : {}),
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

    return projects
  }
)
