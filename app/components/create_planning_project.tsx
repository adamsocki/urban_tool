import { invalidateQuery, useMutation } from "@blitzjs/rpc"
import { useState } from "react"
import * as Sentry from "@sentry/nextjs"
import { toast } from "react-hot-toast"
import {
  Button,
  StyledPopoverContent,
  StyledPopoverArrow,
  PopoverTitleAndClose,
  StyledField,
} from "app/components/elements"
import * as P from "@radix-ui/react-popover"
import Form from "app/core/components/Form"
import { z } from "zod"
import createPlanningProject from "app/planningProjects/mutations/createPlanningProject"
import getPlanningProjects from "app/planningProjects/queries/getPlanningProjects"
import { PlanningProjectType } from "db"
import { useRouter } from "next/router"

const CreatePlanningProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(PlanningProjectType),
  description: z.string().optional(),
})

export function CreatePlanningProject() {
  const router = useRouter()
  const [createPlanningProjectMutation] = useMutation(createPlanningProject)
  const [open, setOpen] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <P.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <P.Trigger asChild>
        <Button variant="primary">New Planning Project</Button>
      </P.Trigger>
      <StyledPopoverContent align="end" style={{ minWidth: 400 }}>
        <StyledPopoverArrow />
        <PopoverTitleAndClose title="Create Planning Project" />
        <Form
          initialValues={{
            name: "",
            type: PlanningProjectType.CUSTOM,
            description: "",
          }}
          schema={CreatePlanningProjectSchema}
          onSubmit={async (values, actions) => {
            setIsSubmitting(true)
            try {
              const project = await createPlanningProjectMutation(values)
              await invalidateQuery(getPlanningProjects, {})
              toast.success("Planning project created")
              actions.resetForm()
              setOpen(false)
              // TODO: Navigate to project detail page when it exists
              // router.push(`/planning-projects/${project.id}`)
            } catch (error) {
              Sentry.captureException(error)
              toast.error("Failed to create planning project")
            } finally {
              setIsSubmitting(false)
            }
          }}
        >
          <div className="flex flex-col gap-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <StyledField name="name" type="text" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <StyledField as="select" name="type" required>
                <option value={PlanningProjectType.CUSTOM}>Custom</option>
                <option value={PlanningProjectType.COMPREHENSIVE_PLAN}>
                  Comprehensive Plan
                </option>
                <option value={PlanningProjectType.BIKE_PLAN}>
                  Bike Plan
                </option>
                <option value={PlanningProjectType.PEDESTRIAN_PLAN}>
                  Pedestrian Plan
                </option>
                <option value={PlanningProjectType.WALKABILITY_STUDY}>
                  Walkability Study
                </option>
                <option value={PlanningProjectType.TRANSIT_RIDERSHIP_FORECAST}>
                  Transit Ridership Forecast
                </option>
                <option value={PlanningProjectType.SS4A_SAFETY_PLAN}>
                  SS4A Safety Plan
                </option>
                <option value={PlanningProjectType.FOOD_DESERT_ANALYSIS}>
                  Food Desert Analysis
                </option>
                <option value={PlanningProjectType.COMMUNITY_HEALTH_PLAN}>
                  Community Health Plan
                </option>
                <option value={PlanningProjectType.NEIGHBORHOOD_PLAN}>
                  Neighborhood Plan
                </option>
                <option value={PlanningProjectType.ROAD_DIET_ANALYSIS}>
                  Road Diet Analysis
                </option>
                <option value={PlanningProjectType.ROADWAY_REMOVAL_FOR_PARKS}>
                  Roadway Removal for Parks
                </option>
              </StyledField>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <StyledField
                as="textarea"
                name="description"
                rows={3}
                placeholder="Brief description of the project..."
              />
            </div>
            <div className="flex justify-end gap-x-2">
              <Button
                type="button"
                variant="quiet"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </Form>
      </StyledPopoverContent>
    </P.Root>
  )
}
