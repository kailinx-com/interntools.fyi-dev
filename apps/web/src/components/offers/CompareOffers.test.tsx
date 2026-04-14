import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompareOffers, parseMoney, fmtMoney, deriveMonthlyIncome } from "./CompareOffers";


const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSearchGet = jest.fn((_k: string) => null as string | null);

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({
    get: (k: string) => mockSearchGet(k),
    toString: () => {
      const offerId = mockSearchGet("offer");
      const comparisonId = mockSearchGet("comparison");
      const parts: string[] = [];
      if (offerId) parts.push(`offerId=${encodeURIComponent(String(offerId))}`);
      if (comparisonId) parts.push(`comparison=${encodeURIComponent(String(comparisonId))}`);
      return parts.join("&");
    },
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

type AuthState = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { username: string; email: string; role: string } | null;
};

let authState: AuthState = {
  token: null,
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => authState,
}));

let mockStoredConfig: unknown = null;
let mockStoredPlannerData = { expenses: [] as { defaultAmount: number }[] };

jest.mock("@/lib/paycheck/draft", () => ({
  getStoredPaycheckConfig: () => mockStoredConfig,
  getStoredPlannerData: () => mockStoredPlannerData,
}));

const mockCalculatePayroll = jest.fn().mockReturnValue({ monthly: [] });
const mockDeriveFicaMode = jest.fn().mockReturnValue("exempt");

jest.mock("@/lib/paycheck", () => ({
  calculatePayroll: (...args: unknown[]) => mockCalculatePayroll(...args),
  deriveFicaMode: (...args: unknown[]) => mockDeriveFicaMode(...args),
}));

const mockListConfigs = jest.fn().mockResolvedValue([]);
const mockGetConfig = jest.fn();
const mockListPlanners = jest.fn().mockResolvedValue([]);
const mockGetPlanner = jest.fn();

jest.mock("@/lib/paycheck/api", () => ({
  listCalculatorConfigs: (...args: unknown[]) => mockListConfigs(...args),
  getCalculatorConfig: (...args: unknown[]) => mockGetConfig(...args),
  listPlannerDocuments: (...args: unknown[]) => mockListPlanners(...args),
  getPlannerDocument: (...args: unknown[]) => mockGetPlanner(...args),
}));

const mockSaveDraft = jest.fn();
jest.mock("@/lib/offers", () => ({
  saveCompareOffersDraft: (...args: unknown[]) => mockSaveDraft(...args),
}));

const mockFetchOffers = jest.fn().mockResolvedValue([]);
const mockFetchOffer = jest.fn();
const mockFetchComparison = jest.fn();
const mockCreateOffer = jest.fn().mockResolvedValue({ id: 1, company: "Test" });
const mockCreateComparison = jest.fn().mockResolvedValue({ id: 1, name: "Test" });

jest.mock("@/lib/offers/api", () => ({
  fetchOffers: (...args: unknown[]) => mockFetchOffers(...args),
  fetchOffer: (...args: unknown[]) => mockFetchOffer(...args),
  fetchComparison: (...args: unknown[]) => mockFetchComparison(...args),
  createOffer: (...args: unknown[]) => mockCreateOffer(...args),
  createComparison: (...args: unknown[]) => mockCreateComparison(...args),
}));

jest.mock("./LocationPicker", () => ({
  LocationPicker: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="location-picker"
      placeholder={placeholder ?? "Search city…"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode; value?: string; onValueChange?: (v: string) => void }) => (
    <div data-testid="select">{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button data-testid="select-trigger">{children}</button>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
}));

jest.mock("@/components/ui/spinner", () => ({
  Spinner: ({ className }: { className?: string }) => <div data-testid="spinner" className={className} />,
}));


function setAuth(overrides: Partial<AuthState> = {}) {
  authState = { token: null, isAuthenticated: false, isLoading: false, user: null, ...overrides };
}

function setAuthUser() {
  setAuth({
    token: "test-token",
    isAuthenticated: true,
    user: { username: "testuser", email: "test@test.com", role: "STUDENT" },
  });
}


describe("parseMoney", () => {
  it("parses dollar strings", () => {
    expect(parseMoney("$8,500/mo")).toBe(8500);
    expect(parseMoney("$55/hr")).toBe(55);
    expect(parseMoney("$120,000/yr")).toBe(120000);
    expect(parseMoney("$3,200")).toBe(3200);
  });

  it("returns 0 for empty/invalid", () => {
    expect(parseMoney("")).toBe(0);
    expect(parseMoney("abc")).toBe(0);
    expect(parseMoney("—")).toBe(0);
  });
});

describe("fmtMoney", () => {
  it("formats positive amounts", () => {
    expect(fmtMoney(8500)).toBe("$8,500/mo");
    expect(fmtMoney(1234)).toBe("$1,234/mo");
  });

  it("formats negative amounts", () => {
    expect(fmtMoney(-500)).toBe("-$500/mo");
  });

  it("returns dash for zero", () => {
    expect(fmtMoney(0)).toBe("—");
  });
});

describe("deriveMonthlyIncome", () => {
  it("converts hourly to monthly (40h/wk * 4.33 wks)", () => {
    const result = deriveMonthlyIncome("$55/hr");
    expect(result).toBeCloseTo(55 * 40 * 4.33, 0);
  });

  it("keeps monthly as-is", () => {
    expect(deriveMonthlyIncome("$8,500/mo")).toBe(8500);
  });

  it("converts yearly to monthly", () => {
    expect(deriveMonthlyIncome("$120,000/yr")).toBe(10000);
    expect(deriveMonthlyIncome("$120,000/year")).toBe(10000);
  });

  it("treats plain numbers as monthly", () => {
    expect(deriveMonthlyIncome("$8500")).toBe(8500);
    expect(deriveMonthlyIncome("8500")).toBe(8500);
  });

  it("returns 0 for empty/invalid", () => {
    expect(deriveMonthlyIncome("")).toBe(0);
    expect(deriveMonthlyIncome("abc")).toBe(0);
  });
});


describe("CompareOffers", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchGet.mockImplementation(() => null);
    mockFetchOffer.mockReset();
    mockFetchComparison.mockReset();
    setAuth();
    mockStoredConfig = null;
    mockStoredPlannerData = { expenses: [] };
  });


  describe("initial rendering", () => {
    it("renders the heading", () => {
      render(<CompareOffers />);
      expect(screen.getByRole("heading", { name: /compare offers/i })).toBeInTheDocument();
    });

    it("starts with 2 empty offer cards", () => {
      render(<CompareOffers />);
      expect(screen.getAllByPlaceholderText("Company")).toHaveLength(2);
      expect(screen.getAllByPlaceholderText("Role")).toHaveLength(2);
    });

    it("renders Financial Performance with compensation and net take-home", () => {
      render(<CompareOffers />);
      expect(screen.getByText("Gross Compensation")).toBeInTheDocument();
      expect(screen.getByText("Net Take-home")).toBeInTheDocument();
    });

    it("renders Lifestyle section with All Expenses and Commute (no rent)", () => {
      render(<CompareOffers />);
      expect(screen.getByText("All Expenses")).toBeInTheDocument();
      expect(screen.getByText("Commute")).toBeInTheDocument();
      expect(screen.queryByText("Est. Rent")).not.toBeInTheDocument();
    });

    it("renders Monthly Leftover section", () => {
      render(<CompareOffers />);
      expect(screen.getByText("Monthly Leftover")).toBeInTheDocument();
    });

    it("shows dash for leftover when no values entered", () => {
      render(<CompareOffers />);
      expect(screen.getByTestId("leftover-0")).toHaveTextContent("—");
      expect(screen.getByTestId("leftover-1")).toHaveTextContent("—");
    });
  });


  describe("add / remove offers", () => {
    it("adds a third offer", async () => {
      render(<CompareOffers />);
      await user.click(screen.getByText("Add Offer"));
      expect(screen.getAllByPlaceholderText("Company")).toHaveLength(3);
    });

    it("adds up to 4 and disables button", async () => {
      render(<CompareOffers />);
      await user.click(screen.getByText("Add Offer"));
      await user.click(screen.getByText("Add Offer"));
      expect(screen.getAllByPlaceholderText("Company")).toHaveLength(4);
      expect(screen.getByText("Add Offer").closest("button")).toBeDisabled();
    });
  });


  describe("editable fields", () => {
    it("types company name", async () => {
      render(<CompareOffers />);
      const inputs = screen.getAllByPlaceholderText("Company");
      await user.type(inputs[0], "Google");
      expect(inputs[0]).toHaveValue("Google");
    });

    it("types role", async () => {
      render(<CompareOffers />);
      const inputs = screen.getAllByPlaceholderText("Role");
      await user.type(inputs[0], "SWE Intern");
      expect(inputs[0]).toHaveValue("SWE Intern");
    });

    it("types compensation", async () => {
      render(<CompareOffers />);
      const inputs = screen.getAllByPlaceholderText("$55/hr");
      await user.type(inputs[0], "$60/hr");
      expect(inputs[0]).toHaveValue("$60/hr");
    });

    it("types net take-home", async () => {
      render(<CompareOffers />);
      const inputs = screen.getAllByPlaceholderText("$0/mo");
      await user.type(inputs[0], "$8000");
      expect(inputs[0]).toHaveValue("$8000");
    });

    it("types all expenses", async () => {
      render(<CompareOffers />);
      const inputs = screen.getAllByPlaceholderText("$0/mo");
      await user.type(inputs[0], "$5000");
      expect(inputs[0]).toHaveValue("$5000");
    });
  });


  describe("live Monthly Leftover computation", () => {
    it("computes leftover from net take-home minus expenses", async () => {
      render(<CompareOffers />);
      const allInputs = screen.getAllByPlaceholderText("$0/mo");
      await user.type(allInputs[0], "$8000");
      await user.type(allInputs[2], "$3000");

      expect(screen.getByTestId("leftover-0")).toHaveTextContent("$5,000/mo");
    });

    it("computes leftover from hourly rate when no net take-home entered", async () => {
      render(<CompareOffers />);
      const compInputs = screen.getAllByPlaceholderText("$55/hr");
      await user.type(compInputs[0], "$50/hr");

      const leftover = screen.getByTestId("leftover-0");
      expect(leftover).not.toHaveTextContent("—");
      expect(leftover.textContent).toMatch(/\$8,660\/mo/);
    });

    it("prefers explicit net take-home over hourly derivation", async () => {
      render(<CompareOffers />);
      const compInputs = screen.getAllByPlaceholderText("$55/hr");
      await user.type(compInputs[0], "$50/hr");

      const netInputs = screen.getAllByPlaceholderText("$0/mo");
      await user.type(netInputs[0], "$7000");

      expect(screen.getByTestId("leftover-0")).toHaveTextContent("$7,000/mo");
    });

    it("computes negative leftover when expenses exceed income", async () => {
      render(<CompareOffers />);
      const allInputs = screen.getAllByPlaceholderText("$0/mo");
      await user.type(allInputs[0], "$3000");
      await user.type(allInputs[2], "$5000");

      expect(screen.getByTestId("leftover-0")).toHaveTextContent("-$2,000/mo");
    });

    it("shows savings rate badge", async () => {
      render(<CompareOffers />);
      const allInputs = screen.getAllByPlaceholderText("$0/mo");
      await user.type(allInputs[0], "$10000");
      await user.type(allInputs[2], "$4000");

      expect(screen.getByTestId("rate-0")).toHaveTextContent("60% savings rate");
    });

    it("updates leftover in real-time as user types expenses", async () => {
      render(<CompareOffers />);
      const allInputs = screen.getAllByPlaceholderText("$0/mo");
      await user.type(allInputs[0], "$10000");

      expect(screen.getByTestId("leftover-0")).toHaveTextContent("$10,000/mo");

      await user.type(allInputs[2], "$3000");
      expect(screen.getByTestId("leftover-0")).toHaveTextContent("$7,000/mo");
    });

    it("shows estimated label when using hourly derivation", async () => {
      render(<CompareOffers />);
      const compInputs = screen.getAllByPlaceholderText("$55/hr");
      await user.type(compInputs[0], "$50/hr");

      expect(screen.getByText(/estimated from hourly rate/i)).toBeInTheDocument();
    });

    it("derives from yearly rate", async () => {
      render(<CompareOffers />);
      const compInputs = screen.getAllByPlaceholderText("$55/hr");
      await user.type(compInputs[0], "$120000/yr");

      expect(screen.getByTestId("leftover-0")).toHaveTextContent("$10,000/mo");
    });

    it("handles monthly rate in compensation", async () => {
      render(<CompareOffers />);
      const compInputs = screen.getAllByPlaceholderText("$55/hr");
      await user.type(compInputs[0], "$9000/mo");

      expect(screen.getByTestId("leftover-0")).toHaveTextContent("$9,000/mo");
    });
  });


  describe("publish", () => {
    it("saves draft and navigates", async () => {
      render(<CompareOffers />);
      const companyInputs = screen.getAllByPlaceholderText("Company");
      await user.type(companyInputs[0], "Google");
      await user.type(companyInputs[1], "Meta");

      await user.click(screen.getByText("Publish"));

      expect(mockSaveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          offers: expect.arrayContaining([
            expect.objectContaining({ company: "Google" }),
            expect.objectContaining({ company: "Meta" }),
          ]),
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/offers/submit?from=compare");
    });
  });


  describe("unauthenticated", () => {
    beforeEach(() => setAuth());

    it("hides Save button", () => {
      render(<CompareOffers />);
      expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
    });

    it("does not fetch offers/configs/planners", () => {
      render(<CompareOffers />);
      expect(mockFetchOffers).not.toHaveBeenCalled();
      expect(mockListConfigs).not.toHaveBeenCalled();
      expect(mockListPlanners).not.toHaveBeenCalled();
    });
  });


  describe("authenticated", () => {
    beforeEach(() => setAuthUser());

    it("shows Save button", () => {
      render(<CompareOffers />);
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });

    it("fetches offers, configs, planners on mount", () => {
      render(<CompareOffers />);
      expect(mockFetchOffers).toHaveBeenCalledWith("test-token");
      expect(mockListConfigs).toHaveBeenCalledWith("test-token");
      expect(mockListPlanners).toHaveBeenCalledWith("test-token");
    });

    describe("saving", () => {
      it("creates offers + comparison", async () => {
        render(<CompareOffers />);
        const ci = screen.getAllByPlaceholderText("Company");
        await user.type(ci[0], "Google");
        await user.type(ci[1], "Meta");
        await user.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => expect(mockCreateComparison).toHaveBeenCalled());
        expect(mockCreateOffer).toHaveBeenCalledTimes(2);
        expect(mockCreateComparison).toHaveBeenCalledWith(
          "test-token",
          expect.objectContaining({
            name: "Google vs Meta",
            includedOfferIds: [1, 1],
          }),
        );
      });

      it("validates min 2 offers", async () => {
        render(<CompareOffers />);
        await user.type(screen.getAllByPlaceholderText("Company")[0], "Google");
        await user.click(screen.getByRole("button", { name: /save/i }));
        expect(screen.getByText(/at least 2 offers/i)).toBeInTheDocument();
        expect(mockCreateOffer).not.toHaveBeenCalled();
      });

      it("shows success message", async () => {
        render(<CompareOffers />);
        const ci = screen.getAllByPlaceholderText("Company");
        await user.type(ci[0], "A");
        await user.type(ci[1], "B");
        await user.click(screen.getByRole("button", { name: /save/i }));
        await waitFor(() => expect(screen.getByText(/comparison saved/i)).toBeInTheDocument());
      });

      it("shows error on failure", async () => {
        mockCreateComparison.mockRejectedValueOnce(new Error("DB error"));
        render(<CompareOffers />);
        const ci = screen.getAllByPlaceholderText("Company");
        await user.type(ci[0], "A");
        await user.type(ci[1], "B");
        await user.click(screen.getByRole("button", { name: /save/i }));
        await waitFor(() =>
          expect(screen.getByText(/db error|failed to save/i)).toBeInTheDocument(),
        );
      });
    });

    describe("import saved offers", () => {
      it("renders import buttons", async () => {
        mockFetchOffers.mockResolvedValueOnce([
          { id: 1, company: "SavedCo", title: "Eng", officeLocation: "LA", compensationType: "hourly", payAmount: 50 },
        ]);
        render(<CompareOffers />);
        expect(await screen.findByRole("button", { name: /savedco/i })).toBeInTheDocument();
      });
    });

    describe("paycheck config selectors", () => {
      it("shows selectors when configs exist", async () => {
        mockListConfigs.mockResolvedValueOnce([{ id: 1, name: "Summer 2026", createdAt: "2026-01-01" }]);
        render(<CompareOffers />);
        expect(await screen.findAllByText(/paycheck config/i)).toHaveLength(2);
      });

      it("shows draft option when local draft exists", () => {
        mockStoredConfig = { startDate: "2026-06-01" };
        render(<CompareOffers />);
        expect(screen.getAllByText(/calculator draft/i)).toHaveLength(2);
      });
    });

    describe("planner document selectors", () => {
      it("shows selectors when planners exist", async () => {
        mockListPlanners.mockResolvedValueOnce([{ id: "p1", name: "Summer Budget", createdAt: "2026-01-01" }]);
        render(<CompareOffers />);
        expect(await screen.findAllByText(/planner document/i)).toHaveLength(2);
      });

      it("shows draft option when local planner draft exists", () => {
        mockStoredPlannerData = { expenses: [{ defaultAmount: 1500 }] };
        render(<CompareOffers />);
        expect(screen.getAllByText(/planner draft/i)).toHaveLength(2);
      });

      it("hides selectors when no planners and no draft", () => {
        render(<CompareOffers />);
        expect(screen.queryByText(/planner document/i)).not.toBeInTheDocument();
      });
    });

    describe("URL prefill (saved comparisons & offers)", () => {
      function sampleOffer(id: number, company: string, title: string) {
        return {
          id,
          company,
          title,
          employmentType: "internship" as const,
          compensationType: "hourly" as const,
          payAmount: 40,
          hoursPerWeek: 40,
          signOnBonus: null as number | null,
          relocationAmount: null as number | null,
          equityNotes: null as string | null,
          officeLocation: "Remote",
          daysInOffice: null as number | null,
          notes: null as string | null,
          favorite: null as boolean | null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
        };
      }

      it("fetches comparison and prefills columns from included offers", async () => {
        mockSearchGet.mockImplementation((k: string) =>
          k === "comparison" ? "100" : null,
        );
        mockFetchComparison.mockResolvedValue({
          id: 100,
          name: "Saved",
          includedOfferIds: [10, 11],
          description: null,
          isPublished: true,
          computedMetrics: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
        });
        mockFetchOffer
          .mockResolvedValueOnce(sampleOffer(10, "Acme", "Eng"))
          .mockResolvedValueOnce(sampleOffer(11, "Beta", "PM"));

        setAuthUser();
        render(<CompareOffers />);

        await waitFor(() => {
          expect(mockFetchComparison).toHaveBeenCalledWith("test-token", 100);
        });
        expect(mockFetchOffer).toHaveBeenCalledWith("test-token", 10);
        expect(mockFetchOffer).toHaveBeenCalledWith("test-token", 11);

        await waitFor(() => {
          const companies = screen.getAllByPlaceholderText("Company");
          expect(companies[0]).toHaveValue("Acme");
          expect(companies[1]).toHaveValue("Beta");
        });
      });

      it("prefills first column from ?offer=id", async () => {
        mockSearchGet.mockImplementation((k: string) => (k === "offer" ? "5" : null));
        mockFetchOffer.mockResolvedValue(sampleOffer(5, "SoloCo", "Intern"));

        setAuthUser();
        render(<CompareOffers />);

        await waitFor(() => expect(mockFetchOffer).toHaveBeenCalledWith("test-token", 5));

        await waitFor(() => {
          expect(screen.getAllByPlaceholderText("Company")[0]).toHaveValue("SoloCo");
        });
      });

      it("hydrates from computedMetrics when comparison has no offer ids", async () => {
        mockSearchGet.mockImplementation((k: string) =>
          k === "comparison" ? "200" : null,
        );
        mockFetchComparison.mockResolvedValue({
          id: 200,
          name: "Snapshot only",
          includedOfferIds: [],
          description: null,
          isPublished: false,
          computedMetrics: JSON.stringify([
            {
              company: "SnapA",
              role: "Dev",
              compensation: "$3,000/mo",
              location: "PDX",
            },
          ]),
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
        });

        setAuthUser();
        render(<CompareOffers />);

        await waitFor(() => {
          expect(screen.getAllByPlaceholderText("Company")[0]).toHaveValue("SnapA");
        });
        expect(screen.getAllByPlaceholderText("Company")).toHaveLength(2);
      });

      it("uses offer query only when both offer and comparison are in the URL", async () => {
        mockSearchGet.mockImplementation((k: string) => {
          if (k === "offer") return "5";
          if (k === "comparison") return "100";
          return null;
        });
        mockFetchOffer.mockResolvedValue(sampleOffer(5, "OnlyOffer", "Role"));

        setAuthUser();
        render(<CompareOffers />);

        await waitFor(() => expect(mockFetchOffer).toHaveBeenCalledWith("test-token", 5));
        expect(mockFetchComparison).not.toHaveBeenCalled();
      });

      it("ends loading state when comparison fetch fails", async () => {
        mockSearchGet.mockImplementation((k: string) =>
          k === "comparison" ? "404" : null,
        );
        mockFetchComparison.mockRejectedValue(new Error("missing"));

        setAuthUser();
        render(<CompareOffers />);

        await waitFor(() => expect(mockFetchComparison).toHaveBeenCalled());
        await waitFor(() => {
          expect(screen.queryByText(/loading saved comparison/i)).not.toBeInTheDocument();
        });
      });
    });
  });
});
