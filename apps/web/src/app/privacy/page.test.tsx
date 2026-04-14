import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import PrivacyPage from "./page";

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

describe("/privacy page", () => {
  it("renders policy copy", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByText(/do not sell personal data/i)).toBeInTheDocument();
  });

  it("exposes #cookies anchor for footer Cookie Settings link", () => {
    const { container } = render(<PrivacyPage />);
    const cookiesSection = container.querySelector("#cookies");
    expect(cookiesSection).not.toBeNull();
    expect(cookiesSection).toHaveAttribute("id", "cookies");
    expect(
      screen.getByRole("heading", { name: /cookie settings/i }),
    ).toBeInTheDocument();
  });
});
