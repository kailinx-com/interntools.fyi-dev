import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import TermsPage from "./page";

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

describe("/terms page", () => {
  it("renders terms copy", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByText(/informational purposes/i)).toBeInTheDocument();
  });
});
