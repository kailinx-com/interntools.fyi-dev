import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaceDetailsClient } from "./PlaceDetailsClient";
import { googleMapsSearchUrlForLocation } from "@/lib/places/client";

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockFetchRelatedPosts = jest.fn();

jest.mock("@/lib/offers/api", () => ({
  fetchRelatedPostsByLocationTokens: (...args: unknown[]) => mockFetchRelatedPosts(...args),
}));

const mockUseParams = jest.fn(() => ({
  placeId: encodeURIComponent("Portland, OR, USA"),
}));

jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
}));

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe("PlaceDetailsClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseParams.mockReturnValue({
      placeId: encodeURIComponent("Portland, OR, USA"),
    });
    mockFetchRelatedPosts.mockResolvedValue([
      {
        id: 1,
        type: "acceptance",
        title: "Acceptance post",
        officeLocation: "HQ Building",
        authorUsername: "alice",
        visibility: "public_post",
        status: "published",
        publishedAt: "2026-01-01T00:00:00Z",
        createdAt: "2026-01-01T00:00:00Z",
        bookmarked: false,
      },
      {
        id: 2,
        type: "comparison",
        title: "Comparison post",
        officeLocation: "Ignored stale office",
        authorUsername: "bob",
        visibility: "public_post",
        status: "published",
        publishedAt: "2026-01-01T00:00:00Z",
        createdAt: "2026-01-01T00:00:00Z",
        bookmarked: false,
      },
    ]);
  });

  it("renders from description in URL and loads related posts without Places Details", async () => {
    render(<PlaceDetailsClient />);

    await waitFor(() => {
      expect(mockFetchRelatedPosts).toHaveBeenCalled();
    });

    expect(screen.getByRole("heading", { name: "Portland" })).toBeInTheDocument();
    expect(screen.getAllByText("Portland, OR, USA").length).toBeGreaterThanOrEqual(1);

    const maps = screen.getByRole("link", { name: /open in google maps/i });
    expect(maps).toHaveAttribute("href", googleMapsSearchUrlForLocation("Portland, OR, USA"));
    expect(maps).toHaveAttribute("target", "_blank");
  });

  it("does not append stale officeLocation in the related list for comparison posts", async () => {
    render(<PlaceDetailsClient />);

    await waitFor(() => {
      expect(screen.getByText("Comparison post")).toBeInTheDocument();
    });

    const cmpLink = screen.getByRole("link", { name: /Comparison post/i });
    expect(cmpLink).toHaveTextContent("@bob");
    expect(cmpLink).toHaveTextContent("comparison");
    expect(cmpLink).not.toHaveTextContent("Ignored stale office");

    const accLink = screen.getByRole("link", { name: /Acceptance post/i });
    expect(accLink).toHaveTextContent("HQ Building");
  });

  it("shows match line from description tokens", async () => {
    render(<PlaceDetailsClient />);

    await waitFor(() => {
      expect(screen.getByText(/match:/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText("Portland, OR, USA").length).toBeGreaterThanOrEqual(1);
  });

  it("shows no posts yet when the related list is empty", async () => {
    mockFetchRelatedPosts.mockResolvedValue([]);

    render(<PlaceDetailsClient />);

    await waitFor(() => {
      expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
    });
  });

  it("shows invalid location when the route segment is empty", () => {
    mockUseParams.mockReturnValue({ placeId: "" });

    render(<PlaceDetailsClient />);

    expect(screen.getByRole("alert")).toHaveTextContent(/invalid location/i);
    expect(mockFetchRelatedPosts).not.toHaveBeenCalled();
  });

  it("shows an error when related posts fetch fails", async () => {
    mockFetchRelatedPosts.mockRejectedValue(new Error("network"));

    render(<PlaceDetailsClient />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to load related posts/i);
    });
  });

  it("toggles local bookmark", async () => {
    const user = userEvent.setup();
    render(<PlaceDetailsClient />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save location/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /save location/i }));
    expect(
      JSON.parse(localStorage.getItem("interntools.savedLocations") ?? "[]"),
    ).toContain("Portland, OR, USA");

    await user.click(screen.getByRole("button", { name: /saved/i }));
    expect(localStorage.getItem("interntools.savedLocations")).toBe("[]");
  });
});
