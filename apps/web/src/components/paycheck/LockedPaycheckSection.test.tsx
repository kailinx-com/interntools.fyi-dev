import { render, screen } from "@testing-library/react";
import { LockedPaycheckSection } from "./LockedPaycheckSection";

jest.mock("next/link", () => ({
  __esModule: true,
  default({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  },
}));

describe("LockedPaycheckSection", () => {
  it("shows children without overlay when unlocked", () => {
    render(
      <LockedPaycheckSection locked={false}>
        <div>Secret content</div>
      </LockedPaycheckSection>,
    );

    expect(screen.getByText("Secret content")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
  });

  it("shows lock overlay and login link when locked", () => {
    render(
      <LockedPaycheckSection locked={true} loginHref="/login?next=/calculator">
        <div>Blurred</div>
      </LockedPaycheckSection>,
    );

    expect(screen.getByText("Blurred")).toBeInTheDocument();
    expect(screen.getByText("Log in to view this data")).toBeInTheDocument();
    const login = screen.getByRole("link", { name: /^log in$/i });
    expect(login).toHaveAttribute("href", "/login?next=/calculator");
  });

  it("accepts custom title and description", () => {
    render(
      <LockedPaycheckSection locked title="Custom" description="Details here">
        <span>child</span>
      </LockedPaycheckSection>,
    );

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByText("Details here")).toBeInTheDocument();
  });
});
