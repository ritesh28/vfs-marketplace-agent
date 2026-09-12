import { z } from "zod";

import { VFS_ENTITY_ID_RE } from "@/lib/vfs/paths";
import type { CustomerProfileEditPayload } from "@/lib/vfs/types";

/** Parse agent-output file body (JSON string → unknown). */
export const agentOutputJsonSchema = z.string().transform((raw, ctx) => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    ctx.addIssue({ code: "custom", message: "Invalid JSON" });
    return z.NEVER;
  }
});

export const customerProfileEditSchema: z.ZodType<CustomerProfileEditPayload> =
  z.object({
    "customer-id": z.string().regex(VFS_ENTITY_ID_RE),
    "column-name": z.enum(["name", "email_id"]),
    "updated-value": z.string().min(1),
  });

// TODO: placeholder schemas for other operations
// create-order, create-ticket, create-product, edit-seller-profile,
// edit-product, add-ticket-message
