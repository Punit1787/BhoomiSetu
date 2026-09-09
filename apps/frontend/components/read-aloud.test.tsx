import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api-client";
import { useLocale } from "@/lib/i18n";
import { ReadAloud } from "./read-aloud";

vi.mock("@/lib/api-client", () => ({ apiFetch: vi.fn() }));
const events = new EventTarget();
const speech = {
  cancel: vi.fn(),
  speak: vi.fn(),
  getVoices: vi.fn(),
  addEventListener: events.addEventListener.bind(events),
  removeEventListener: events.removeEventListener.bind(events),
};

beforeEach(() => {
  useLocale.persist.setOptions({
    storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  });
  useLocale.setState({ locale: "en" });
  vi.mocked(apiFetch).mockResolvedValue(
    new Blob(["audio"], { type: "audio/wav" }),
  );
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:case-audio"),
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal("speechSynthesis", speech);
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      constructor(public text: string) {}
    },
  );
  speech.getVoices.mockReturnValue([{ lang: "en-IN", name: "Test voice" }]);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("citizen read-aloud", () => {
  it("speaks the actual status and allows stopping", () => {
    render(<ReadAloud text="Case BS-123. Current stage: Verification." />);
    fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
    expect(speech.speak.mock.calls[0][0]).toMatchObject({
      text: "Case BS-123. Current stage: Verification.",
      lang: "en-IN",
    });
    fireEvent.click(screen.getByRole("button", { name: "Stop reading" }));
    expect(
      screen.getByRole("button", { name: "Read aloud" }),
    ).toBeInTheDocument();
  });
  it("provides audio playback when the browser has no matching voice", async () => {
    speech.getVoices.mockReturnValue([{ lang: "hi-IN", name: "Hindi voice" }]);
    render(<ReadAloud text="Current stage: Verification." />);
    fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
    expect(speech.speak).not.toHaveBeenCalled();
    expect(await screen.findByText(/Audio ready/)).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith("/accessibility/speech", {
      method: "POST",
      body: JSON.stringify({
        text: "Current stage: Verification.",
        locale: "en",
      }),
    });
    expect(screen.getByLabelText("Read aloud")).toHaveAttribute(
      "src",
      "blob:case-audio",
    );
  });
  it("cancels speech when the selected language changes", () => {
    render(<ReadAloud text="Current stage: Verification." />);
    fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
    speech.cancel.mockClear();
    act(() => useLocale.setState({ locale: "hi" }));
    expect(speech.cancel).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "सुनें" })).toBeInTheDocument();
  });
  it("lets the browser choose by language while voices are loading", () => {
    speech.getVoices.mockReturnValue([]);
    render(<ReadAloud text="Current stage: Verification." />);
    fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
    expect(speech.speak.mock.calls[0][0]).toMatchObject({ lang: "en-IN" });
  });
  it("uses voices that become available after the component mounts", () => {
    speech.getVoices.mockReturnValue([]);
    render(<ReadAloud text="Current stage: Verification." />);
    const voice = { lang: "en-IN", name: "Loaded voice" };
    speech.getVoices.mockReturnValue([voice]);
    act(() => events.dispatchEvent(new Event("voiceschanged")));
    fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
    expect(speech.speak.mock.calls[0][0].voice).toBe(voice);
  });
  it("falls back to playable audio when native speech fails", async () => {
    render(<ReadAloud text="Current stage: Verification." />);
    fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
    act(() => speech.speak.mock.calls[0][0].onerror());
    expect(await screen.findByText(/Audio ready/)).toBeInTheDocument();
    expect(screen.getByLabelText("Read aloud")).toHaveAttribute(
      "src",
      "blob:case-audio",
    );
  });
});
