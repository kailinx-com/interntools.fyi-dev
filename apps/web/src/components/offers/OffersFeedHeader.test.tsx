import React from "react";
import { render, screen } from "@testing-library/react";

import { OffersFeedHeader } from "./OffersFeedHeader";

describe("OffersFeedHeader", () => {
  it("renders the headline and description", () => {
    render(<OffersFeedHeader />);

    expect(screen.getByText("Community Intelligence.")).toBeInTheDocument();
    expect(
      screen.getByText(/A curated stream of real-world internship outcomes/i),
    ).toBeInTheDocument();
  });
});
