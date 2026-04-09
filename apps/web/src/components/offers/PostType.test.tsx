import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PostType } from "./PostType";

describe("PostType", () => {
  it("renders the Post Type heading and all three options", () => {
    render(<PostType value="all" onChange={jest.fn()} />);

    expect(screen.getByText("Post Type")).toBeInTheDocument();
    expect(screen.getByLabelText("All Activities")).toBeInTheDocument();
    expect(screen.getByLabelText("Acceptances")).toBeInTheDocument();
    expect(screen.getByLabelText("Comparisons")).toBeInTheDocument();
  });

  it("marks the current value as checked", () => {
    render(<PostType value="acceptance" onChange={jest.fn()} />);

    expect(screen.getByLabelText("Acceptances")).toBeChecked();
    expect(screen.getByLabelText("All Activities")).not.toBeChecked();
    expect(screen.getByLabelText("Comparisons")).not.toBeChecked();
  });

  it("calls onChange with the selected value when a radio is clicked", async () => {
    const onChange = jest.fn();
    render(<PostType value="all" onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Comparisons"));

    expect(onChange).toHaveBeenCalledWith("comparison");
  });
});
