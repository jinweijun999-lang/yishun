"use client";

import type { ReactNode } from "react";
import YiShunBottomActionBar from "./YiShunBottomActionBar";

type AppActionBarProps = {
  primaryLabel: string;
  onPrimary: () => void;
  primaryIcon?: ReactNode;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryIcon?: ReactNode;
  tertiaryLabel?: string;
  onTertiary?: () => void;
  tertiaryIcon?: ReactNode;
  hint?: string;
  loading?: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

export default function AppActionBar({
  primaryLabel,
  onPrimary,
  primaryIcon = "→",
  secondaryLabel = "Example",
  onSecondary = () => undefined,
  secondaryIcon = "◇",
  tertiaryLabel = "Draft",
  onTertiary = () => undefined,
  tertiaryIcon = "▣",
  hint,
  loading = false,
  disabled = false,
  disabledReason,
}: AppActionBarProps) {
  return (
    <YiShunBottomActionBar
      statusText={hint}
      primary={{
        label: primaryLabel,
        icon: primaryIcon,
        onClick: onPrimary,
        state: loading ? "loading" : "default",
        disabled,
        disabledReason,
        loadingLabel: loading ? (primaryLabel.includes("解读") ? "解读中..." : primaryLabel) : primaryLabel,
      }}
      secondary={{ label: secondaryLabel, icon: secondaryIcon, onClick: onSecondary }}
      tertiary={{ label: tertiaryLabel, icon: tertiaryIcon, onClick: onTertiary }}
    />
  );
}
