"use client";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Helsinki",
  "Europe/Athens",
  "Europe/Moscow",
  "Asia/Jerusalem",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

export type TimezoneSelectorProps = {
  label?: string;
  value: string | null | undefined;
  onChange: (tz: string) => void;
  disabled?: boolean;
};

export function TimezoneSelector({
  label = "Timezone",
  value,
  onChange,
  disabled,
}: TimezoneSelectorProps) {
  const current = value ?? "America/New_York";
  const list = Array.from(
    new Set([current, ...COMMON_TIMEZONES].filter(Boolean)),
  ).sort();
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </span>
      <select
        value={current}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm"
      >
        {list.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
    </label>
  );
}
