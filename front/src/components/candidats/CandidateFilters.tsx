"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/Button";

type Filters = {
  search: string;
  skills: string;
  minRate: string;
  maxRate: string;
};

export function CandidateFilters({ initial }: { initial: Filters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const hasActiveFilter =
    !!initial.search ||
    !!initial.skills ||
    !!initial.minRate ||
    !!initial.maxRate;

  // Key forces the form to remount when filters are cleared, resetting uncontrolled inputs
  const formKey = `${initial.search}|${initial.skills}|${initial.minRate}|${initial.maxRate}`;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement).value.trim();

    const params = new URLSearchParams(searchParams.toString());
    const fields: Array<keyof Filters> = [
      "search",
      "skills",
      "minRate",
      "maxRate",
    ];

    for (const field of fields) {
      const val = getValue(field);
      if (val) {
        params.set(field, val);
      } else {
        params.delete(field);
      }
    }
    params.delete("page");

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push("?");
    });
  };

  return (
    <form
      key={formKey}
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex-1 min-w-52">
        <label
          htmlFor="filter-search"
          className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
        >
          Recherche
        </label>
        <input
          id="filter-search"
          name="search"
          type="text"
          defaultValue={initial.search}
          placeholder="Nom, métier, description…"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
        />
      </div>

      <div className="flex-1 min-w-48">
        <label
          htmlFor="filter-skills"
          className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
        >
          Compétences
        </label>
        <input
          id="filter-skills"
          name="skills"
          type="text"
          defaultValue={initial.skills}
          placeholder="Cadrage, Montage, Maquillage…"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
        />
      </div>

      <div className="flex gap-2">
        <div>
          <label
            htmlFor="filter-minRate"
            className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
          >
            Tarif min (€/j)
          </label>
          <input
            id="filter-minRate"
            name="minRate"
            type="number"
            min={0}
            step={50}
            defaultValue={initial.minRate}
            placeholder="0"
            className="w-28 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
          />
        </div>
        <div>
          <label
            htmlFor="filter-maxRate"
            className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
          >
            Tarif max (€/j)
          </label>
          <input
            id="filter-maxRate"
            name="maxRate"
            type="number"
            min={0}
            step={50}
            defaultValue={initial.maxRate}
            placeholder="3000"
            className="w-28 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
          />
        </div>
      </div>

      <div className="flex gap-2 self-end">
        <Button type="submit" size="sm" isLoading={isPending}>
          {isPending ? "Recherche…" : "Filtrer"}
        </Button>
        {hasActiveFilter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
          >
            Réinitialiser
          </Button>
        )}
      </div>
    </form>
  );
}
