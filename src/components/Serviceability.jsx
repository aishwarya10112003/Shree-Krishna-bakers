import React from "react";
import { useDelivery } from "../context/DeliveryContext";

/** Green (open) / red (closed) business-hours notice. */
export function HoursNotice() {
  const { settings, withinHours } = useDelivery();
  if (!settings) return null;
  return (
    <div
      className={`rounded-2xl border p-4 ${
        withinHours ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      }`}
    >
      <p className={`font-bold ${withinHours ? "text-green-800" : "text-red-700"}`}>
        {withinHours
          ? `We are available till ${settings.closeTime}`
          : "We are currently closed"}
      </p>
      <p className="text-sm text-gray-600 mt-0.5">
        Online orders are served between {settings.openTime} and {settings.closeTime}.
      </p>
    </div>
  );
}

/** Prompt to capture the customer's location (only when none captured yet). */
export function LocationPrompt({ className = "" }) {
  const { hasLocation, requestLocation, locating, error } = useDelivery();
  if (hasLocation) return null;
  return (
    <div className={`rounded-2xl border border-orange-200 bg-orange-50 p-4 ${className}`}>
      <p className="font-bold text-orange-800">Check delivery to your location</p>
      <p className="text-sm text-orange-700 mb-3">
        Share your location to see if we deliver to your area.
      </p>
      <button
        onClick={requestLocation}
        disabled={locating}
        className="bg-orange-600 text-white font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform disabled:opacity-60"
      >
        {locating ? "Locating…" : "📍 Use my location"}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

/** Red "not serviceable" banner (only when a location is set and out of range). */
export function ServiceabilityNotice({ distanceLabel = "Your current distance", extraText }) {
  const { settings, hasLocation, serviceable, distanceKm } = useDelivery();
  if (!settings || !hasLocation || serviceable) return null;
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="font-bold text-red-800">We are not serviceable in your area</p>
      <p className="text-sm text-red-700 mt-0.5">
        We currently deliver up to {settings.deliveryRadiusKm} km from the bakery. Coming soon in your area.
      </p>
      {extraText && <p className="text-sm text-red-600 mt-1">{extraText}</p>}
      {distanceKm != null && (
        <p className="text-sm text-red-600 mt-1">
          {distanceLabel}: {distanceKm} km
        </p>
      )}
    </div>
  );
}
