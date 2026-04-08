import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import SettingsPage from "./page";

const mockSetTheme = jest.fn();

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: mockSetTheme }),
}));

describe("/settings page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders appearance options and changes theme", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: /^settings$/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^dark$/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
