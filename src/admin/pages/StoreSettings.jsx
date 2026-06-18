import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useStoreSettings } from "../../hooks/useStoreSettings";
import { useUpdateStoreSettings } from "../../hooks/useAdmin";

const StoreSettings = () => {
  const { data: settings, isLoading } = useStoreSettings();
  const update = useUpdateStoreSettings();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (settings && !form) setForm({ ...settings });
  }, [settings, form]);

  if (isLoading || !form) {
    return <div className="text-gray-400 animate-pulse">Loading settings…</div>;
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", Number(pos.coords.latitude.toFixed(6)));
        set("longitude", Number(pos.coords.longitude.toFixed(6)));
        toast.success("Bakery location captured");
      },
      () => toast.error("Could not get location"),
    );
  };

  const save = async () => {
    try {
      await update.mutateAsync({
        bakeryName: form.bakeryName,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        address: form.address || "",
        deliveryRadiusKm: Number(form.deliveryRadiusKm),
        freeDeliveryRadiusKm: Number(form.freeDeliveryRadiusKm),
        baseDeliveryFee: Number(form.baseDeliveryFee),
        perKmFee: Number(form.perKmFee),
        openTime: form.openTime,
        closeTime: form.closeTime,
        onlineOrderingEnabled: Boolean(form.onlineOrderingEnabled),
      });
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e.response?.data?.msg || "Save failed");
    }
  };

  const field = (label, key, type = "text") => (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
      <input
        type={type}
        value={form[key] ?? ""}
        onChange={(e) => set(key, e.target.value)}
        className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Store Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set the bakery location and the delivery radius customers are served within.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
        {field("Bakery Name", "bakeryName")}
        {field("Address", "address")}
        <div className="grid grid-cols-2 gap-4">
          {field("Latitude", "latitude", "number")}
          {field("Longitude", "longitude", "number")}
        </div>
        <button onClick={useMyLocation} className="text-orange-600 font-bold text-sm">
          📍 Use my current location (set bakery here)
        </button>
        <div className="grid grid-cols-2 gap-4">
          {field("Delivery Radius (km)", "deliveryRadiusKm", "number")}
          {field("Free Delivery Radius (km)", "freeDeliveryRadiusKm", "number")}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field("Base Delivery Fee (₹)", "baseDeliveryFee", "number")}
          {field("Per-km Fee (₹)", "perKmFee", "number")}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field("Open Time (HH:mm)", "openTime")}
          {field("Close Time (HH:mm)", "closeTime")}
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(form.onlineOrderingEnabled)}
            onChange={(e) => set("onlineOrderingEnabled", e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-700">Online ordering enabled</span>
        </label>
        <button
          onClick={save}
          disabled={update.isPending}
          className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-60"
        >
          {update.isPending ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default StoreSettings;
