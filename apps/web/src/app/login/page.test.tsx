import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

jest.mock("@/components/auth/LoginCard", () => ({
  LoginCard: () => <div>Login Card</div>,
}));

describe("Login page", () => {
  it("renders the login card inside page container", () => {
    const { container } = render(<LoginPage />);

    expect(screen.getByText("Login Card")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("min-h-[calc(100vh-4rem)]");
  });
});
