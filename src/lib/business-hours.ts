export type BusinessHourCheckResult = {
  isAllowed: boolean;
  message?: string;
};

type WitaClock = {
  weekday: string;
  hour: number;
  minute: number;
};

function getWitaClock(now: Date): WitaClock {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Makassar",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const partMap = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value])
    ) as Record<string, string>;

    return {
      weekday: partMap.weekday || "Mon",
      hour: Number(partMap.hour || 0),
      minute: Number(partMap.minute || 0),
    };
  } catch {
    // Fallback if Intl timezone data is unavailable.
    const utcMillis = now.getTime() + now.getTimezoneOffset() * 60_000;
    const witaDate = new Date(utcMillis + 8 * 60 * 60 * 1000);

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      weekday: weekdays[witaDate.getUTCDay()] || "Mon",
      hour: witaDate.getUTCHours(),
      minute: witaDate.getUTCMinutes(),
    };
  }
}

export function checkBusinessHoursWita(now: Date = new Date()): BusinessHourCheckResult {
  const { weekday, hour, minute } = getWitaClock(now);

  if (weekday === "Sun" || weekday === "Sat") {
    return {
      isAllowed: false,
      message:
        "Maaf, permohonan surat hanya dapat diajukan pada hari kerja (Senin-Jumat). Silakan ajukan permohonan Anda pada hari Senin.",
    };
  }

  const currentMinutes = hour * 60 + minute;
  if (currentMinutes >= 15 * 60) {
    return {
      isAllowed: false,
      message:
        "Maaf, batas waktu pengajuan permohonan adalah jam 15.00 WITA. Silakan ajukan permohonan Anda besok.",
    };
  }

  return { isAllowed: true };
}
