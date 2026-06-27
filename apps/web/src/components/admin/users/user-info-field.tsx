'use client';

interface UserInfoFieldProps {
  label: string;
  value: string;
}

export function UserInfoField({ label, value }: UserInfoFieldProps) {
  return (
    <div>
      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-text-primary text-sm font-medium">{value}</p>
    </div>
  );
}