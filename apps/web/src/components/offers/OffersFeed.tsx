"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChevronDown } from "lucide-react";
import { Article } from "./Article";
import { OffersFeedHeader } from "./OffersFeedHeader";
import { OutcomeCTA } from "./OutcomeCTA";
import { PostType } from "./PostType";
import { LockedPaycheckSection } from "@/components/paycheck/LockedPaycheckSection";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchPublishedPosts,
  fetchPost,
  type PostSummary,
  type PostDetailResponse,
} from "@/lib/offers/api";

const FREE_POST_LIMIT = 4;

type FeedPost = PostSummary & { offerSnapshots?: string | null };

export function OffersFeed() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isLocked = !isAuthLoading && !isAuthenticated;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setError(null);

    try {
      const result = await fetchPublishedPosts(pageNum);
      const summaries = result.content;

      const detailed = await Promise.all(
        summaries.map(async (s): Promise<FeedPost> => {
          try {
            const detail: PostDetailResponse = await fetchPost(s.id);
            return { ...s, offerSnapshots: detail.offerSnapshots };
          } catch {
            return { ...s, offerSnapshots: null };
          }
        }),
      );

      setPosts((prev) => (append ? [...prev, ...detailed] : detailed));
      setHasMore(!result.last);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    void loadPage(nextPage, true);
  };

  const filteredPosts =
    filter === "all" ? posts : posts.filter((p) => p.type === filter);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto space-y-6 p-4 md:p-8">
        <section className="mb-16">
          <OffersFeedHeader />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <aside className="md:col-span-3 space-y-10">
            <PostType value={filter} onChange={setFilter} />
            <OutcomeCTA />
          </aside>

          <div className="md:col-span-9 space-y-8">
            {isLoading && (
              <div className="flex justify-center py-16">
                <Spinner className="size-8" />
              </div>
            )}

            {error && !isLoading && (
              <div className="text-center py-16 space-y-4">
                <p className="text-destructive">{error}</p>
                <Button variant="outline" onClick={() => void loadPage(0, false)}>
                  Try again
                </Button>
              </div>
            )}

            {!isLoading && !error && filteredPosts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  {filter === "all"
                    ? "No posts yet. Be the first to share!"
                    : `No ${filter} posts yet.`}
                </p>
              </div>
            )}

            {filteredPosts.slice(0, isLocked ? FREE_POST_LIMIT : filteredPosts.length).map((post) => (
              <Article
                key={post.id}
                post={post}
                offerSnapshots={post.offerSnapshots}
              />
            ))}

            {isLocked && filteredPosts.length > FREE_POST_LIMIT && (
              <LockedPaycheckSection
                locked
                title="Sign in to see more posts"
                description="Create a free account to browse the full offers feed and read every post."
                className="rounded-3xl"
              >
                <div className="space-y-8 pointer-events-none">
                  {filteredPosts.slice(FREE_POST_LIMIT, FREE_POST_LIMIT + 2).map((post) => (
                    <Article key={post.id} post={post} offerSnapshots={post.offerSnapshots} />
                  ))}
                </div>
              </LockedPaycheckSection>
            )}

            {!isLocked && hasMore && !isLoading && filteredPosts.length > 0 && (
              <div className="py-8 flex justify-center">
                <Button
                  variant="outline"
                  className="rounded-full gap-2 px-8 p-4"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? <Spinner className="size-4" /> : <ChevronDown className="size-4" />}
                  Load more activity
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
