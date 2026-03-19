import type { InputHTMLAttributes, ReactNode } from "react";

type InputFieldProps = {
  label: string;
  icon: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export function InputField({ label, icon, ...props }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={props.id}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500/30">
        <span className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          {icon}
        </span>
        <input
          className="h-9 w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          {...props}
        />
      </div>
    </div>
  );
}

