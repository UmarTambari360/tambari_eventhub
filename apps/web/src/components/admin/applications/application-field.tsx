'use client';

interface FieldProps {
  label: string;
  value: string;
  multiline?: boolean;
  link?: boolean;
}

export function ApplicationField({ label, value, multiline, link }: FieldProps) {
  return (
    <div>
      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-0.5">{label}</p>
      {multiline ? (
        <p className="text-text-primary text-sm whitespace-pre-wrap">{value}</p>
      ) : link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 text-sm hover:text-primary-700 hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className="text-text-primary text-sm font-medium">{value || '—'}</p>
      )}
    </div>
  );
}
