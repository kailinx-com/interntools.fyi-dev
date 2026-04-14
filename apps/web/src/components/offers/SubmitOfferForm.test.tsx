import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SubmitOfferForm } from "./SubmitOfferForm";


const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseAuth = jest.fn();
const mockCreatePost = jest.fn();
const mockFetchOffer = jest.fn();
const mockGetCompareOffersDraft = jest.fn();
const mockClearCompareOffersDraft = jest.fn();

const mockSearchGet = jest.fn((_k: string) => null as string | null);

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({
    get: (k: string) => mockSearchGet(k),
    toString: () => {
      const offerId = mockSearchGet("offerId");
      const from = mockSearchGet("from");
      const parts: string[] = [];
      if (offerId) parts.push(`offerId=${encodeURIComponent(String(offerId))}`);
      if (from) parts.push(`from=${encodeURIComponent(String(from))}`);
      return parts.join("&");
    },
  }),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/offers/api", () => ({
  createPost: (...args: unknown[]) => mockCreatePost(...args),
  fetchOffer: (...args: unknown[]) => mockFetchOffer(...args),
}));

jest.mock("@/lib/offers", () => ({
  getCompareOffersDraft: () => mockGetCompareOffersDraft(),
  clearCompareOffersDraft: () => mockClearCompareOffersDraft(),
}));

jest.mock("next/link", () => {
  return function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode }) {
    return <a href={href} {...props}>{children}</a>;
  };
});


function authState(overrides = {}) {
  return {
    token: "test-token",
    isAuthenticated: true,
    isLoading: false,
    ...overrides,
  };
}

async function fillAcceptanceForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/title/i), "Google SWE Offer");
  await user.type(screen.getByLabelText(/company/i), "Google");
  await user.type(screen.getByLabelText(/role/i), "SWE Intern");
  await user.type(screen.getByLabelText(/compensation/i), "$9,000/mo");
}


describe("SubmitOfferForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchGet.mockImplementation(() => null);
    mockUseAuth.mockReturnValue(authState());
    mockGetCompareOffersDraft.mockReturnValue(null);
    mockCreatePost.mockResolvedValue({ id: 42 });
    mockFetchOffer.mockResolvedValue({
      id: 1,
      company: "Co",
      title: "Role",
      employmentType: "internship",
      compensationType: "hourly",
      payAmount: 50,
      hoursPerWeek: 40,
      signOnBonus: null,
      relocationAmount: null,
      equityNotes: null,
      officeLocation: "NYC",
      daysInOffice: null,
      notes: null,
      favorite: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    });
  });

  it("renders Publish and Save Draft buttons", () => {
    render(<SubmitOfferForm />);
    expect(screen.getByRole("button", { name: /publish/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
  });

  it("clicking Publish submits with status=published and redirects to post", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    await fillAcceptanceForm(user);
    await user.click(screen.getByRole("button", { name: /publish/i }));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({ status: "published", title: "Google SWE Offer" }),
      );
    });
    expect(mockPush).toHaveBeenCalledWith("/offers/42");
  });

  it("clicking Save Draft submits with status=draft and redirects to /me", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    await fillAcceptanceForm(user);
    await user.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({ status: "draft", title: "Google SWE Offer" }),
      );
    });
    expect(mockPush).toHaveBeenCalledWith("/me");
  });

  it("shows validation error when title is missing (Publish)", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    await user.click(screen.getByRole("button", { name: /publish/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("shows validation error when title is missing (Save Draft)", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    await user.click(screen.getByRole("button", { name: /save draft/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("shows validation error when company is missing for acceptance type", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    await user.type(screen.getByLabelText(/title/i), "My Post");
    await user.click(screen.getByRole("button", { name: /publish/i }));

    expect(await screen.findByText(/company is required/i)).toBeInTheDocument();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("both buttons are disabled while publishing", async () => {
    let resolveCreate!: (v: unknown) => void;
    mockCreatePost.mockReturnValue(new Promise((res) => { resolveCreate = res; }));

    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    await fillAcceptanceForm(user);
    await user.click(screen.getByRole("button", { name: /publish/i }));

    expect(screen.getByRole("button", { name: /publish/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /save draft/i })).toBeDisabled();

    resolveCreate({ id: 1 });
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
  });

  it("both buttons are disabled while saving draft", async () => {
    let resolveCreate!: (v: unknown) => void;
    mockCreatePost.mockReturnValue(new Promise((res) => { resolveCreate = res; }));

    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    await fillAcceptanceForm(user);
    await user.click(screen.getByRole("button", { name: /save draft/i }));

    expect(screen.getByRole("button", { name: /publish/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /save draft/i })).toBeDisabled();

    resolveCreate({ id: 1 });
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
  });

  it("shows error message when createPost fails", async () => {
    mockCreatePost.mockRejectedValue(new Error("Server error"));

    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    await fillAcceptanceForm(user);
    await user.click(screen.getByRole("button", { name: /publish/i }));

    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });

  it("Comparison type requires at least 2 offers", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    await user.type(screen.getByLabelText(/title/i), "My Comparison");

    await user.click(screen.getByRole("button", { name: /comparison/i }));

    const companyInputs = screen.getAllByPlaceholderText("Company");
    await user.clear(companyInputs[0]);
    await user.type(companyInputs[0], "Google");

    await user.click(screen.getByRole("button", { name: /publish/i }));

    expect(await screen.findByText(/at least 2 offers/i)).toBeInTheDocument();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("hides the post location picker for Comparison and shows the dashed note", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    expect(screen.getByTestId("office-location-input")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^comparison$/i }));

    expect(screen.queryByTestId("office-location-input")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Location search uses each compared offer/i),
    ).toBeInTheDocument();
  });

  it("keeps the office location picker visible for Acceptance", () => {
    render(<SubmitOfferForm />);
    expect(screen.getByTestId("office-location-input")).toBeInTheDocument();
  });

  it("sends officeLocation null in the payload for Comparison posts", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SubmitOfferForm />);

    await user.type(screen.getByLabelText(/title/i), "Two-way compare");
    await user.click(screen.getByRole("button", { name: /^comparison$/i }));

    const companyInputs = screen.getAllByPlaceholderText("Company");
    await user.type(companyInputs[0], "Acme");
    await user.type(companyInputs[1], "Beta");

    const roleInputs = screen.getAllByPlaceholderText("Role");
    await user.type(roleInputs[0], "Eng");
    await user.type(roleInputs[1], "Eng");

    const compInputs = screen.getAllByPlaceholderText("e.g. $8,500/mo");
    await user.type(compInputs[0], "$1/mo");
    await user.type(compInputs[1], "$2/mo");

    await user.click(screen.getByRole("button", { name: /publish/i }));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({
          type: "comparison",
          officeLocation: null,
          status: "published",
        }),
      );
    });
  });

  it("prefills from saved offer when offerId is in the URL", async () => {
    mockSearchGet.mockImplementation((k: string) =>
      k === "offerId" ? "88" : null,
    );
    mockFetchOffer.mockResolvedValueOnce({
      id: 88,
      company: "Co",
      title: "Role",
      employmentType: "internship",
      compensationType: "hourly",
      payAmount: 50,
      hoursPerWeek: 40,
      signOnBonus: null,
      relocationAmount: null,
      equityNotes: null,
      officeLocation: "NYC",
      daysInOffice: null,
      notes: null,
      favorite: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    });

    render(<SubmitOfferForm />);

    await waitFor(() => expect(mockFetchOffer).toHaveBeenCalledWith("test-token", 88));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/offers/submit", { scroll: false }));

    expect(screen.getByDisplayValue("Co — Role")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Co")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Role")).toBeInTheDocument();
    expect(screen.getByDisplayValue("$50/hr")).toBeInTheDocument();
    expect(screen.getByTestId("office-location-input")).toHaveValue("NYC");
    expect(screen.getByText(/prefilled from saved offer/i)).toBeInTheDocument();
  });

  it("includes offerId in publish payload after prefill from saved offer", async () => {
    const user = userEvent.setup({ delay: null });
    mockSearchGet.mockImplementation((k: string) =>
      k === "offerId" ? "88" : null,
    );
    mockFetchOffer.mockResolvedValueOnce({
      id: 88,
      company: "Co",
      title: "Role",
      employmentType: "internship",
      compensationType: "hourly",
      payAmount: 50,
      hoursPerWeek: 40,
      signOnBonus: null,
      relocationAmount: null,
      equityNotes: null,
      officeLocation: "NYC",
      daysInOffice: null,
      notes: null,
      favorite: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    });

    render(<SubmitOfferForm />);

    await waitFor(() => expect(mockFetchOffer).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /publish/i }));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({
          status: "published",
          offers: [
            expect.objectContaining({
              offerId: 88,
              company: "Co",
              role: "Role",
              compensationText: "$50/hr",
            }),
          ],
        }),
      );
    });
  });

  it("includes offerId in save-draft payload after prefill from saved offer", async () => {
    const user = userEvent.setup({ delay: null });
    mockSearchGet.mockImplementation((k: string) =>
      k === "offerId" ? "88" : null,
    );
    mockFetchOffer.mockResolvedValueOnce({
      id: 88,
      company: "Co",
      title: "Role",
      employmentType: "internship",
      compensationType: "hourly",
      payAmount: 50,
      hoursPerWeek: 40,
      signOnBonus: null,
      relocationAmount: null,
      equityNotes: null,
      officeLocation: "NYC",
      daysInOffice: null,
      notes: null,
      favorite: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    });

    render(<SubmitOfferForm />);

    await waitFor(() => expect(mockFetchOffer).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({
          status: "draft",
          offers: [expect.objectContaining({ offerId: 88 })],
        }),
      );
    });
  });

  it("does not fetch when offerId is missing or invalid", () => {
    mockSearchGet.mockImplementation((k: string) =>
      k === "offerId" ? "not-a-number" : null,
    );

    render(<SubmitOfferForm />);

    expect(mockFetchOffer).not.toHaveBeenCalled();
  });

  it("does not fetch when offerId is zero", () => {
    mockSearchGet.mockImplementation((k: string) =>
      k === "offerId" ? "0" : null,
    );

    render(<SubmitOfferForm />);

    expect(mockFetchOffer).not.toHaveBeenCalled();
  });

  it("shows an error when saved offer fetch fails", async () => {
    mockSearchGet.mockImplementation((k: string) =>
      k === "offerId" ? "99" : null,
    );
    mockFetchOffer.mockRejectedValueOnce(new Error("missing"));

    render(<SubmitOfferForm />);

    expect(
      await screen.findByText(/could not load that saved offer/i),
    ).toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/offers/submit", { scroll: false });
  });
});
