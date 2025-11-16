-- CreateEnum
CREATE TYPE "PlanningProjectType" AS ENUM ('COMPREHENSIVE_PLAN', 'BIKE_PLAN', 'PEDESTRIAN_PLAN', 'WALKABILITY_STUDY', 'TRANSIT_RIDERSHIP_FORECAST', 'SS4A_SAFETY_PLAN', 'FOOD_DESERT_ANALYSIS', 'COMMUNITY_HEALTH_PLAN', 'NEIGHBORHOOD_PLAN', 'ROAD_DIET_ANALYSIS', 'ROADWAY_REMOVAL_FOR_PARKS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PlanningProjectStatus" AS ENUM ('DRAFT', 'SCOPING', 'IN_PROGRESS', 'REVIEW', 'COMPLETE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "PlanningProject" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL DEFAULT 'Untitled Planning Project',
    "description" TEXT NOT NULL DEFAULT '',
    "type" "PlanningProjectType" NOT NULL DEFAULT 'CUSTOM',
    "status" "PlanningProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "organizationId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "config" JSONB,
    "conversationHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningProjectMap" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "planningProjectId" UUID NOT NULL,
    "wrappedFeatureCollectionId" TEXT NOT NULL,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningProjectMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningProject_organizationId_idx" ON "PlanningProject"("organizationId");

-- CreateIndex
CREATE INDEX "PlanningProject_createdById_idx" ON "PlanningProject"("createdById");

-- CreateIndex
CREATE INDEX "PlanningProject_status_idx" ON "PlanningProject"("status");

-- CreateIndex
CREATE INDEX "PlanningProjectMap_planningProjectId_idx" ON "PlanningProjectMap"("planningProjectId");

-- CreateIndex
CREATE INDEX "PlanningProjectMap_wrappedFeatureCollectionId_idx" ON "PlanningProjectMap"("wrappedFeatureCollectionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningProjectMap_planningProjectId_wrappedFeatureCollecti_key" ON "PlanningProjectMap"("planningProjectId", "wrappedFeatureCollectionId");

-- AddForeignKey
ALTER TABLE "PlanningProject" ADD CONSTRAINT "PlanningProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningProject" ADD CONSTRAINT "PlanningProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningProjectMap" ADD CONSTRAINT "PlanningProjectMap_planningProjectId_fkey" FOREIGN KEY ("planningProjectId") REFERENCES "PlanningProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningProjectMap" ADD CONSTRAINT "PlanningProjectMap_wrappedFeatureCollectionId_fkey" FOREIGN KEY ("wrappedFeatureCollectionId") REFERENCES "WrappedFeatureCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
