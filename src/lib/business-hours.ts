export type BusinessHourCheckResult = {
  isAllowed: boolean;
  status: 'ok' | 'blocked_weekend' | 'blocked_holiday' | 'after_hours_deferred';
  message?: string;
  queueNotice?: string;
  processingNextBusinessDay?: boolean;
};

type WitaClock = {
  weekday: string;
  hour: number;
  minute: number;
};

type WitaDateKey = {
  year: number;
  month: number;
  day: number;
  dateKey: string;
};

const BUSINESS_HOURS_ENABLED = process.env.NEXT_PUBLIC_BUSINESS_HOURS_ENABLED !== 'false';
const BLOCK_WEEKEND_SUBMISSION = process.env.NEXT_PUBLIC_BLOCK_WEEKEND_SUBMISSION === 'true';

function parseDeferAfterHour(rawValue: string | undefined): number {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return 15;
  const rounded = Math.floor(parsed);
  if (rounded < 0 || rounded > 23) return 15;
  return rounded;
}

const DEFER_AFTER_HOUR_WITA = parseDeferAfterHour(
  process.env.NEXT_PUBLIC_DEFER_AFTER_HOUR_WITA || process.env.DEFER_AFTER_HOUR_WITA
);

// Fixed-date Indonesian national holidays (moving holidays can be appended via env).
const FIXED_NATIONAL_HOLIDAYS_MM_DD = new Set(['01-01', '05-01', '06-01', '08-17', '12-25']);

function parseHolidayCsv(value: string | undefined): Set<string> {
  if (!value) return new Set<string>();
  return new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item))
  );
}

const CONFIGURED_HOLIDAYS = new Set<string>([
  ...parseHolidayCsv(process.env.NEXT_PUBLIC_NATIONAL_HOLIDAYS),
  ...parseHolidayCsv(process.env.NATIONAL_HOLIDAYS),
]);

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

function getWitaDateKey(now: Date): WitaDateKey {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    const partMap = Object.fromEntries(
      parts
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value])
    ) as Record<string, string>;

    const year = Number(partMap.year || 0);
    const month = Number(partMap.month || 1);
    const day = Number(partMap.day || 1);
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');

    return {
      year,
      month,
      day,
      dateKey: `${year}-${monthStr}-${dayStr}`,
    };
  } catch {
    const utcMillis = now.getTime() + now.getTimezoneOffset() * 60_000;
    const witaDate = new Date(utcMillis + 8 * 60 * 60 * 1000);
    const year = witaDate.getUTCFullYear();
    const month = witaDate.getUTCMonth() + 1;
    const day = witaDate.getUTCDate();
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return {
      year,
      month,
      day,
      dateKey: `${year}-${monthStr}-${dayStr}`,
    };
  }
}

function isNationalHoliday(dateKey: string, month: number, day: number): boolean {
  if (CONFIGURED_HOLIDAYS.has(dateKey)) {
    return true;
  }

  const monthDay = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return FIXED_NATIONAL_HOLIDAYS_MM_DD.has(monthDay);
}

function formatHourLabel(hour: number): string {
  return String(hour).padStart(2, '0');
}

export function checkBusinessHoursWita(now: Date = new Date()): BusinessHourCheckResult {
  if (!BUSINESS_HOURS_ENABLED) {
    return { isAllowed: true, status: 'ok' };
  }

  const { weekday, hour, minute } = getWitaClock(now);
  const { month, day, dateKey } = getWitaDateKey(now);

  if (BLOCK_WEEKEND_SUBMISSION && (weekday === "Sun" || weekday === "Sat")) {
    return {
      isAllowed: false,
      status: 'blocked_weekend',
      message:
        "Maaf, permohonan surat hanya dapat diajukan pada hari kerja (Senin-Jumat). Silakan ajukan permohonan Anda pada hari Senin.",
    };
  }

  if (isNationalHoliday(dateKey, month, day)) {
    return {
      isAllowed: false,
      status: 'blocked_holiday',
      message:
        'Maaf, hari ini termasuk libur nasional sehingga pengajuan surat ditutup. Silakan ajukan kembali pada hari kerja berikutnya.',
    };
  }

  const currentMinutes = hour * 60 + minute;
  if (currentMinutes >= DEFER_AFTER_HOUR_WITA * 60) {
    const cutoffLabel = formatHourLabel(DEFER_AFTER_HOUR_WITA);
    return {
      isAllowed: true,
      status: 'after_hours_deferred',
      processingNextBusinessDay: true,
      queueNotice:
        `Pengajuan berhasil dikirim di luar jam layanan (batas ${cutoffLabel}.00 WITA). Permohonan Anda akan diproses besok pada jam kerja.`,
      message:
        `Pengajuan tetap bisa dikirim, tetapi pengajuan setelah jam ${cutoffLabel}.00 WITA akan diproses besok pada jam kerja.`,
    };
  }

  return { isAllowed: true, status: 'ok' };
}
