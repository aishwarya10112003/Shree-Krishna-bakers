import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AnimatePresence } from "framer-motion"; // 2. Added AnimatePresence
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/Menupage";
import CartPage from "./pages/CartPage";
import Footer from "./components/Footer";
import Account from "./pages/Accounts";
import AdminLayout from "./admin/layout/AdminLayout";
import MenuManagement from "./admin/pages/MenuManage"; // 👈 The Real Component
import KitchenBoard from "./admin/pages/KitchenBoard";
import SaleAnalatics from "./admin/pages/Analytics";
import "./App.css";


// 3. We create a wrapper component because useLocation must be inside <Router>
function AnimatedRoutes() {
  const location = useLocation();

  return (
    /* mode="wait" ensures the old page finishes fading out 
       BEFORE the new page starts fading in */
    <AnimatePresence mode="popLayout">
      {/* 4. We give Routes a key. This is CRITICAL. 
          Without this, Framer Motion won't see the page change. */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/account" element={<Account />} />
        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Index Route: What shows up when you just go to /admin */}
          <Route
            index
            element={
              <div className="p-4 text-gray-500">
                Welcome back, Admin! Select a tab.
              </div>
            }
          />

          {/* Sub Routes */}
          <Route path="menu" element={<MenuManagement />} />
          <Route path="kitchen" element={<KitchenBoard />} />
          <Route path="analytics" element={<SaleAnalatics />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
const ConditionalFooter = () => {
  const location = useLocation();

  // Logic: If path starts with "/admin", do NOT show footer
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return <Footer />;
};

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          {/* ROUTES acts as the switcher */}
          <div className="flex-grow">
            <AnimatedRoutes />
          </div>

          {/* FOOTER stays outside Routes so it is always visible */}
          <ConditionalFooter />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
