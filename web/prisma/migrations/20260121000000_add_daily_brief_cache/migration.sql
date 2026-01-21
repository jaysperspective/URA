-- CreateTable
CREATE TABLE "DailyBriefCache" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ymdLocal" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBriefCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyBriefCache_userId_idx" ON "DailyBriefCache"("userId");

-- CreateIndex
CREATE INDEX "DailyBriefCache_ymdLocal_idx" ON "DailyBriefCache"("ymdLocal");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBriefCache_userId_ymdLocal_key" ON "DailyBriefCache"("userId", "ymdLocal");
