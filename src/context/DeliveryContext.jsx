import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useStoreSettings } from "../hooks/useStoreSettings";
import {
  computeDeliveryFee,
  haversineKm,
  isWithinHours,
} from "../lib/serviceability";

/**
 * Holds the customer's captured delivery location and derives — against the
 * admin-controlled store settings — distance from the bakery, serviceability,
 * business-hours status, and the delivery fee. Every page reads this.
 */
const DeliveryContext = createContext(null);

const readCoords = () => {
  try {
    const raw = localStorage.getItem("delivery_coords");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const DeliveryProvider = ({ children }) => {
  const { data: settings } = useStoreSettings();
  const [coords, setCoords] = useState(readCoords);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        localStorage.setItem("delivery_coords", JSON.stringify(c));
        setCoords(c);
        setLocating(false);
      },
      (err) => {
        setError(err.message || "Could not get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const clearLocation = useCallback(() => {
    localStorage.removeItem("delivery_coords");
    setCoords(null);
  }, []);

  const value = useMemo(() => {
    const withinHours = settings
      ? isWithinHours(settings.openTime, settings.closeTime)
      : true;

    if (!settings || !coords) {
      return {
        coords,
        hasLocation: Boolean(coords),
        locating,
        error,
        requestLocation,
        clearLocation,
        settings,
        distanceKm: null,
        serviceable: false,
        withinHours,
        deliveryFee: 0,
      };
    }

    const distanceKm = Number(
      haversineKm(settings.latitude, settings.longitude, coords.lat, coords.lng).toFixed(2),
    );
    return {
      coords,
      hasLocation: true,
      locating,
      error,
      requestLocation,
      clearLocation,
      settings,
      distanceKm,
      serviceable: distanceKm <= settings.deliveryRadiusKm,
      withinHours,
      deliveryFee: computeDeliveryFee(distanceKm, settings),
    };
  }, [settings, coords, locating, error, requestLocation, clearLocation]);

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
};

export const useDelivery = () => {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error("useDelivery must be used within a <DeliveryProvider>");
  return ctx;
};
