import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import { validate } from "../middleware/validate";
import * as adminController from "../modules/admin/controller";
import * as productController from "../modules/product/controller";
import { orderStatusSchema } from "../modules/admin/schemas";
import { bulkProductsSchema, productSchema } from "../modules/product/schemas";

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
