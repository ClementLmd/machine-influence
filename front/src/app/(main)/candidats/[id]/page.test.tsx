import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CandidatePublicPage from "./page";

const navigationMock = vi.hoisted(() => ({
  params: { id: "user-1" },
}));

vi.mock("next/navigation", () => ({
  useParams: () => navigationMock.params,
}));

vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ currentUser: null, loading: false }),
}));

const fetchMock = vi.fn();

const candidate = {
  id: "user-1",
  role: "CANDIDATE",
  firstName: "Alice",
  lastName: "Martin",
  profilePicture: null,
  description: "Développeuse front-end spécialisée React.",
  skills: ["React", "TypeScript"],
  rate: 450,
  portfolioUrl: "https://alice.example",
  cvUrl: "https://alice.example/cv.pdf",
  isProfileComplete: true,
  createdAt: "2024-01-15T00:00:00.000Z",
};

describe("CandidatePublicPage", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test/");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    navigationMock.params = { id: "user-1" };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("renders public talent details and document links", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => candidate,
    });

    render(<CandidatePublicPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Alice Martin" })).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith("https://api.test/users/user-1");
    expect(screen.getByText("Candidat")).toBeInTheDocument();
    expect(screen.getByText("Profil complet")).toBeInTheDocument();
    expect(screen.getByText("450 €/jour")).toBeInTheDocument();
    expect(screen.getByText("Membre depuis janvier 2024")).toBeInTheDocument();
    expect(
      screen.getByText("Développeuse front-end spécialisée React."),
    ).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute(
      "href",
      "https://alice.example",
    );
    expect(
      screen.getByRole("link", { name: "Télécharger le CV" }),
    ).toHaveAttribute("href", "https://alice.example/cv.pdf");
  });

  it("shows a not-found state when the talent cannot be loaded", async () => {
    navigationMock.params = { id: "missing-user" };
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    render(<CandidatePublicPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Candidat introuvable" })).toBeInTheDocument();
    });

    expect(screen.getByText("Vérifiez l'URL ou réessayez plus tard.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Retour aux talents" })).toHaveAttribute(
      "href",
      "/candidats",
    );
  });

  it("does not render the documents section without portfolio or CV", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...candidate,
        portfolioUrl: null,
        cvUrl: null,
      }),
    });

    render(<CandidatePublicPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Alice Martin" })).toBeInTheDocument();
    });

    expect(screen.queryByText("Documents & liens")).not.toBeInTheDocument();
  });

  it("shows an unconfigured state when the API URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    render(<CandidatePublicPage />);

    await waitFor(() => {
      expect(screen.getByText(/Configuration API manquante/i)).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Candidat introuvable" }),
    ).toBeInTheDocument();
  });
});
