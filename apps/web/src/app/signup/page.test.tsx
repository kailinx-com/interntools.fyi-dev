import { render, screen } from "@testing-library/react";
import SignupPage from "./page";

jest.mock("@/components/auth/SignupCard", () => ({
  SignupCard: () => <div>Signup Card</div>,
}));

describe("Signup page", () => {
  it("renders signup card inside page container", () => {
    const { container } = render(<SignupPage />);

    expect(screen.getByText("Signup Card")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("min-h-[calc(100vh-4rem)]");
  });
});
