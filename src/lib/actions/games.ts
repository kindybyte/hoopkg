"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createGameSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "application/pdf"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_GAMES_PER_DAY = 5;

export async function createGame(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();

  const parsed = createGameSchema.safeParse({
    court_id: formData.get("court_id"),
    title: formData.get("title"),
    date: formData.get("date"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
    format: formData.get("format"),
    max_players: formData.get("max_players"),
    price_per_player: formData.get("price_per_player"),
    description: formData.get("description") ?? "",
    is_private: formData.get("is_private") === "on"
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }

  // Rate limit: max 5 games per day.
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("games")
    .select("id", { head: true, count: "exact" })
    .eq("creator_id", user.id)
    .gte("created_at", since.toISOString());
  if ((count ?? 0) >= MAX_GAMES_PER_DAY) {
    return { error: "Вы создали слишком много игр за сегодня. Попробуйте завтра." };
  }

  const { data: court, error: courtErr } = await supabase
    .from("courts")
    .select("id, type, status")
    .eq("id", parsed.data.court_id)
    .single();
  if (courtErr || !court || court.status !== "active") {
    return { error: "Площадка недоступна." };
  }

  const receipt = formData.get("receipt");
  const hasReceiptFile = receipt instanceof File && receipt.size > 0;

  if (court.type === "paid" && !parsed.data.is_private && !hasReceiptFile) {
    return { error: "Для платного зала загрузите чек аренды." };
  }

  if (hasReceiptFile) {
    if (!ALLOWED_MIME.has((receipt as File).type)) {
      return { error: "Чек должен быть jpg, png или pdf." };
    }
    if ((receipt as File).size > MAX_FILE_SIZE) {
      return { error: "Размер файла не больше 5 МБ." };
    }
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("games")
    .insert({
      creator_id: user.id,
      court_id: parsed.data.court_id,
      title: parsed.data.title,
      date: parsed.data.date,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: new Date(parsed.data.ends_at).toISOString(),
      format: parsed.data.format,
      max_players: parsed.data.max_players,
      price_per_player: parsed.data.price_per_player,
      description: parsed.data.description || null,
      is_private: parsed.data.is_private
    })
    .select("id, invite_token")
    .single();

  if (insertErr || !inserted) {
    return { error: "Не удалось создать игру. Попробуйте ещё раз." };
  }

  // Auto-join creator as participant.
  await supabase.from("game_participants").insert({
    game_id: inserted.id,
    user_id: user.id,
    status: "joined"
  });

  if (hasReceiptFile) {
    const file = receipt as File;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `game_${inserted.id}/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from("rental-receipts")
      .upload(path, new Uint8Array(arrayBuffer), { contentType: file.type, upsert: false });
    if (!upErr) {
      await supabase.from("rental_receipts").insert({
        game_id: inserted.id,
        file_path: path,
        uploaded_by: user.id,
        status: "pending"
      });
    }
  }

  revalidatePath("/games");
  redirect(`/games/${inserted.id}?created=1`);
}

export async function joinGame(gameId: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();

  const { data: game } = await supabase
    .from("games")
    .select("id, status, max_players")
    .eq("id", gameId)
    .single();
  if (!game) return { error: "Игра не найдена." };
  if (game.status !== "open") return { error: "В эту игру уже нельзя присоединиться." };

  // Reactivate if user previously left.
  const { data: existing } = await supabase
    .from("game_participants")
    .select("id, status")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.status === "banned") return { error: "Вас удалили из этой игры." };
    if (existing.status === "joined") return { ok: true };
    const { error } = await supabase
      .from("game_participants")
      .update({ status: "joined", joined_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: "Не удалось присоединиться." };
  } else {
    const { error } = await supabase
      .from("game_participants")
      .insert({ game_id: gameId, user_id: user.id, status: "joined" });
    if (error) return { error: "Игра уже заполнена или закрыта." };
  }

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  return { ok: true };
}

export async function leaveGame(gameId: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("game_participants")
    .update({ status: "left" })
    .eq("game_id", gameId)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось покинуть игру." };
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  return { ok: true };
}

export async function cancelGame(gameId: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("games")
    .update({ status: "cancelled" })
    .eq("id", gameId)
    .eq("creator_id", user.id);
  if (error) return { error: "Не удалось отменить игру." };
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  return { ok: true };
}

export async function getReceiptSignedUrl(filePath: string): Promise<string | null> {
  // Service-role bypass to issue a signed URL after RLS-aware access check.
  const supabase = createSupabaseServerClient();
  const { data: row } = await supabase
    .from("rental_receipts")
    .select("file_path")
    .eq("file_path", filePath)
    .maybeSingle();
  if (!row) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("rental-receipts")
    .createSignedUrl(filePath, 60 * 10);
  if (error) return null;
  return data?.signedUrl ?? null;
}
