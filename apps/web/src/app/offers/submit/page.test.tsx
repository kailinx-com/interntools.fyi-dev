import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import SubmitOfferPage from "./page";

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

jest.mock("@/components/offers/SubmitOfferForm", () => ({
  SubmitOfferForm: () => <div>Submit Offer Form</div>,
}));

describe("Submit offer page", () => {
  it("renders submit offer form in page shell", () => {
    render(<SubmitOfferPage />);

    expect(screen.getByTestId("page-shell")).toBeInTheDocument();
    expect(screen.getByText("Submit Offer Form")).toBeInTheDocument();
  });
});
