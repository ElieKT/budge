-- CreateEnum
CREATE TYPE "ThemeMode" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AppLocale" AS ENUM ('EN', 'FR', 'ES');

-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#159d63',
ADD COLUMN     "locale" "AppLocale" NOT NULL DEFAULT 'EN',
ADD COLUMN     "theme" "ThemeMode" NOT NULL DEFAULT 'SYSTEM';
