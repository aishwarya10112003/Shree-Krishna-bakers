import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import { validate } from "../middleware/validate";
import * as adminController from "../modules/admin/controller";
import * as productController from "../modules/product/controller";
import * as storeController from "../modules/store/controller";
import * as couponController from "../modules/coupon/controller";
import * as blogController from "../modules/blog/controller";
import { orderStatusSchema, assignAgentSchema } from "../modules/admin/schemas";
import { bulkProductsSchema, productSchema } from "../modules/product/schemas";
import { storeSettingsSchema } from "../modules/store/schemas";
import { couponSchema } from "../modules/coupon/schemas";
import { blogSchema } from "../modules/blog/schemas";

export const adminRouter = Router();

// Every admin route requires a valid token AND the admin role.
adminRouter.use(requireAuth, adminOnly);

adminRouter.get("/orders", adminController.getOrders);
adminRouter.get("/products", productController.getAdminProducts);
adminRouter.put("/order-status/:orderId", validate(orderStatusSchema), adminController.updateOrderStatus);
adminRouter.post("/add_product", validate(productSchema), productController.addProduct);
adminRouter.post("/add-bulk-products", validate(bulkProductsSchema), productController.addBulk);
adminRouter.delete("/remove-product/:id", productController.removeProduct);
adminRouter.put("/toggle-stock/:id", productController.toggleStock);
adminRouter.get("/analytics", adminController.getAnalytics);

// Store settings — bakery location, delivery radius, fee config, hours
adminRouter.get("/store-settings", storeController.getSettings);
adminRouter.put("/store-settings", validate(storeSettingsSchema), storeController.updateSettings);

// Coupons / offers
adminRouter.get("/coupons", couponController.listAll);
adminRouter.post("/coupons", validate(couponSchema), couponController.create);

// Blogs
adminRouter.post("/blogs", validate(blogSchema), blogController.create);

// Manual delivery-agent assignment (no live tracking)
adminRouter.put("/order/:orderId/assign-agent", validate(assignAgentSchema), adminController.assignAgent);
