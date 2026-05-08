import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import NewAnnouncementPage from "./page";

const navigationMock = vi.hoisted(() => ({
  push: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => ({
  getUser: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigationMock.push }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: supabaseMock.getUser,
      getSession: supabaseMock.getSession,
    },
  }),
}));

const fetchMock = vi.fn();

function mockAuthenticatedUser() {
  supabaseMock.getUser.mockResolvedValue({
    data: { user: { id: "auth-user-1" } },
  });
  supabaseMock.getSession.mockResolvedValue({
    data: { session: { access_token: "test-token" } },
  });
}

describe("NewAnnouncementPage", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    navigationMock.push.mockReset();
    supabaseMock.getUser.mockReset();
    supabaseMock.getSession.mockReset();
    mockAuthenticatedUser();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("blocks incomplete recruiter profiles before showing the announcement form", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "recruiter-1",
        role: "RECRUITER",
        isProfileComplete: false,
      }),
    });

    render(<NewAnnouncementPage />);

    expect(
      await screen.findByText("Complétez votre profil avant de créer une annonce."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Aller au profil" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("button", { name: "Créer l'annonce" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledWith("https://api.test/users/me", {
      headers: { Authorization: "Bearer test-token" },
    });
  });

  it("shows the form when the recruiter profile is complete", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "recruiter-1",
        role: "RECRUITER",
        isProfileComplete: true,
      }),
    });

    render(<NewAnnouncementPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Créer une annonce" })).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Titre de l'annonce")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer l'annonce" })).toBeEnabled();
  });
});
