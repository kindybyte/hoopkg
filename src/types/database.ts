export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type UserRole = "user" | "admin";
export type CourtType = "paid" | "free";
export type CourtStatus = "active" | "hidden";
export type GameFormat = "3x3" | "4x4" | "5x5" | "free";
export type GameStatus = "open" | "full" | "finished" | "cancelled";
export type ParticipantStatus = "joined" | "left" | "banned";
export type ReceiptStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  telegram_username: string | null;
  show_phone: boolean;
  avatar_url: string | null;
  level: SkillLevel;
  city: string;
  role: UserRole;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  address: string;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
  price_per_hour: number;
  description: string | null;
  booking_phone: string | null;
  status: CourtStatus;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  creator_id: string;
  court_id: string;
  title: string;
  date: string;
  starts_at: string;
  ends_at: string;
  format: GameFormat;
  max_players: number;
  price_per_player: number;
  description: string | null;
  is_private: boolean;
  invite_token: string;
  status: GameStatus;
  created_at: string;
  updated_at: string;
}

export interface GameParticipant {
  id: string;
  game_id: string;
  user_id: string;
  status: ParticipantStatus;
  joined_at: string;
}

export interface RentalReceipt {
  id: string;
  game_id: string;
  file_path: string;
  uploaded_by: string;
  status: ReceiptStatus;
  uploaded_at: string;
}

export interface CourtPresence {
  id: string;
  court_id: string;
  user_id: string;
  updated_at: string;
}

export interface GameWithRelations extends Game {
  court: Court;
  creator: Pick<Profile, "id" | "name" | "telegram_username" | "avatar_url">;
  participants_count: number;
}
