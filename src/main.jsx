import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { DeliveryProvider } from "./context/DeliveryContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { queryClient } from "./lib/queryClient.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DeliveryProvider>
            <App />
          </DeliveryProvider>
        </AuthProvider>
        {/* Toast notifications (used app-wide; KitchenBoard already relied on this). */}
        <Toaster position="top-center" />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
