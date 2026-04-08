import { render, screen } from "@testing-library/react";
import { FeatureHighlights } from "./FeatureHighlights";

describe("FeatureHighlights", () => {
  it("renders default features", () => {
    render(<FeatureHighlights />);
    expect(screen.getByText("Paycheck Calculator")).toBeInTheDocument();
    expect(screen.getByText("Compare Offers Side-by-Side")).toBeInTheDocument();
    expect(screen.getByText("Community Feed")).toBeInTheDocument();
  });

  it("renders non-link feature card when href is missing", () => {
    render(
      <FeatureHighlights
        title="Custom"
        features={[
          {
            icon: () => null,
            title: "No Link Feature",
            description: "desc",
          },
        ]}
      />,
    );
    expect(screen.getByText("No Link Feature")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /no link feature/i })).not.toBeInTheDocument();
  });
});
