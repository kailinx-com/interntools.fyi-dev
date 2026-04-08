import { render, screen } from "@testing-library/react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";

describe("navigation-menu primitives", () => {
  it("renders menu with viewport enabled", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/offers">Offers</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect(screen.getByText("Products")).toBeInTheDocument();
  });

  it("renders without viewport when disabled", () => {
    const { container } = render(
      <NavigationMenu viewport={false}>
        <NavigationMenuList />
      </NavigationMenu>,
    );
    expect(container.querySelector('[data-slot="navigation-menu-viewport"]')).toBeNull();
  });
});
