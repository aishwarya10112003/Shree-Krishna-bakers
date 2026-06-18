-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('DELIVERY', 'DINE_IN');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FLAT');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "assignedAgent" TEXT,
ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "deliveryFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryLat" DOUBLE PRECISION,
ADD COLUMN     "deliveryLng" DOUBLE PRECISION,
ADD COLUMN     "deliveryType" "DeliveryType" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "distanceKm" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "comingSoon" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "bakeryName" TEXT NOT NULL DEFAULT 'Shri Krishna Bakers',
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 26.9124,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 75.7873,
    "address" TEXT,
    "deliveryRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "freeDeliveryRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "baseDeliveryFee" INTEGER NOT NULL DEFAULT 20,
    "perKmFee" INTEGER NOT NULL DEFAULT 6,
    "openTime" TEXT NOT NULL DEFAULT '10:00',
    "closeTime" TEXT NOT NULL DEFAULT '22:00',
    "onlineOrderingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "CouponType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minOrderAmount" INTEGER NOT NULL DEFAULT 0,
    "maxDiscount" INTEGER,
    "isAuto" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_active_idx" ON "Coupon"("active");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_published_createdAt_idx" ON "BlogPost"("published", "createdAt");
