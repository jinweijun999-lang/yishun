"use client";

import { useMemo } from "react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 121 }, (_, index) => String(currentYear - index));
const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function daysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function splitDate(value: string) {
  const [year = "", month = "", day = ""] = value.split("-");
  return { year, month, day };
}

function splitTime(value: string) {
  const [hour = "", minute = ""] = value.split(":");
  return { hour, minute };
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="input-field min-h-[48px]"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function BirthDateSelects({
  value,
  onChange,
  required = false,
  label = "Birth date",
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
}) {
  const { year, month, day } = splitDate(value);
  const dayOptions = useMemo(
    () => Array.from({ length: daysInMonth(year, month) }, (_, index) => String(index + 1).padStart(2, "0")),
    [month, year]
  );

  function updateDate(nextYear: string, nextMonth: string, nextDay: string) {
    const maxDay = daysInMonth(nextYear, nextMonth);
    const safeDay = nextDay && Number(nextDay) > maxDay ? String(maxDay).padStart(2, "0") : nextDay;
    onChange(nextYear && nextMonth && safeDay ? `${nextYear}-${nextMonth}-${safeDay}` : "");
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <div className="grid grid-cols-3 gap-3">
        <SelectField label="Year" value={year} onChange={(next) => updateDate(next, month, day)} options={years} placeholder="YYYY" required={required} />
        <SelectField label="Month" value={month} onChange={(next) => updateDate(year, next, day)} options={months} placeholder="MM" required={required} />
        <SelectField label="Day" value={day} onChange={(next) => updateDate(year, month, next)} options={dayOptions} placeholder="DD" required={required} />
      </div>
      <p className="text-xs text-gray-500">Pick from menus — no YYYY-MM-DD typing required.</p>
    </div>
  );
}

export function BirthTimeSelects({
  value,
  onChange,
  required = false,
  label = "Birth time",
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
}) {
  const { hour, minute } = splitTime(value);

  function updateTime(nextHour: string, nextMinute: string) {
    onChange(nextHour && nextMinute ? `${nextHour}:${nextMinute}` : "");
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Hour" value={hour} onChange={(next) => updateTime(next, minute)} options={hours} placeholder="HH" required={required} />
        <SelectField label="Minute" value={minute} onChange={(next) => updateTime(hour, next)} options={minutes} placeholder="mm" required={required} />
      </div>
      <p className="text-xs text-gray-500">Select hour and minute separately — no colon typing required.</p>
    </div>
  );
}

export default function BirthDateTimePicker({
  birthDate,
  birthTime,
  onBirthDateChange,
  onBirthTimeChange,
  birthDateLabel = "Birth date",
  birthTimeLabel = "Birth time",
  required = false,
}: {
  birthDate: string;
  birthTime: string;
  onBirthDateChange: (value: string) => void;
  onBirthTimeChange: (value: string) => void;
  birthDateLabel?: string;
  birthTimeLabel?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <BirthDateSelects value={birthDate} onChange={onBirthDateChange} required={required} label={birthDateLabel} />
      <BirthTimeSelects value={birthTime} onChange={onBirthTimeChange} required={required} label={birthTimeLabel} />
    </div>
  );
}
