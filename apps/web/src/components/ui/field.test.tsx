import { render, screen } from "@testing-library/react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "./field";

describe("field ui primitives", () => {
  it("renders field group/label/description", () => {
    render(
      <FieldGroup>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="x">Name</FieldLabel>
          <input id="x" />
          <FieldDescription>Helpful text</FieldDescription>
        </Field>
      </FieldGroup>,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Helpful text")).toBeInTheDocument();
  });

  it("renders deduplicated error messages", () => {
    render(
      <FieldError
        errors={[{ message: "Required" }, { message: "Required" }, { message: "Too short" }]}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("renders separator content", () => {
    render(<FieldSeparator>OR</FieldSeparator>);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });
});
