import { z } from "zod";

export const uuid = z.string().uuid();
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 形式");
export const isoDateTime = z.string().datetime();
export const yenAmount = z
  .number()
  .int("円整数で入力してください")
  .nonnegative("0 以上を入力してください")
  .max(999_999_999_999);

export const shiftStatusSchema = z.enum(["draft", "confirmed", "canceled"]);
export const userRoleSchema = z.enum(["manager", "employee"]);
export const staffLicenseSchema = z.enum([
  "pharmacist",
  "registered_seller",
  "none",
]);
export type StaffLicense = z.infer<typeof staffLicenseSchema>;
export const STAFF_LICENSE_LABEL: Record<StaffLicense, string> = {
  pharmacist: "薬剤師",
  registered_seller: "登録販売者",
  none: "資格なし",
};

export const positionSchema = z
  .object({
    id: uuid.optional(),
    name: z.string().trim().min(1).max(40),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/u, "#RRGGBB 形式")
      .default("#7c3aed"),
    sort_order: z.number().int().min(0).max(999).default(0),
  })
  .strict();
export type PositionInput = z.infer<typeof positionSchema>;

export const shiftSchema = z
  .object({
    id: uuid.optional(),
    employee_id: uuid,
    position_id: uuid,
    business_date: isoDate,
    starts_at: isoDateTime,
    ends_at: isoDateTime,
    status: shiftStatusSchema.default("draft"),
    note: z.string().max(200).nullable().optional(),
    client_request_id: uuid,
  })
  .strict()
  .refine((v) => new Date(v.ends_at) > new Date(v.starts_at), {
    message: "終了は開始より後である必要があります",
    path: ["ends_at"],
  });
export type ShiftInput = z.infer<typeof shiftSchema>;

export const salesActualSchema = z
  .object({
    business_date: isoDate,
    amount: yenAmount,
    amount_dispensing: yenAmount.default(0),
    amount_otc: yenAmount.default(0),
    amount_cosmetics: yenAmount.default(0),
    amount_food: yenAmount.default(0),
    rx_count: z.number().int().nonnegative().max(99_999).default(0),
    tax_included: z.boolean().default(true),
    tax_rate: z.number().min(0).max(0.5).default(0.1),
  })
  .strict();
export type SalesActualInput = z.infer<typeof salesActualSchema>;

export const dailyBudgetSchema = z
  .object({
    business_date: isoDate,
    amount: yenAmount,
  })
  .strict();
export type DailyBudgetInput = z.infer<typeof dailyBudgetSchema>;

export const announcementSchema = z
  .object({
    id: uuid.optional(),
    title: z.string().trim().min(1).max(80),
    body: z.string().trim().min(1).max(2000),
    image_path: z.string().max(500).nullable().optional(),
    pdf_path: z.string().max(500).nullable().optional(),
  })
  .strict();
export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const inviteSchema = z
  .object({
    full_name: z.string().trim().min(1).max(40),
    role: userRoleSchema.default("employee"),
    license: staffLicenseSchema.default("none"),
    hourly_wage: z
      .number()
      .min(0)
      .max(99_999)
      .nullable()
      .optional(),
    email: z.string().email().nullable().optional(),
  })
  .strict();
export type InviteInput = z.infer<typeof inviteSchema>;

export const onboardingSchema = z
  .object({
    store_name: z.string().trim().min(1).max(60),
    full_name: z.string().trim().min(1).max(40),
  })
  .strict();
export type OnboardingInput = z.infer<typeof onboardingSchema>;
