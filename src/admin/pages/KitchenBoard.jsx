import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

// SOUND URL
const ALERT_SOUND =
  "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const KitchenBoard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH ORDERS
  const fetchOrders = async () => {
    try {
      const res = await api.get("/admin/orders");
      // Keep only active orders
      const activeOrders = res.data.orders.filter(
        (o) => o.status !== "Delivered" && o.status !== "Cancelled",
      );
      setOrders(activeOrders);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // 2. POLLING (Auto-refresh)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // 3. SOUND
  const playSound = () => {
    const audio = new Audio(ALERT_SOUND);
    audio.play().catch((e) => console.log("Audio play blocked", e));
  };

  // 4. STATUS UPDATE HANDLER
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      // Optimistic Update
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)),
      );

      // Remove from list if Delivered
      if (newStatus === "Delivered") {
        setTimeout(() => {
          setOrders((prev) => prev.filter((o) => o._id !== orderId));
        }, 500);
      }

      playSound();
      await api.put(`/admin/order-status/${orderId}`, { status: newStatus });
      toast.success(`Order updated`);
    } catch (error) {
      console.error("Status update failed", error);
      toast.error("Failed to update status");
      fetchOrders();
    }
  };

  // --- FILTER ORDERS ---
  // Online orders go to Kanban, Table orders go to bottom grid
  const deliveryOrders = orders.filter((o) => !o.tableNo);
  const dineInOrders = orders.filter((o) => o.tableNo);

  // --- STYLES FOR DELIVERY BADGES ---
  const STATUS_STYLES = {
    blue: {
      badge: "bg-blue-100 text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    orange: {
      badge: "bg-orange-100 text-orange-600",
      button: "bg-orange-600 hover:bg-orange-700 text-white",
    },
    purple: {
      badge: "bg-purple-100 text-purple-600",
      button: "bg-purple-600 hover:bg-purple-700 text-white",
    },
  };

  // COMPONENT: CARD FOR DELIVERY FLOW
  const DeliveryCard = ({ order, nextStatus, buttonText, colorType }) => {
    const styles = STATUS_STYLES[colorType];
    return (
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-xs font-bold text-gray-400">
              #{order._id.slice(-6).toUpperCase()}
            </span>
            <h4 className="font-bold text-gray-800">
              {order.userId?.name || "Online Customer"}
            </h4>
          </div>
          <span
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${styles.badge}`}
          >
            {order.status}
          </span>
        </div>
        <div className="space-y-1 mb-4">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between text-sm text-gray-600"
            >
              <span>
                {item.quantity}x {item.name}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-50">
          <button
            onClick={() => handleStatusUpdate(order._id, nextStatus)}
            className={`w-full text-xs font-bold py-2 rounded-lg transition-colors shadow-sm ${styles.button}`}
          >
            {buttonText} →
          </button>
        </div>
      </div>
    );
  };

  // COMPONENT: CARD FOR DINE-IN (Simple "Done" Button)
  const DineInCard = ({ order }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-lg">
            Table {order.tableNo}
          </div>
          <span className="text-xs font-mono text-gray-400">
            #{order._id.slice(-6).toUpperCase()}
          </span>
        </div>

        <div className="space-y-2 mb-6">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center text-gray-700 border-b border-dashed border-gray-100 pb-1 last:border-0"
            >
              <span className="font-medium text-lg">
                {item.quantity}x {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => handleStatusUpdate(order._id, "Delivered")}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-100 transition-transform active:scale-95 flex items-center justify-center gap-2"
      >
        <span>✅</span> Mark Served
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-8 overflow-y-auto pb-20">
      {/* --- SECTION 1: DELIVERY ORDERS (Kanban) --- */}
      <div>
        <div className="flex items-center gap-3 mb-4 px-1">
          <h2 className="text-xl font-bold text-gray-800">
            🛵 Online / Delivery Orders
          </h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
            {deliveryOrders.length} active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* COLUMN 1: RECEIVED */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 min-h-[300px]">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>{" "}
              Received
            </h3>
            {deliveryOrders
              .filter((o) => o.status === "Order Placed")
              .map((order) => (
                <DeliveryCard
                  key={order._id}
                  order={order}
                  nextStatus="Preparing"
                  buttonText="Start Cooking"
                  colorType="blue"
                />
              ))}
          </div>

          {/* COLUMN 2: PROCESSING */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 min-h-[300px]">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>{" "}
              Cooking
            </h3>
            {deliveryOrders
              .filter((o) => o.status === "Preparing")
              .map((order) => (
                <DeliveryCard
                  key={order._id}
                  order={order}
                  nextStatus="Out for Delivery"
                  buttonText="Ready for Driver"
                  colorType="orange"
                />
              ))}
          </div>

          {/* COLUMN 3: ON THE WAY */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 min-h-[300px]">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span> On
              The Way
            </h3>
            {deliveryOrders
              .filter((o) => o.status === "Out for Delivery")
              .map((order) => (
                <DeliveryCard
                  key={order._id}
                  order={order}
                  nextStatus="Delivered"
                  buttonText="Mark Delivered"
                  colorType="purple"
                />
              ))}
          </div>
        </div>
      </div>

      {/* --- SECTION 2: DINE-IN ORDERS (Grid) --- */}
      {dineInOrders.length > 0 && (
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <h2 className="text-xl font-bold text-gray-800">
              🍽️ Dine-In / Table Orders
            </h2>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
              {dineInOrders.length} active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {dineInOrders.map((order) => (
              <DineInCard key={order._id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenBoard;
