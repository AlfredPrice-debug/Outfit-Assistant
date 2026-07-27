-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "preferredChatMode" TEXT NOT NULL DEFAULT 'conversation',
    "swipeCardCount" INTEGER NOT NULL DEFAULT 5,
    "chatFollowUpCount" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);
