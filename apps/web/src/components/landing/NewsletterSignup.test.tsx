import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterSignup } from "./NewsletterSignup";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("NewsletterSignup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes to signup with encoded email when onSubmit is not provided", async () => {
    const user = userEvent.setup();
    render(<NewsletterSignup />);

    await user.type(screen.getByPlaceholderText("Your email"), "test+one@example.com");
    await user.click(screen.getByRole("button"));

    expect(mockPush).toHaveBeenCalledWith("/signup?email=test%2Bone%40example.com");
  });

  it("calls onSubmit and shows success state", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<NewsletterSignup onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Your email"), "user@example.com");
    await user.click(screen.getByRole("button"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("user@example.com"));
    expect(screen.getByText("You're on the list!")).toBeInTheDocument();
  });

  it("disables submit button when email is empty and honors custom label", () => {
    render(<NewsletterSignup submitLabel="Join now" />);

    const button = screen.getByRole("button", { name: "Join now" });
    expect(button).toBeDisabled();
  });
});
