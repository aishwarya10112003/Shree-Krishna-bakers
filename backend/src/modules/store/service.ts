import { prisma } from "../../db/prisma";
import type { StoreSettingsInput } from "./schemas";

// There is exactly ONE settings row, addressed by a fixed id.
const SINGLETON_ID = "singleton";

/** Get-or-create the single settings row (defaults come from the schema). */
export async function getStoreSettings() {
  return prisma.storeSettings.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}

export async function updateStoreSettings(input: StoreSettingsInput) {
  return prisma.storeSettings.upsert({
    where: { id: SINGLETON_ID },
    update: input,
    create: { id: SINGLETON_ID, ...input },
  });
}
