/*
  Warnings:

  - Added the required column `colorStory` to the `Outfit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Outfit" ADD COLUMN     "colorStory" JSONB NOT NULL;
