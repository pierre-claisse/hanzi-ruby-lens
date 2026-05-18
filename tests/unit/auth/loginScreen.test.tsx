import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, LoginScreen, useAuth } from "../../../src/auth";

// Mock the sync loader so tests don't hit the network for sync_blobs.json.
vi.mock("../../../src/sync", () => {
  return {
    unlockAsCommon: vi.fn(),
    unlockAsPierre: vi.fn(),
    __resetSecretsLoaderForTests: vi.fn(),
  };
});

import { unlockAsCommon, unlockAsPierre } from "../../../src/sync";

function Harness() {
  const { state } = useAuth();
  if (state.status === "locked") return <LoginScreen />;
  return (
    <div>
      <p data-testid="role">{state.role}</p>
      <p data-testid="pat">{state.pat}</p>
    </div>
  );
}

function setup() {
  return render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  );
}

describe("LoginScreen", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("starts with the 段予婷 identity selected and shows one password field", () => {
    setup();
    expect(screen.getByText("段予婷")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Sync password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Pierre password")).not.toBeInTheDocument();
  });

  it("reveals the Pierre password field when Pierre is selected", () => {
    setup();
    fireEvent.click(screen.getByText("Pierre Claisse"));
    expect(screen.getByLabelText("Pierre password")).toBeInTheDocument();
  });

  it("calls unlockAsCommon with the typed password", async () => {
    (unlockAsCommon as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: "common",
      secrets: { pat: "ghp_xxx", gist_id: "gid" },
      syncPassword: "sync-pw",
    });
    setup();
    fireEvent.change(screen.getByLabelText("Sync password"), {
      target: { value: "sync-pw" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByTestId("role")).toHaveTextContent("common");
      expect(screen.getByTestId("pat")).toHaveTextContent("ghp_xxx");
    });
    expect(unlockAsCommon).toHaveBeenCalledWith("sync-pw");
  });

  it("calls unlockAsPierre when both fields are filled", async () => {
    (unlockAsPierre as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: "pierre",
      secrets: { pat: "ghp_xxx", gist_id: "gid" },
      syncPassword: "sync-pw",
    });
    setup();
    fireEvent.click(screen.getByText("Pierre Claisse"));
    fireEvent.change(screen.getByLabelText("Sync password"), {
      target: { value: "sync-pw" },
    });
    fireEvent.change(screen.getByLabelText("Pierre password"), {
      target: { value: "pierre-pw" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByTestId("role")).toHaveTextContent("pierre");
    });
    expect(unlockAsPierre).toHaveBeenCalledWith("sync-pw", "pierre-pw");
  });

  it("shows an inline error on a wrong password and stays in locked state", async () => {
    (unlockAsCommon as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setup();
    fireEvent.change(screen.getByLabelText("Sync password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Invalid password/i);
    });
    expect(screen.queryByTestId("role")).not.toBeInTheDocument();
  });

  it("disables the submit button when required fields are empty", () => {
    setup();
    const btn = screen.getByRole("button", { name: /sign in/i });
    expect(btn).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Sync password"), {
      target: { value: "x" },
    });
    expect(btn).not.toBeDisabled();
    fireEvent.click(screen.getByText("Pierre Claisse"));
    expect(btn).toBeDisabled(); // pierre password empty
    fireEvent.change(screen.getByLabelText("Pierre password"), {
      target: { value: "y" },
    });
    expect(btn).not.toBeDisabled();
  });
});
