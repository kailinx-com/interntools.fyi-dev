import { render, screen } from "@testing-library/react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";

describe("Empty", () => {
  it("renders layout slots and media variants", () => {
    const { rerender } = render(
      <Empty data-testid="empty-root">
        <EmptyHeader>
          <EmptyMedia variant="default" data-testid="media-def" />
          <EmptyMedia variant="icon" data-testid="media-icon" />
          <EmptyTitle>Nothing here</EmptyTitle>
          <EmptyDescription>Add items to get started.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <button type="button">Add</button>
        </EmptyContent>
      </Empty>,
    );

    expect(screen.getByTestId("empty-root")).toHaveAttribute("data-slot", "empty");
    expect(screen.getByTestId("media-def")).toHaveAttribute("data-variant", "default");
    expect(screen.getByTestId("media-icon")).toHaveAttribute("data-variant", "icon");
    expect(screen.getByText("Nothing here")).toHaveAttribute("data-slot", "empty-title");
    expect(screen.getByText("Add items to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();

    rerender(
      <EmptyDescription>
        <a href="/docs">Learn more</a>
      </EmptyDescription>,
    );
    expect(screen.getByRole("link", { name: /learn more/i })).toHaveAttribute("href", "/docs");
  });
});
