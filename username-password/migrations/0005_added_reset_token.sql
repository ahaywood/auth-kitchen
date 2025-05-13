-- DropIndex
DROP INDEX "User_username_email_verificationToken_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "resetTokenExpires" DATETIME;

-- DropTable
PRAGMA foreign_keys=off;
PRAGMA foreign_keys=on;

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "User_username_email_verificationToken_resetToken_idx" ON "User"("username", "email", "verificationToken", "resetToken");
