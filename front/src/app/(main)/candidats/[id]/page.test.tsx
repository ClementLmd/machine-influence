import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CandidatePublicPage from "./page";

const fetchMock = vi.fn();

const candidate = {
  id: "user-1",
  role: "INDEPENDENT",
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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("renders public talent details and contact links", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => candidate,
    });

    render(
      await CandidatePublicPage({
        params: Promise.resolve({ id: "user-1" }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith("https://api.test/users/user-1", {
      cache: "no-store",
    });
    expect(screen.getByRole("heading", { name: "Alice Martin" })).toBeInTheDocument();
    expect(screen.getByText("Indépendant")).toBeInTheDocument();
    expect(screen.getByText("Profil complet")).toBeInTheDocument();
    expect(screen.getByText("450 €/jour")).toBeInTheDocument();
    expect(screen.getByText("Membre depuis janvier 2024")).toBeInTheDocument();
    expect(screen.getByText("Développeuse front-end spécialisée React.")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Contacter" })).toHaveAttribute(
      "href",
      "/discussion?userId=user-1",
    );
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute(
      "href",
      "https://alice.example",
    );
    expect(screen.getByRole("link", { name: "Télécharger le CV" })).toHaveAttribute(
      "href",
      "https://alice.example/cv.pdf",
    );
  });

  it("shows a not-found state when the talent cannot be loaded", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });

    render(
      await CandidatePublicPage({
        params: Promise.resolve({ id: "missing-user" }),
      }),
    );

    expect(screen.getByRole("heading", { name: "Candidat introuvable" })).toBeInTheDocument();
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

    render(
      await CandidatePublicPage({
        params: Promise.resolve({ id: "user-1" }),
      }),
    );

    expect(screen.queryByText("Documents & liens")).not.toBeInTheDocument();
  });

  it("shows an empty profile when the API URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    render(
      await CandidatePublicPage({
        params: Promise.resolve({ id: "user-1" }),
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Candidat introuvable" })).toBeInTheDocument();
  });
});
