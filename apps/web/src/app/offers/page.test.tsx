import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import OffersPage from "./page";

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

jest.mock("@/components/offers/OffersFeed", () => ({
  OffersFeed: () => <div>Offers Feed</div>,
}));

describe("Offers page", () => {
  it("renders offers feed in page shell", () => {
    render(<OffersPage />);

    expect(screen.getByTestId("page-shell")).toBeInTheDocument();
    expect(screen.getByText("Offers Feed")).toBeInTheDocument();
  });
});
