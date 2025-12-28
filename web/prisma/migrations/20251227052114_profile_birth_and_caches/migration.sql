-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "asOfDate" TIMESTAMP(3),
ADD COLUMN     "ascYearJson" JSONB,
ADD COLUMN     "birthDay" INTEGER,
ADD COLUMN     "birthHour" INTEGER,
ADD COLUMN     "birthLat" DOUBLE PRECISION,
ADD COLUMN     "birthLon" DOUBLE PRECISION,
ADD COLUMN     "birthMinute" INTEGER,
ADD COLUMN     "birthMonth" INTEGER,
ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "dailyUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "lunationJson" JSONB,
ADD COLUMN     "natalChartJson" JSONB,
ADD COLUMN     "natalUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York';

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
