import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SubmitOfferForm } from "./SubmitOfferForm";


const mockPush = jest.fn();
const mockUseAuth = jest.fn();
const mockCreatePost = jest.fn();
const mockGetCompareOffersDraft = jest.fn();
const mockClearCompareOffersDraft = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/offers/api", () => ({
  createPost: (...args: unknown[]) => mockCreatePost(...args),
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
    mockUseAuth.mockReturnValue(authState());
    mockGetCompareOffersDraft.mockReturnValue(null);
    mockCreatePost.mockResolvedValue({ id: 42 });
  });

  it("renders Publish and Save Draft buttons", () => {
    render(<SubmitOfferForm />);
    expect(screen.getByRole("button", { name: /publish/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
  });

  it("clicking Publish submits with status=published and redirects to post", async () => {
    const user = userEvent.setup();
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
    const user = userEvent.setup();
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
    const user = userEvent.setup();
    render(<SubmitOfferForm />);

    await user.click(screen.getByRole("button", { name: /publish/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("shows validation error when title is missing (Save Draft)", async () => {
    const user = userEvent.setup();
    render(<SubmitOfferForm />);

    await user.click(screen.getByRole("button", { name: /save draft/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("shows validation error when company is missing for acceptance type", async () => {
    const user = userEvent.setup();
    render(<SubmitOfferForm />);

    await user.type(screen.getByLabelText(/title/i), "My Post");
    await user.click(screen.getByRole("button", { name: /publish/i }));

    expect(await screen.findByText(/company is required/i)).toBeInTheDocument();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("both buttons are disabled while publishing", async () => {
    let resolveCreate!: (v: unknown) => void;
    mockCreatePost.mockReturnValue(new Promise((res) => { resolveCreate = res; }));

    const user = userEvent.setup();
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

    const user = userEvent.setup();
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

    const user = userEvent.setup();
    render(<SubmitOfferForm />);

    await fillAcceptanceForm(user);
    await user.click(screen.getByRole("button", { name: /publish/i }));

    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });

  it("Comparison type requires at least 2 offers", async () => {
    const user = userEvent.setup();
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
});
