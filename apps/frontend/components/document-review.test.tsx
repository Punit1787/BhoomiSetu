import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { DocumentOriginal } from "./document-original";
import { DocumentReview } from "./case-workspace";
import { Overview } from "./overview";
import { demoCases } from "@/lib/demo-data";
import type { Dashboard } from "@/lib/operations-types";
import type { CaseSummary } from "@/lib/types";
import { stages } from "@/lib/demo-data";
vi.mock("@/lib/api-client", () => ({ apiFetch: vi.fn(), api: {} }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
const document = {
  id: "doc",
  version: 1,
  document_type: "land_record",
  file_url: "legacy",
  status: "extracted",
  created_at: null,
  extracted_fields: {},
};
function setup(role: "officer" | "landowner") {
  useAuthStore.persist.setOptions({
    storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  });
  useAuthStore.setState({
    demoMode: false,
    user: {
      id: "user",
      role,
      name: "Test",
      email: "test@example.invalid",
    },
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function TestProvider({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}
describe("Document review", () => {
  it.each([
    ["identity_proof", ["owner_name"]],
    ["sale_deed", ["owner_name", "khasra_survey_number", "document_date"]],
    ["land_record", ["owner_name", "khasra_survey_number", "area_hectares"]],
    ["award_notice", ["khasra_survey_number", "document_date"]],
    ["other", ["document_type"]],
  ])("shows and submits only relevant fields for %s", async (type, names) => {
    const { container } = render(
      <DocumentReview
        document={{
          ...document,
          document_type: type,
          extracted_fields: {
            owner_name: "Demo name",
            khasra_survey_number: "OLD-1",
            area_hectares: 2,
            document_date: "2026-09-11",
            document_type: "Demo",
          },
        }}
      />,
      { wrapper: setup("officer") },
    );
    window.document.querySelector("details")!.open = true;
    expect(
      Array.from(container.querySelectorAll("input[name]"), (element) =>
        element.getAttribute("name"),
      ),
    ).toEqual(names);
    fireEvent.click(screen.getByRole("button", { name: "Verify record" }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    const payload = JSON.parse(
      vi.mocked(apiFetch).mock.calls[0][1]!.body as string,
    );
    expect(Object.keys(payload.fields)).toEqual(names);
    expect(payload.approved).toBe(true);
  });

  it("loads a protected preview on demand and releases it when closed", async () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:scan",
      revokeObjectURL: revoke,
    });
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Blob(["scan"], { type: "image/png" }),
    );
    render(
      <DocumentOriginal
        document={{ ...document, original_filename: "scan.png" }}
      />,
    );
    expect(apiFetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "View original" }));
    expect(await screen.findByRole("img")).toHaveAttribute("src", "blob:scan");
    expect(apiFetch).toHaveBeenCalledWith(
      "/documents/doc/original?preview=true",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Hide original" }));
    expect(revoke).toHaveBeenCalledWith("blob:scan");
  });

  it("requires a rejection reason and sends it with the decision", async () => {
    render(<DocumentReview document={document} />, {
      wrapper: setup("officer"),
    });
    window.document.querySelector("details")!.open = true;
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(await screen.findByText(/Enter a reason/)).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
    fireEvent.change(
      screen.getByRole("textbox", { name: /Reason for rejection/ }),
      { target: { value: "Survey is unreadable" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(
      JSON.parse(vi.mocked(apiFetch).mock.calls[0][1]!.body as string),
    ).toMatchObject({
      approved: false,
      rejection_reason: "Survey is unreadable",
    });
  });
  it("shows the reason to citizens without review controls", () => {
    render(
      <DocumentReview
        document={{
          ...document,
          status: "rejected",
          rejection_reason: "Upload a clearer scan",
        }}
      />,
      { wrapper: setup("landowner") },
    );
    expect(screen.getByText(/Upload a clearer scan/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reject" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Original unavailable/)).toBeInTheDocument();
  });
  it("shows completed and current stages on the citizen overview", () => {
    const cases = [{ ...demoCases[0], current_stage: "award" as const }];
    render(<Overview dashboard={demoDashboard(cases)} cases={cases} />, {
      wrapper: setup("landowner"),
    });
    expect(screen.getAllByText("Completed")).toHaveLength(3);
    expect(screen.getByText("Current stage").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getAllByText("Upcoming")).toHaveLength(2);
  });
});

function demoDashboard(cases: CaseSummary[]): Dashboard {
  const stageCounts = Object.fromEntries(
    stages.map((stage) => [
      stage,
      cases.filter((item) => item.current_stage === stage).length,
    ]),
  );
  return {
    case_count: cases.length,
    project_count: 1,
    affected_families: cases.reduce(
      (sum, item) => sum + (item.affected_family_count ?? 0),
      0,
    ),
    displaced_families: 0,
    area_notified_hectares: 0,
    area_acquired_hectares: 0,
    assessed_amount: null,
    disbursed_amount: null,
    compensation_recorded: 0,
    compensation_disbursed: 0,
    amounts_recorded: 0,
    payment_amounts_recorded: 0,
    rr_recorded: 0,
    rr_completed: 0,
    rr_families_supported: 0,
    possession_cases: stageCounts.possession,
    completion_pct: cases.length
      ? Math.round((stageCounts.possession * 100) / cases.length)
      : 0,
    stages: stageCounts,
    open_grievances: 0,
    alerts_requiring_attention: 0,
    recorded_deadlines_due: 0,
    deadline_breaches: 0,
    timeline_adherence_pct: null,
    projects: [],
    states: [],
    districts: [],
    trend: {
      current_transitions: 0,
      previous_transitions: 0,
      difference: 0,
      label: "History comparisons require an API session.",
    },
    generated_at: "",
    notice:
      "Synthetic preview. Unrecorded amounts and deadlines are not estimated.",
  };
}
