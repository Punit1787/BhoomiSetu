import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api-client";

const authState = vi.hoisted(() => ({
  accessToken: null as string | null,
  refreshToken: null as string | null,
  demoMode: false,
  setSession: vi.fn(),
}));

vi.mock("./auth-store", () => ({
  useAuthStore: { getState: () => authState },
}));

const ok = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));

describe("portal API mutations", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    authState.accessToken = null;
    authState.refreshToken = null;
    authState.demoMode = false;
  });

  it("sends the backend workflow contract with bearer authentication", async () => {
    authState.accessToken = "access-token";
    authState.refreshToken = "refresh-token";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => ok({ id: "case-1" }));

    await api.transition("case-1", "verification", "Documents checked");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:8000/cases/case-1/transition");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer access-token");
    expect(JSON.parse(String(init?.body))).toEqual({
      new_stage: "verification",
      reason: "Documents checked",
    });
  });

  it("uploads the selected document as multipart form data", async () => {
    authState.accessToken = "access-token";
    authState.refreshToken = "refresh-token";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => ok({ document_id: "doc-1" }));
    const file = new File(["scan"], "record.png", { type: "image/png" });

    await api.uploadDocument("case-1", file);

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get("file")).toBe(file);
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });

  it("submits grievance text to the selected case", async () => {
    authState.accessToken = "access-token";
    authState.refreshToken = "refresh-token";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => ok({ id: "grievance-1" }));

    await api.createGrievance("case-1", "Compensation has not arrived after approval.");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:8000/cases/case-1/grievances");
    expect(JSON.parse(String(init?.body))).toEqual({
      description: "Compensation has not arrived after approval.",
    });
  });
});
