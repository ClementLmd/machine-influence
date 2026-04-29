import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "./page";

const supabaseMock = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: supabaseMock.getSession,
    },
  }),
}));

const fetchMock = vi.fn();

const profile = {
  id: "user-1",
  role: "INDEPENDENT",
  email: "alice@example.com",
  firstName: "Alice",
  lastName: "Martin",
  profilePicture: null,
  description: "Bio initiale",
  skills: ["React", "TypeScript"],
  rate: 450,
  portfolioUrl: "https://alice.example",
  cvUrl: null,
  isProfileComplete: false,
};

function mockSession(token = "test-token") {
  supabaseMock.getSession.mockResolvedValue({
    data: {
      session: token ? { access_token: token } : null,
    },
  });
}

function mockProfileLoad(overrides = {}) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ...profile, ...overrides }),
  });
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test/");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    supabaseMock.getSession.mockReset();
    mockSession();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("loads the connected user's profile with the Supabase access token", async () => {
    mockProfileLoad();

    render(<ProfilePage />);

    expect(await screen.findByDisplayValue("Alice")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("https://api.test/users/me", {
      headers: { Authorization: "Bearer test-token" },
      cache: "no-store",
    });
    expect(screen.getByText("Profil incomplet")).toBeInTheDocument();
    expect(screen.getByDisplayValue("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Aucun CV déposé.")).toBeInTheDocument();
  });

  it("shows an authentication error when no session is available", async () => {
    mockSession("");

    render(<ProfilePage />);

    expect(await screen.findByText("Vous devez être connecté.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("edits profile fields and sends the expected save payload", async () => {
    const user = userEvent.setup();
    mockProfileLoad();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...profile,
        firstName: "Alicia",
        lastName: "Durand",
        email: "contact@example.com",
        description: "Bio mise à jour",
        rate: 500,
        portfolioUrl: "https://portfolio.example",
        skills: ["React", "TypeScript", "Vue"],
        isProfileComplete: true,
      }),
    });

    render(<ProfilePage />);

    await user.clear(await screen.findByLabelText("Prénom"));
    await user.type(screen.getByLabelText("Prénom"), "Alicia");
    await user.clear(screen.getByLabelText("Nom"));
    await user.type(screen.getByLabelText("Nom"), "Durand");
    await user.clear(screen.getByLabelText("Email de contact"));
    await user.type(screen.getByLabelText("Email de contact"), "contact@example.com");
    const descriptionInput = screen.getByDisplayValue("Bio initiale");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Bio mise à jour");
    await user.clear(screen.getByLabelText("Tarif (€/jour)"));
    await user.type(screen.getByLabelText("Tarif (€/jour)"), "500");
    await user.clear(screen.getByPlaceholderText("https://monportfolio.com"));
    await user.type(screen.getByPlaceholderText("https://monportfolio.com"), "https://portfolio.example");
    await user.type(screen.getByPlaceholderText("Tapez une compétence puis Entrée"), "Vue{enter}");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith("https://api.test/users/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        email: "contact@example.com",
        firstName: "Alicia",
        lastName: "Durand",
        description: "Bio mise à jour",
        skills: ["React", "TypeScript", "Vue"],
        rate: 500,
        portfolioUrl: "https://portfolio.example",
      }),
    });
    expect(await screen.findByText("Profil complet")).toBeInTheDocument();
  });

  it("adds unique skills, removes skills, and reports too-long skills", async () => {
    const user = userEvent.setup();
    mockProfileLoad();

    render(<ProfilePage />);

    const skillInput = await screen.findByPlaceholderText("Tapez une compétence puis Entrée");

    await user.type(skillInput, " react {enter}");
    expect(screen.getAllByText("React")).toHaveLength(1);

    await user.type(skillInput, "Vue{enter}");
    expect(screen.getByText("Vue")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retirer React" }));
    expect(screen.queryByText("React")).not.toBeInTheDocument();

    fireEvent.change(skillInput, { target: { value: "x".repeat(31) } });
    fireEvent.keyDown(skillInput, { key: "Enter", code: "Enter" });

    expect(
      screen.getByText("Chaque compétence doit faire max 30 caractères"),
    ).toBeInTheDocument();
  });

  it("uploads avatar and CV files to their dedicated endpoints", async () => {
    mockProfileLoad();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...profile,
          profilePicture: "https://cdn.example/avatar.png",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...profile,
          cvUrl: "https://cdn.example/cv.pdf",
        }),
      });

    render(<ProfilePage />);

    await screen.findByDisplayValue("Alice");

    const avatarInput = document.querySelector<HTMLInputElement>("#avatar-upload");
    const cvInput = document.querySelector<HTMLInputElement>("#cv-upload");
    expect(avatarInput).not.toBeNull();
    expect(cvInput).not.toBeNull();

    fireEvent.change(avatarInput!, {
      target: { files: [new File(["avatar"], "avatar.png", { type: "image/png" })] },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://api.test/users/me/avatar", {
      method: "POST",
      headers: { Authorization: "Bearer test-token" },
      body: expect.any(FormData),
    });

    fireEvent.change(cvInput!, {
      target: { files: [new File(["cv"], "cv.pdf", { type: "application/pdf" })] },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock).toHaveBeenNthCalledWith(3, "https://api.test/users/me/cv", {
      method: "POST",
      headers: { Authorization: "Bearer test-token" },
      body: expect.any(FormData),
    });
  });
});
