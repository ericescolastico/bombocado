'use client';

import React from 'react';

interface FieldProps {
  label: string;
  className?: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Field({ 
  label, 
  className = "", 
  defaultValue = "", 
  type = "text",
  placeholder,
  disabled = false,
  required = false,
  error,
  onChange
}: FieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        className={`
          h-10 w-full rounded-md border px-3 text-sm transition-colors
          ${error 
            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/70' 
            : 'border-neutral-200 dark:border-neutral-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/70'
          }
          bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${label.toLowerCase()}-error` : undefined}
      />
      {error && (
        <p id={`${label.toLowerCase()}-error`} className="mt-1 text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
