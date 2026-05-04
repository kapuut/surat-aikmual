"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const POPUP_MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function buildCalendarCells(viewDate: Date): Array<{ date: Date; inCurrentMonth: boolean }> {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: Array<{ date: Date; inCurrentMonth: boolean }> = [];

  for (let i = 0; i < 42; i += 1) {
    const offset = i - firstDayOfMonth;
    if (offset < 0) {
      const day = daysInPrevMonth + offset + 1;
      cells.push({ date: new Date(year, month - 1, day), inCurrentMonth: false });
    } else if (offset >= daysInMonth) {
      const day = offset - daysInMonth + 1;
      cells.push({ date: new Date(year, month + 1, day), inCurrentMonth: false });
    } else {
      cells.push({ date: new Date(year, month, offset + 1), inCurrentMonth: true });
    }
  }

  return cells;
}

type PopupDatePickerProps = {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
};

export default function PopupDatePicker({
  label,
  value,
  onChange,
  min,
  max,
  placeholder = "Pilih tanggal",
}: PopupDatePickerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => fromIsoDate(value) ?? new Date());

  useEffect(() => {
    const selected = fromIsoDate(value);
    if (selected) {
      setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePlacement = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const popupWidth = Math.min(320, window.innerWidth - 24);
      const canPlaceLeft = rect.left + popupWidth <= window.innerWidth - 8;
      const canPlaceRight = rect.right - popupWidth >= 8;

      if (!canPlaceLeft && canPlaceRight) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);

    return () => {
      window.removeEventListener("resize", updatePlacement);
    };
  }, [open]);

  const minDate = min ? fromIsoDate(min) : null;
  const maxDate = max ? fromIsoDate(max) : null;
  const selectedDate = value ? fromIsoDate(value) : null;
  const today = new Date();
  const calendarCells = useMemo(() => buildCalendarCells(viewDate), [viewDate]);

  const pickDate = (nextDate: Date) => {
    if (minDate && nextDate < minDate) return;
    if (maxDate && nextDate > maxDate) return;
    onChange(toIsoDate(nextDate));
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <FiCalendar className="h-4 w-4 text-gray-500" />
          <span>{value || placeholder}</span>
        </span>
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-3 shadow-xl ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
              aria-label="Bulan sebelumnya"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-base font-semibold text-gray-800">
              {POPUP_MONTH_LABELS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
              aria-label="Bulan berikutnya"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {WEEKDAY_LABELS.map((day) => (
              <span key={day} className="py-1 text-xs font-semibold text-gray-500">
                {day}
              </span>
            ))}

            {calendarCells.map(({ date, inCurrentMonth }) => {
              const isoValue = toIsoDate(date);
              const isSelected = !!selectedDate && isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              const disabled = (minDate && date < minDate) || (maxDate && date > maxDate);

              return (
                <button
                  key={isoValue}
                  type="button"
                  onClick={() => pickDate(date)}
                  disabled={!!disabled}
                  className={[
                    "rounded-md py-1.5 text-sm transition-colors",
                    isSelected
                      ? "bg-blue-600 font-semibold text-white"
                      : inCurrentMonth
                      ? "text-gray-800 hover:bg-blue-50"
                      : "text-gray-400 hover:bg-gray-100",
                    isToday && !isSelected ? "ring-1 ring-blue-200" : "",
                    disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "",
                  ].join(" ")}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}