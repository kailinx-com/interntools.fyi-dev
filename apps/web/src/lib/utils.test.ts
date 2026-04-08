import { cn } from "./utils";

describe("cn", () => {
  it("merges class names via clsx and tailwind-merge", () => {
    expect(cn("px-2", "py-1", "px-4")).toMatch(/px-4/);
  });

  it("handles conditional falsy entries", () => {
    expect(cn("base", false && "hidden", undefined, null, "block")).toMatch(/base/);
    expect(cn("base", false && "hidden", undefined, null, "block")).toMatch(/block/);
  });
});
