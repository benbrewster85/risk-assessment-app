"use client";

import { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  children: ReactNode;
};

export default function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
