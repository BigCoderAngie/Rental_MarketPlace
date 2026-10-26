import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { PasswordInput } from "@/components/password-input";

// Form parts for sign in and sign up, as in docs/build-kit/reference/desktop/SiteSignUp.html
// (01-DESIGN-SYSTEM.md "Field"): 52px fields with 14px corners, a 13px bold
// label, a red asterisk for required fields, an optional +264 box and an eye
// button for passwords. Messages show in terracotta under the field.

const box = "flex h-[52px] items-center overflow-hidden rounded-input border bg-card focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary";
// 16px on phones so iPhones don't zoom in; 15px from 768px, as in the kit.
export const fieldInputClass = "h-full min-w-0 flex-1 bg-transparent px-3.5 text-base font-normal text-foreground outline-none placeholder:text-muted-foreground md:text-[15px]";

export function Required() {
  return (
    <span aria-hidden className="text-danger">
      {" "}
      *
    </span>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="text-[13px] font-medium text-danger">
      {message}
    </span>
  );
}

type FieldProps = {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  /** Text in a box before the input, for example "+264". */
  prefix?: string;
};

/** A labelled text, email, phone or password field. */
export function TextField({ label, name, required, error, prefix, type = "text", ...input }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const errorId = `${name}-error`;
  const shared = {
    name,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: fieldInputClass,
    ...input,
  };
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      <span>
        {label}
        {required && <Required />}
      </span>
      <span className={`${box} ${error ? "border-danger" : "border-input"}`}>
        {prefix && <span className="flex items-center self-stretch border-r border-border px-3.5 font-bold">{prefix}</span>}
        {type === "password" ? <PasswordInput {...shared} /> : <input type={type} {...shared} />}
      </span>
      <FieldError id={errorId} message={error} />
    </label>
  );
}

export function SelectField({ label, name, required, error, options, ...select }: Omit<FieldProps, "prefix"> & { options: string[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  const errorId = `${name}-error`;
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      <span>
        {label}
        {required && <Required />}
      </span>
      <select
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-[52px] w-full rounded-input border bg-card px-3.5 text-base font-normal text-foreground md:text-[15px] ${error ? "border-danger" : "border-input"} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
        {...select}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </label>
  );
}

/** A 22px green checkbox with its text, as in the kit's terms panel. */
export function CheckboxRow({ name, children, error, defaultChecked, required }: { name: string; children: ReactNode; error?: string; defaultChecked?: boolean; required?: boolean }) {
  const errorId = `${name}-error`;
  return (
    <span className="flex flex-col gap-1">
      <label className="flex items-start gap-3 text-[15px] leading-[1.45]">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="m-0 h-[22px] w-[22px] flex-none accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <span>{children}</span>
      </label>
      <span className="pl-[34px]">
        <FieldError id={errorId} message={error} />
      </span>
    </span>
  );
}

/**
 * A big lit choice card (the kit's aria-pressed buttons), built as a radio so
 * it works with the keyboard and without JavaScript. The picked card turns mint
 * with a green border and edge.
 */
export function ChoiceCard({
  name,
  value,
  title,
  line,
  icon,
  tone,
  defaultChecked,
}: {
  name: string;
  value: string;
  title: string;
  line: string;
  icon: ReactNode;
  tone: "green" | "yellow";
  defaultChecked?: boolean;
}) {
  return (
    <label className="b3 rl-btn rl-w h-auto cursor-pointer justify-start gap-3.5 p-4 text-left whitespace-normal has-checked:border-2 has-checked:border-primary has-checked:bg-primary-soft has-checked:[--edge:var(--primary)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary md:p-[18px]">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="sr-only" />
      <span
        aria-hidden
        className={`flex h-11 w-11 flex-none items-center justify-center rounded-btn-sm md:h-12 md:w-12 md:rounded-btn ${tone === "green" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}
      >
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <strong className="text-[15.5px] md:text-base">{title}</strong>
        <span className="text-[13.5px] font-normal text-foreground-soft md:text-sm">{line}</span>
      </span>
    </label>
  );
}

/** A red note above a form, for problems that belong to no single field (wrong password, email already used). */
export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-btn border border-danger-border bg-danger-soft px-4 py-3 text-sm font-medium text-danger-ink">
      {message}
    </p>
  );
}

/** A small line icon in the kit's style (24px grid, 2px stroke). */
export function LineIcon({ children, size = 22 }: { children: ReactNode; size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
