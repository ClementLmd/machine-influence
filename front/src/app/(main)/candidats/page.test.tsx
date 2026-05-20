import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CandidatesPageContent } from "./CandidatesPageContent";

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
  role: "CANDIDATE",
  firstName: "Alice",
  lastName: "Martin",
  profilePicture: null,
  description: "Développeuse front-end spécialisée React.",
  skills: ["React", "TypeScript", "Next.js", "UI", "Tests", "Node"],
  rate: 450,
  isProfileComplete: true,
  createdAt: "2024-01-15T00:00:00.000Z",
};

describe("CandidatesPageContent", () => {
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

    navigationMock.searchParams =
      "search=Alice&skills=React&minRate=300&maxRate=700&page=1";

    render(<CandidatesPageContent />);

    await waitFor(() => {
      expect(screen.getByText("Alice Martin")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test/users?page=1&limit=12&search=Alice&skills=React&minRate=300&maxRate=700",
    );
    expect(screen.getByRole("heading", { name: "Talents" })).toBeInTheDocument();
    expect(screen.getByText("13 profils trouvés")).toBeInTheDocument();
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

    navigationMock.searchParams = "search=Designer&skills=Figma";

    render(<CandidatesPageContent />);

    await waitFor(() => {
      expect(screen.getByText("Aucun profil trouvé")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Aucun profil ne correspond à ces critères. Essayez d'ajuster les filtres.",
      ),
    ).toBeInTheDocument();
  });

  it("returns an unconfigured state without calling fetch when the API URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    render(<CandidatesPageContent />);

    await waitFor(() => {
      expect(
        screen.getByText(/Configuration API manquante/i),
      ).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an error state when the API response fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    render(<CandidatesPageContent />);

    await waitFor(() => {
      expect(
        screen.getByText(/Impossible de charger les données/i),
      ).toBeInTheDocument();
    });
  });
});
