import type { StoreSettings } from "@prisma/client";
import { haversineKm } from "./geo";

export interface ServiceabilityResult {
  distanceKm: number;
  serviceable: boolean; // within the admin-set delivery radius
  withinHours: boolean; // within business hours
  orderingEnabled: boolean;
  deliveryFee: number;
  freeDeliveryRadiusKm: number;
  deliveryRadiusKm: number;
}

/** Is `now` inside the [openTime, closeTime) window? Handles overnight windows. */
export function isWithinHours(
  openTime: string,
  closeTime: string,
  now: Date = new Date(),
): boolean {
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  return open <= close ? mins >= open && mins < close : mins >= open || mins < close;
}

/** Free under the free-radius; otherwise base + per-km beyond it (whole rupees). */
export function computeDeliveryFee(
  distanceKm: number,
  settings: StoreSettings,
): number {
  if (distanceKm <= settings.freeDeliveryRadiusKm) return 0;
  const billableKm = Math.ceil(distanceKm - settings.freeDeliveryRadiusKm);
  return settings.baseDeliveryFee + billableKm * settings.perKmFee;
}

/** Single source of truth for "can we deliver here, and for how much?". */
export function evaluateServiceability(
  settings: StoreSettings,
  lat: number,
  lng: number,
  now: Date = new Date(),
): ServiceabilityResult {
  const distanceKm = Number(
    haversineKm(settings.latitude, settings.longitude, lat, lng).toFixed(2),
  );
  return {
    distanceKm,
    serviceable: distanceKm <= settings.deliveryRadiusKm,
    withinHours: isWithinHours(settings.openTime, settings.closeTime, now),
    orderingEnabled: settings.onlineOrderingEnabled,
    deliveryFee: computeDeliveryFee(distanceKm, settings),
    freeDeliveryRadiusKm: settings.freeDeliveryRadiusKm,
    deliveryRadiusKm: settings.deliveryRadiusKm,
  };
}
