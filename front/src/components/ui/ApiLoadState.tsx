"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { ApiLoadStatus } from "@/lib/api-fetch";

type ApiLoadStateProps = {
  status: ApiLoadStatus;
  onRetry?: () => void;
  className?: string;
};

export function ApiLoadState({
  status,
  onRetry,
  className,
}: ApiLoadStateProps) {
  if (status === "loading") {
    return (
      <div className={className}>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 shrink-0 animate-spin" />
          Chargement des données… Le serveur peut mettre jusqu&apos;à une minute
          à démarrer.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={`flex flex-col items-center text-center ${className ?? ""}`}
      >
        <p className="text-sm text-muted-foreground">
          Impossible de charger les données pour le moment. Veuillez réessayer
          ultérieurement.
        </p>
        {onRetry ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onRetry}
          >
            Réessayer
          </Button>
        ) : null}
      </div>
    );
  }

  if (status === "unconfigured") {
    return (
      <p
        className={`text-center text-sm text-muted-foreground ${className ?? ""}`}
      >
        Configuration API manquante (
        <code className="text-xs">NEXT_PUBLIC_API_URL</code>).
      </p>
    );
  }

  return null;
}
