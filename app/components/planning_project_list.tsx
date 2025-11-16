import { useQuery, useMutation, invalidateQuery } from "@blitzjs/rpc"
import getPlanningProjects from "app/planningProjects/queries/getPlanningProjects"
import deletePlanningProject from "app/planningProjects/mutations/deletePlanningProject"
import { toast } from "react-hot-toast"
import * as Sentry from "@sentry/nextjs"
import { Button } from "./elements"
import { TrashIcon } from "@radix-ui/react-icons"
import { PlanningProjectType, PlanningProjectStatus } from "db"
import { formatDistanceToNow } from "date-fns"

const PROJECT_TYPE_LABELS: Record<PlanningProjectType, string> = {
  [PlanningProjectType.CUSTOM]: "Custom",
  [PlanningProjectType.COMPREHENSIVE_PLAN]: "Comprehensive Plan",
  [PlanningProjectType.BIKE_PLAN]: "Bike Plan",
  [PlanningProjectType.PEDESTRIAN_PLAN]: "Pedestrian Plan",
  [PlanningProjectType.WALKABILITY_STUDY]: "Walkability Study",
  [PlanningProjectType.TRANSIT_RIDERSHIP_FORECAST]: "Transit Ridership",
  [PlanningProjectType.SS4A_SAFETY_PLAN]: "SS4A Safety Plan",
  [PlanningProjectType.FOOD_DESERT_ANALYSIS]: "Food Desert Analysis",
  [PlanningProjectType.COMMUNITY_HEALTH_PLAN]: "Community Health Plan",
  [PlanningProjectType.NEIGHBORHOOD_PLAN]: "Neighborhood Plan",
  [PlanningProjectType.ROAD_DIET_ANALYSIS]: "Road Diet Analysis",
  [PlanningProjectType.ROADWAY_REMOVAL_FOR_PARKS]: "Roadway Removal",
}

const STATUS_COLORS: Record<PlanningProjectStatus, string> = {
  [PlanningProjectStatus.DRAFT]: "bg-gray-100 text-gray-800",
  [PlanningProjectStatus.SCOPING]: "bg-blue-100 text-blue-800",
  [PlanningProjectStatus.IN_PROGRESS]: "bg-yellow-100 text-yellow-800",
  [PlanningProjectStatus.REVIEW]: "bg-purple-100 text-purple-800",
  [PlanningProjectStatus.COMPLETE]: "bg-green-100 text-green-800",
  [PlanningProjectStatus.ARCHIVED]: "bg-gray-100 text-gray-500",
}

export function PlanningProjectList() {
  const [projects, { refetch }] = useQuery(getPlanningProjects, {})
  const [deletePlanningProjectMutation] = useMutation(deletePlanningProject)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      await deletePlanningProjectMutation({ id })
      await invalidateQuery(getPlanningProjects, {})
      toast.success("Planning project deleted")
    } catch (error) {
      Sentry.captureException(error)
      toast.error("Failed to delete planning project")
    }
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Planning Projects</h2>
        <div className="text-gray-500 text-sm">
          No planning projects yet. Create one to get started!
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-3">Planning Projects</h2>
      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-x-2 mb-1">
                <h3 className="font-medium truncate">{project.name}</h3>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    STATUS_COLORS[project.status]
                  }`}
                >
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-x-4 text-sm text-gray-600">
                <span>{PROJECT_TYPE_LABELS[project.type]}</span>
                {project._count.linkedMaps > 0 && (
                  <span>{project._count.linkedMaps} map(s)</span>
                )}
                <span>
                  Updated{" "}
                  {formatDistanceToNow(new Date(project.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-x-2 ml-4">
              <Button
                variant="quiet"
                size="sm"
                onClick={() => handleDelete(project.id, project.name)}
                aria-label="Delete project"
              >
                <TrashIcon />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
