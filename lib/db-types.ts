export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  birthDate: string | null;
  birthTime: string | null;
  gender: string | null;
  longitude: number | null;
  latitude: number | null;
  timezoneOffsetMinutes: number | null;
  timezoneName: string | null;
  planTier: string;
  consultationCredits: number;
  lastAdWatchedAt: Date | null;
  lastCreditsAccruedAt: Date | null;
};
