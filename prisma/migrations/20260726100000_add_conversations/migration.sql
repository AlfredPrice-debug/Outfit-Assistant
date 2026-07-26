-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_userId_isArchived_createdAt_idx" ON "Conversation"("userId", "isArchived", "createdAt");

-- Backfill: give every distinct existing userId in ChatMessage a single
-- conversation to attach its history to, so no existing row is orphaned.
INSERT INTO "Conversation" ("id", "userId", "isArchived", "createdAt")
SELECT 'legacy-' || "userId", "userId", false, MIN("createdAt")
FROM "ChatMessage"
GROUP BY "userId";

-- AlterTable: add the column nullable first so existing rows aren't rejected
ALTER TABLE "ChatMessage" ADD COLUMN "conversationId" TEXT;

-- Backfill existing messages onto their user's legacy conversation
UPDATE "ChatMessage" SET "conversationId" = 'legacy-' || "userId";

-- Now that every row has a value, require it going forward
ALTER TABLE "ChatMessage" ALTER COLUMN "conversationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
