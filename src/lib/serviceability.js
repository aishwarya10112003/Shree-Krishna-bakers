// Client-side mirror of the backend serviceability math. The SERVER is still
// authoritative at checkout — this is only for instant UX (banners, fee preview,
// greying buttons) so the user gets feedback without a round-trip.

export function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function computeDeliveryFee(distanceKm, s) {
  if (distanceKm <= s.freeDeliveryRadiusKm) return 0;
  return s.baseDeliveryFee + Math.ceil(distanceKm - s.freeDeliveryRadiusKm) * s.perKmFee;
}

export function isWithinHours(openTime, closeTime, now = new Date()) {
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  return open <= close ? mins >= open && mins < close : mins >= open || mins < close;
}
