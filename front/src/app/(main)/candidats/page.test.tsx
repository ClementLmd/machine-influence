import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CandidatesPage from "./page";

const navigationMock = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: "",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigationMock.push }),
  useSearchParams: () => new URLSearchParams(navigationMock.searchParams),
}));

const fetchMock = vi.fn();

const candidate = {
  id: "user-1",
  role: "INDEPENDENT",
  firstName: "Alice",
  lastName: "Martin",
  profilePicture: null,
  description: "Développeuse front-end spécialisée React.",
  skills: ["React", "TypeScript", "Next.js", "UI", "Tests", "Node"],
  rate: 450,
  isProfileComplete: true,
  createdAt: "2024-01-15T00:00:00.000Z",
};

describe("CandidatesPage", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test/");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    navigationMock.searchParams = "";
    navigationMock.push.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("renders fetched talents and preserves filters in pagination links", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [candidate],
        total: 13,
        page: 1,
        limit: 12,
      }),
    });

    render(
      await CandidatesPage({
        searchParams: Promise.resolve({
          search: "Alice",
          skills: "React",
          minRate: "300",
          maxRate: "700",
          page: "1",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test/users?page=1&limit=12&search=Alice&skills=React&minRate=300&maxRate=700",
      { cache: "no-store" },
    );
    expect(screen.getByRole("heading", { name: "Talents" })).toBeInTheDocument();
    expect(screen.getByText("13 profils trouvés")).toBeInTheDocument();
    expect(screen.getByText("Alice Martin")).toBeInTheDocument();
    expect(screen.getByText("450 €/jour")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Alice Martin/i })).toHaveAttribute(
      "href",
      "/candidats/user-1",
    );
    expect(screen.getByRole("link", { name: "Suivant →" })).toHaveAttribute(
      "href",
      "?page=2&search=Alice&skills=React&minRate=300&maxRate=700",
    );
  });

  it("shows a filtered empty state when no talent matches the criteria", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [], total: 0, page: 1, limit: 12 }),
    });

    render(
      await CandidatesPage({
        searchParams: Promise.resolve({
          search: "Designer",
          skills: "Figma",
        }),
      }),
    );

    expect(screen.getByText("Aucun profil trouvé")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Aucun profil ne correspond à ces critères. Essayez d'ajuster les filtres.",
      ),
    ).toBeInTheDocument();
  });

  it("returns an empty state without calling fetch when the API URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    render(
      await CandidatesPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Aucun talent disponible pour le moment.")).toBeInTheDocument();
  });

  it("falls back to an empty state when the API response fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });

    render(
      await CandidatesPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("Aucun talent disponible pour le moment.")).toBeInTheDocument();
  });
});
