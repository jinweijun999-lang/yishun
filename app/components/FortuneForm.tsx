"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "./LocaleProvider";

interface FortuneFormProps {
  onSubmit: (data: { birthDate: string; birthTime: string; gender: string; longitude?: string }) => void;
  isLoading: boolean;
  defaultBirthDate?: string | null;
  defaultBirthTime?: string | null;
  defaultGender?: string | null;
  defaultLongitude?: string | null;
}

function normalizeGender(value: string | null | undefined) {
  if (!value) {
    return "other";
  }
  const normalized = value.toLowerCase();
  return normalized === "male" || normalized === "female" || normalized === "other"
    ? normalized
    : "other";
}

function parseBirthDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return null;
  }
  return { year, month, day };
}

function normalizeBirthTime(value: string | null | undefined) {
  if (!value) {
    return "12:00";
  }
  return /^\d{2}:\d{2}$/.test(value) ? value : "12:00";
}

export default function FortuneForm({
  onSubmit,
  isLoading,
  defaultBirthDate,
  defaultBirthTime,
  defaultGender,
  defaultLongitude,
}: FortuneFormProps) {
  const { t } = useI18n();
  const today = new Date();
  const defaultYear = (today.getFullYear() - 25).toString();
  const defaultMonth = "01";
  const defaultDay = "01";
  const parsedBirthDate = parseBirthDate(defaultBirthDate);

  const [birthYear, setBirthYear] = useState(
    parsedBirthDate?.year ?? defaultYear
  );
  const [birthMonth, setBirthMonth] = useState(
    parsedBirthDate?.month ?? defaultMonth
  );
  const [birthDay, setBirthDay] = useState(
    parsedBirthDate?.day ?? defaultDay
  );
  const [birthTime, setBirthTime] = useState(
    normalizeBirthTime(defaultBirthTime)
  );
  const [gender, setGender] = useState(normalizeGender(defaultGender));
  const [longitude, setLongitude] = useState(defaultLongitude ?? "");

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => currentYear - i);
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month.toString().padStart(2, "0"), label: `${month}` };
  });

  const getDaysInMonth = (year: string, month: string) => {
    if (!year || !month) return 31;
    const days = new Date(parseInt(year), parseInt(month), 0).getDate();
    return days;
  };

  const days = useMemo(() => {
    const maxDays = getDaysInMonth(birthYear, birthMonth);
    return Array.from({ length: maxDays }, (_, i) => {
      const day = i + 1;
      return { value: day.toString().padStart(2, "0"), label: `${day}` };
    });
  }, [birthYear, birthMonth]);

  const birthDate = birthYear && birthMonth && birthDay
    ? `${birthYear}-${birthMonth}-${birthDay}`
    : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (birthDate && birthTime) {
      onSubmit({ birthDate, birthTime, gender, longitude });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      <form
        onSubmit={handleSubmit}
        className="glass card p-8 space-y-6"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-heading font-bold text-white mb-2 text-glow">
            ✨ {t("fortuneForm.title")}
          </h1>
          <p className="text-gray-400 text-sm">
            {t("fortuneForm.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📅 {t("fortuneForm.birthDate")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={birthYear}
              onChange={(e) => {
                setBirthYear(e.target.value);
                if (birthDay && parseInt(birthDay) > getDaysInMonth(e.target.value, birthMonth)) {
                  setBirthDay("");
                }
              }}
              required
              className="input-field"
              disabled={isLoading}
            >
              <option value="">{t("fortuneForm.year")}</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={birthMonth}
              onChange={(e) => {
                setBirthMonth(e.target.value);
                if (birthDay && parseInt(birthDay) > getDaysInMonth(birthYear, e.target.value)) {
                  setBirthDay("");
                }
              }}
              required
              className="input-field"
              disabled={isLoading}
            >
              <option value="">{t("fortuneForm.month")}</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              required
              className="input-field"
              disabled={isLoading}
            >
              <option value="">{t("fortuneForm.day")}</option>
              {days.map((day) => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🧭 {t("fortuneForm.gender")}
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            className="input-field"
            disabled={isLoading}
          >
            <option value="male">{t("fortuneForm.male")}</option>
            <option value="female">{t("fortuneForm.female")}</option>
            <option value="other">{t("fortuneForm.other")}</option>
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📍 {t("fortuneForm.longitude")} (Optional for True Solar Time)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 116.40 (East is positive)"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="input-field"
            disabled={isLoading}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ⏰ {t("fortuneForm.birthTime")}
          </label>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            required
            className="input-field"
            disabled={isLoading}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full btn-primary flex items-center justify-center gap-2
              ${isLoading ? "loading cursor-not-allowed" : ""}
            `}
          >
            {isLoading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ✨
                </motion.span>
                <span>{t("fortuneForm.reading")}</span>
              </>
            ) : (
              <>
                <span>🔮</span>
                <span>{t("fortuneForm.reveal")}</span>
              </>
            )}
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-gray-500 text-center"
        >
          💡 {t("fortuneForm.tip")}
        </motion.p>
      </form>
    </motion.div>
  );
}
