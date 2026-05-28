import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{9,15}$/u, "Введите телефон в формате +996700123456");

export const telegramSchema = z
  .string()
  .trim()
  .regex(/^@?[a-zA-Z0-9_]{4,32}$/u, "Telegram username от 4 до 32 символов: буквы, цифры, _");

export const skillLevelSchema = z.enum(["beginner", "intermediate", "advanced"], {
  errorMap: () => ({ message: "Выберите уровень игры" })
});

export const gameFormatSchema = z.enum(["3x3", "4x4", "5x5", "free"], {
  errorMap: () => ({ message: "Выберите формат игры" })
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Имя должно быть не короче 2 символов").max(60),
  phone: phoneSchema.optional().or(z.literal("")),
  telegram_username: telegramSchema.optional().or(z.literal("")),
  show_phone: z.boolean().default(false),
  level: skillLevelSchema
});

export const loginEmailSchema = z.object({
  email: z.string().trim().email("Введите корректный email")
});

export const loginPhoneSchema = z.object({
  phone: phoneSchema
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  token: z.string().trim().min(4, "Введите код из SMS")
});

export const createGameSchema = z
  .object({
    court_id: z.string().uuid("Выберите площадку"),
    title: z.string().trim().min(3, "Название минимум 3 символа").max(80),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "Неверная дата"),
    starts_at: z.string().min(1, "Укажите время начала"),
    ends_at: z.string().min(1, "Укажите время окончания"),
    format: gameFormatSchema,
    max_players: z.coerce.number().int().min(2).max(30),
    price_per_player: z.coerce.number().int().min(0).max(100000),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    is_private: z.coerce.boolean().default(false)
  })
  .refine((data) => new Date(data.ends_at) > new Date(data.starts_at), {
    message: "Время окончания должно быть позже начала",
    path: ["ends_at"]
  });

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const courtUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["paid", "free"]),
  address: z.string().trim().min(3).max(200),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  photo_url: z.string().url().optional().or(z.literal("")),
  price_per_hour: z.coerce.number().int().min(0).max(1000000),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.enum(["active", "hidden"]).default("active")
});

export type CourtUpsertInput = z.infer<typeof courtUpsertSchema>;
