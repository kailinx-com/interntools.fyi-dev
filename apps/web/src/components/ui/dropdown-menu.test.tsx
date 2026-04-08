import { render, screen } from "@testing-library/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("dropdown-menu primitives", () => {
  it("renders trigger/content elements", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel inset>Actions</DropdownMenuLabel>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          <DropdownMenuShortcut>Cmd+D</DropdownMenuShortcut>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Cmd+D")).toBeInTheDocument();
  });
});
