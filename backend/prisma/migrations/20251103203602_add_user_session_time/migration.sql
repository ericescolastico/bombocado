-- CreateTable
CREATE TABLE "user_session_times" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionDate" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_session_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_session_times_userId_idx" ON "user_session_times"("userId");

-- CreateIndex
CREATE INDEX "user_session_times_sessionDate_idx" ON "user_session_times"("sessionDate");

-- CreateIndex
CREATE INDEX "user_session_times_userId_sessionDate_idx" ON "user_session_times"("userId", "sessionDate");

-- AddForeignKey
ALTER TABLE "user_session_times" ADD CONSTRAINT "user_session_times_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
