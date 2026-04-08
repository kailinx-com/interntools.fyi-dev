import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import PostDetailPage from "./page";

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

jest.mock("@/components/offers/PostDetail", () => ({
  PostDetail: () => <div>Post Detail</div>,
}));

describe("Post detail page", () => {
  it("renders post detail in page shell", () => {
    render(<PostDetailPage />);

    expect(screen.getByTestId("page-shell")).toBeInTheDocument();
    expect(screen.getByText("Post Detail")).toBeInTheDocument();
  });
});
