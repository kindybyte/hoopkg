export function formatPrice(value: number): string {
  if (!value) return "Бесплатно";
  return `${value.toLocaleString("ru-RU")} сом`;
}

export function formatDateTimeRu(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatTimeRu(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function formatDayLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Завтра";
  return target.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
}

export function gameStatusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Открыта";
    case "full":
      return "Заполнена";
    case "finished":
      return "Завершена";
    case "cancelled":
      return "Отменена";
    default:
      return status;
  }
}

export function levelLabel(level: string): string {
  switch (level) {
    case "beginner":
      return "Новичок";
    case "intermediate":
      return "Средний";
    case "advanced":
      return "Сильный";
    default:
      return level;
  }
}

export function formatLabel(format: string): string {
  return format === "free" ? "Свободная игра" : format;
}
