"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export type PasswordInputProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  minLength?: number;
  placeholder?: string;
};

export function PasswordInput({
  id: idProp,
  label,
  value,
  onChange,
  disabled,
  required,
  autoComplete = "current-password",
  autoFocus,
  minLength,
  placeholder,
}: PasswordInputProps) {
  const generatedId = useId();
  const fieldId = idProp ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="pathway-label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          className="pathway-input w-full pr-11 box-border"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          minLength={minLength}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 shadow-none transition-colors hover:opacity-90"
          style={{ color: "var(--pw-muted)", background: "transparent" }}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          tabIndex={0}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff size={18} strokeWidth={1.75} aria-hidden /> : <Eye size={18} strokeWidth={1.75} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
