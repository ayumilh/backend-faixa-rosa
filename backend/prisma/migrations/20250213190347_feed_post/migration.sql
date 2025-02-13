/*
  Warnings:

  - You are about to drop the column `content` on the `FeedPost` table. All the data in the column will be lost.
  - You are about to drop the column `featuredImage` on the `FeedPost` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `FeedPost` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerHour` on the `FeedPost` table. All the data in the column will be lost.
  - Added the required column `mediaType` to the `FeedPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mediaUrl` to the `FeedPost` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FeedPost" DROP COLUMN "content",
DROP COLUMN "featuredImage",
DROP COLUMN "location",
DROP COLUMN "pricePerHour",
ADD COLUMN     "mediaType" TEXT NOT NULL,
ADD COLUMN     "mediaUrl" TEXT NOT NULL,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "lastOnline" DROP NOT NULL;
