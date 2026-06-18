import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAdminCoupons, useCreateCoupon } from "../../hooks/useAdmin";

const EMPTY = {
  code: "",
  description: "",
  type: "FLAT",
  value: "",
  minOrderAmount: "",
  maxDiscount: "",
  isAuto: false,
};

const Coupons = () => {
  const { data: coupons = [], isLoading } = useAdminCoupons();
  const create = useCreateCoupon();
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await create.mutateAsync({
        code: form.code,
        description: form.description || undefined,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        isAuto: form.isAuto,
      });
      toast.success("Coupon created");
      setForm(EMPTY);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to create coupon");
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Coupons & Offers</h1>

      <form
        onSubmit={submit}
        className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm grid grid-cols-2 gap-4"
      >
        <input
          required
          placeholder="CODE"
          value={form.code}
          onChange={(e) => set("code", e.target.value.toUpperCase())}
          className="border border-gray-200 rounded-xl p-3 uppercase outline-none focus:ring-2 focus:ring-orange-500"
        />
        <select
          value={form.type}
          onChange={(e) => set("type", e.target.value)}
          className="border border-gray-200 rounded-xl p-3 outline-none"
        >
          <option value="FLAT">Flat ₹</option>
          <option value="PERCENT">Percent %</option>
        </select>
        <input
          required
          type="number"
          placeholder="Value"
          value={form.value}
          onChange={(e) => set("value", e.target.value)}
          className="border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="number"
          placeholder="Min order ₹"
          value={form.minOrderAmount}
          onChange={(e) => set("minOrderAmount", e.target.value)}
          className="border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="number"
          placeholder="Max discount ₹ (percent only)"
          value={form.maxDiscount}
          onChange={(e) => set("maxDiscount", e.target.value)}
          className="border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500"
        />
        <label className="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            checked={form.isAuto}
            onChange={(e) => set("isAuto", e.target.checked)}
          />
          <span className="text-sm text-gray-700">Auto-apply when the cart qualifies</span>
        </label>
        <button
          disabled={create.isPending}
          className="col-span-2 bg-orange-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-60"
        >
          {create.isPending ? "Creating…" : "Create Coupon"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        {isLoading ? (
          <p className="text-gray-400">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="text-gray-400">No coupons yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {coupons.map((c) => (
              <div key={c.id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-orange-600">{c.code}</span>
                  <span className="text-gray-500 text-sm"> — {c.description}</span>
                  {c.isAuto && (
                    <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      AUTO
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-700">
                  {c.type === "FLAT" ? `₹${c.value}` : `${c.value}%`}
                  {c.minOrderAmount ? ` · min ₹${c.minOrderAmount}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons;
