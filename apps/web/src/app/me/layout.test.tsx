import { render, screen } from "@testing-library/react";
import MeLayout from "./layout";

describe("MeLayout", () => {
  it("renders children", () => {
    render(
      <MeLayout>
        <span>child</span>
      </MeLayout>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});
