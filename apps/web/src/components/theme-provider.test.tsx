import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";

jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="next-themes">{children}</div>
  ),
}));

describe("ThemeProvider", () => {
  it("wraps children with next-themes provider", () => {
    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(screen.getByTestId("next-themes")).toContainElement(screen.getByText("child"));
  });
});
