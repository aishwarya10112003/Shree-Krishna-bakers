import { asyncHandler } from "../../lib/asyncHandler";
import { audit } from "../../lib/audit";
import * as storeService from "./service";

/** Public: the frontend needs bakery coords, radius, hours & fee config to
 *  compute serviceability and show banners. */
export const getSettings = asyncHandler(async (_req, res) => {
  res.json({ settings: await storeService.getStoreSettings() });
});

/** Admin: update the bakery location / radius / fee / hours. */
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await storeService.updateStoreSettings(req.body);
  await audit({
    actorId: req.user?.id ?? null,
    action: "store.settings_update",
    entity: "StoreSettings",
    entityId: settings.id,
    ip: req.ip ?? null,
  });
  res.json({ message: "Store settings updated", settings });
});
