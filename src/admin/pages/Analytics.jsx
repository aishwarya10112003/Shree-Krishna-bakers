import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SalesAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/admin/analytics");
        setData(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Analytics Error", error);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-sm animate-pulse">
        Loading Dashboard Data...
      </div>
    );

  // Calculate Average Order Value (AOV) for the 4th card
  const aov =
    data.total.totalOrders > 0
      ? Math.round(data.total.totalRevenue / data.total.totalOrders)
      : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Business Overview
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track your performance, revenue, and order history.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Today's Date
          </p>
          <p className="text-sm font-semibold text-gray-700">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* 2. COMPACT KPI CARDS (4-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-gray-400 uppercase">
            Total Revenue
          </p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">
            ₹{data.total.totalRevenue.toLocaleString()}
          </h3>
          <span className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full font-bold mt-2 inline-block">
            Lifetime
          </span>
        </div>

        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-gray-400 uppercase">
            Today's Sales
          </p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">
            ₹{data.today.todayRevenue.toLocaleString()}
          </h3>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-bold mt-2 inline-block">
            {data.today.todayOrders} Orders Today
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-gray-400 uppercase">
            Total Orders
          </p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">
            {data.total.totalOrders}
          </h3>
          <p className="text-[10px] text-gray-400 mt-2">
            Successful Deliveries
          </p>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-gray-400 uppercase">
            Avg. Order Value
          </p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">₹{aov}</h3>
          <p className="text-[10px] text-gray-400 mt-2">Per Customer</p>
        </div>
      </div>

      {/* 3. SPLIT SECTION: CHART + LATEST ORDERS TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART SECTION (Takes up 2/3rds) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-6">
            Revenue Trend (Last 7 Days)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f5f5f5"
                />
                <XAxis
                  dataKey="_id"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="dailyRevenue"
                  stroke="#ea580c"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT ACTIVITY SIDEBAR (Takes up 1/3rd) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">Best Seller</span>
              <span className="text-xs font-bold text-gray-800">
                Paneer Pizza
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">Pending Orders</span>
              <span className="text-xs font-bold text-orange-600">
                3 Orders
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">
                Customer Satisfaction
              </span>
              <span className="text-xs font-bold text-green-600">4.8/5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THE ORDER HISTORY TABLE (Full Width) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Order History</h3>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
            Showing last 50 delivered orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Items</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-600 divide-y divide-gray-50">
              {data.history && data.history.length > 0 ? (
                data.history.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-mono text-xs text-gray-400">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="p-4 font-medium">
                      {order.userId?.name || "Guest User"}
                    </td>
                    <td className="p-4 text-xs max-w-[200px] truncate">
                      {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      ₹{order.totalAmount}
                    </td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    No delivered orders found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;
