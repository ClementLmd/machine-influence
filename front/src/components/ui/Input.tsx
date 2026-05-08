import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  requiredMark?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, requiredMark, required, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
            {(requiredMark || required) && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-md border bg-white px-3 py-2 text-neutral-900 placeholder-neutral-500 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-0 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-neutral-500 ${
            error
              ? "border-red-500 focus:ring-red-500 dark:border-red-500"
              : "border-neutral-300 dark:border-neutral-600"
          } ${className}`}
          required={required}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
