import { render, screen } from "@testing-library/react";
import { CommunityNoteCard } from "./CommunityNoteCard";

describe("CommunityNoteCard", () => {
  it("renders content and link href", () => {
    render(
      <CommunityNoteCard
        tag="Advice"
        meta="1h ago"
        title="Test title"
        excerpt="Test excerpt"
        href="/offers/1"
      />,
    );

    expect(screen.getByText("Advice")).toBeInTheDocument();
    expect(screen.getByText("1h ago")).toBeInTheDocument();
    expect(screen.getByText("Test title")).toBeInTheDocument();
    expect(screen.getByText("Test excerpt")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/offers/1");
  });

  it("falls back to default href and hides meta when absent", () => {
    render(<CommunityNoteCard tag="Location" title="T" excerpt="E" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "#");
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });
});
