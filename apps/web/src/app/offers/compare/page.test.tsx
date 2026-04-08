import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import CompareOffersPage from "./page";

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

jest.mock("@/components/offers/CompareOffers", () => ({
  CompareOffers: () => <div>Compare Offers</div>,
}));

describe("Compare offers page", () => {
  it("renders compare offers view in page shell", () => {
    render(<CompareOffersPage />);

    expect(screen.getByTestId("page-shell")).toBeInTheDocument();
    expect(screen.getByText("Compare Offers")).toBeInTheDocument();
  });
});
