import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlannerDocumentsPanel } from "./PlannerDocumentsPanel";

const mockListPlannerDocuments = jest.fn();
const mockSavePlannerDocument = jest.fn();

jest.mock("@/lib/paycheck/draft", () => ({
  getStoredSelectedPlannerDocument: () => null,
  saveStoredSelectedPlannerDocument: jest.fn(),
}));
jest.mock("@/lib/paycheck/api", () => ({
  listPlannerDocuments: (...args: unknown[]) => mockListPlannerDocuments(...args),
  savePlannerDocument: (...args: unknown[]) => mockSavePlannerDocument(...args),
  getPlannerDocument: jest.fn(),
  deletePlannerDocument: jest.fn(),
  formatSavedItemTimestamp: () => "recently",
}));

describe("PlannerDocumentsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListPlannerDocuments.mockResolvedValue([]);
    mockSavePlannerDocument.mockResolvedValue({
      id: "doc-1",
      name: "Planner A",
      plannerData: { expenses: [] },
      createdAt: new Date().toISOString(),
    });
  });

  it("opens dialog and saves planner document", async () => {
    const user = userEvent.setup();
    render(
      <PlannerDocumentsPanel
        token="tok"
        currentExpenses={[]}
        onLoad={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /planner docs/i }));
    expect(await screen.findByText("Planner documents")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Summer 2026 expense plan"), "Planner A");
    await user.click(screen.getByRole("button", { name: /save doc/i }));

    await waitFor(() =>
      expect(mockSavePlannerDocument).toHaveBeenCalledWith("tok", {
        name: "Planner A",
        plannerData: { expenses: [] },
      }),
    );
  });
});
