"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { LockedPaycheckSection } from "@/components/paycheck/LockedPaycheckSection";
import {
  fetchPost,
  fetchComments,
  fetchVoteTally,
  createComment,
  castVote,
  updatePost,
  bookmarkPost,
  unbookmarkPost,
  type PostDetailResponse,
  type CommentResponse,
  type VoteTallyResponse,
} from "@/lib/offers/api";

type OfferSnapshot = {
  company?: string;
  role?: string;
  compensation?: string;
  label?: string;
  [key: string]: unknown;
};

function parseSnapshots(raw: string | null | undefined): OfferSnapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function initials(username: string): string {
  return username.replace(/^@/, "").slice(0, 2).toUpperCase();
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const ms = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function VoteSection({
  postId,
  snapshots,
  tally: initialTally,
}: {
  postId: number;
  snapshots: OfferSnapshot[];
  tally: VoteTallyResponse | null;
}) {
  const { token } = useAuth();
  const [tally, setTally] = useState(initialTally);
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const totalVotes = tally?.totalVotes ?? 0;
  const tallyMap = tally?.tally ?? {};

  const handleVote = async (index: number) => {
    if (!token) return;
    setIsVoting(true);
    try {
      const result = await castVote(token, postId, { selectedOfferIndex: index });
      setTally(result);
      setVotedIndex(index);
    } catch {
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="space-y-4">
      {snapshots.map((snap, i) => {
        const key = String(i);
        const votes = tallyMap[key] ?? 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        return (
          <button
            key={i}
            className="w-full text-left"
            onClick={() => void handleVote(i)}
            disabled={isVoting}
          >
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className={votedIndex === i ? "text-primary" : ""}>
                {snap.label ?? snap.company ?? `Option ${String.fromCharCode(65 + i)}`}
              </span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} />
          </button>
        );
      })}
      {totalVotes > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  allComments,
  token,
  postId,
  onReplyPosted,
  depth = 0,
}: {
  comment: CommentResponse;
  allComments: CommentResponse[];
  token: string | null;
  postId: number;
  onReplyPosted: (reply: CommentResponse) => void;
  depth?: number;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const directReplies = allComments.filter((c) => c.parentId === comment.id);

  const handleReply = async () => {
    if (!token || !replyText.trim()) return;
    setIsSubmitting(true);
    try {
      const reply = await createComment(token, postId, { body: replyText.trim(), parentId: comment.id });
      onReplyPosted(reply);
      setReplyText("");
      setIsReplying(false);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarSize = depth === 0 ? "size-9" : "size-7";
  const avatarTextSize = depth === 0 ? "text-xs" : "text-[10px]";

  return (
    <div className="flex gap-3">
      <Avatar className={`${avatarSize} shrink-0`}>
        <AvatarFallback className={avatarTextSize}>{initials(comment.authorUsername)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold">@{comment.authorUsername}</span>
          <span className="text-xs text-muted-foreground">{relativeTime(comment.createdAt)}</span>
          {comment.editedAt && <span className="text-xs text-muted-foreground">(edited)</span>}
        </div>
        <p className="text-sm leading-relaxed">{comment.body}</p>
        {token && (
          <button
            className="text-xs text-muted-foreground hover:text-primary mt-1.5 transition-colors"
            onClick={() => setIsReplying((v) => !v)}
          >
            {isReplying ? "Cancel" : "Reply"}
          </button>
        )}

        {isReplying && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to @${comment.authorUsername}…`}
              rows={3}
              className="resize-none text-sm"
              autoFocus
            />
            <div className="flex justify-end">
              <Button size="sm" disabled={!replyText.trim() || isSubmitting} onClick={() => void handleReply()}>
                {isSubmitting ? <Spinner className="size-4" /> : null}
                Post Reply
              </Button>
            </div>
          </div>
        )}

        {directReplies.length > 0 && (
          <div className="mt-4 space-y-4 border-l-2 border-border pl-4">
            {directReplies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                allComments={allComments}
                token={token}
                postId={postId}
                onReplyPosted={onReplyPosted}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentsSection({
  postId,
  initialComments,
}: {
  postId: number;
  initialComments: CommentResponse[];
}) {
  const { token } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!token || !text.trim()) return;
    setIsSubmitting(true);
    try {
      const comment = await createComment(token, postId, { body: text.trim() });
      setComments((prev) => [...prev, comment]);
      setText("");
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyPosted = (reply: CommentResponse) => {
    setComments((prev) => [...prev, reply]);
  };

  const topLevel = comments.filter((c) => c.parentId == null);

  return (
    <div className="space-y-8">
      {token && (
        <div className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your perspective…"
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button disabled={!text.trim() || isSubmitting} onClick={() => void handleSubmit()}>
              {isSubmitting ? <Spinner className="size-4 mr-2" /> : null}
              Post Comment
            </Button>
          </div>
        </div>
      )}

      {topLevel.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <div className="space-y-8">
          {topLevel.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              allComments={comments}
              token={token}
              postId={postId}
              onReplyPosted={handleReplyPosted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PostDetail() {
  const params = useParams();
  const postId = Number(params.id);
  const { user, token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isLocked = !isAuthLoading && !isAuthenticated;

  const [post, setPost] = useState<PostDetailResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [tally, setTally] = useState<VoteTallyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  async function toggleBookmark() {
    if (!token) return;
    setBookmarked((prev) => !prev);
    try {
      if (bookmarked) await unbookmarkPost(token, postId);
      else await bookmarkPost(token, postId);
    } catch {
      setBookmarked((prev) => !prev);
    }
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [postData, commentsData, tallyData] = await Promise.all([
        fetchPost(postId),
        fetchComments(postId).catch(() => [] as CommentResponse[]),
        fetchVoteTally(postId).catch(() => null),
      ]);
      setPost(postData);
      setComments(commentsData);
      setTally(tallyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load post");
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (Number.isFinite(postId)) void load();
  }, [postId, load]);

  useEffect(() => {
    if (post) {
      setEditTitle(post.title);
      setEditBody(post.body ?? "");
      setBookmarked(post.bookmarked);
    }
  }, [post]);

  async function handleSaveEdit() {
    if (!token || !post) return;
    setIsSaving(true);
    try {
      await updatePost(token, post.id, {
        title: editTitle,
        body: editBody || null,
        type: post.type,
        status: post.status,
        visibility: post.visibility,
        offerSnapshots: post.offerSnapshots ?? undefined,
      });
      setIsEditing(false);
      await load();
    } catch {
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublishDraft() {
    if (!token || !post) return;
    setIsSaving(true);
    try {
      await updatePost(token, post.id, {
        title: post.title,
        body: post.body ?? null,
        type: post.type,
        status: "published",
        visibility: post.visibility,
        offerSnapshots: post.offerSnapshots ?? undefined,
      });
      await load();
    } catch {
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-destructive">{error ?? "Post not found"}</p>
        <Button variant="outline" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  const snapshots = parseSnapshots(post.offerSnapshots);
  const bodyParagraphs = post.body
    ? post.body.split(/\n\n+/).filter(Boolean)
    : [];
  const isAuthor = !!user && user.username === post.authorUsername;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <LockedPaycheckSection
          locked={isLocked}
          title="Sign in to read this post"
          description="Create a free account to view offer details, community notes, and voting."
          className="rounded-3xl"
        >
        <div className="space-y-12">
        <div className={post.type === "comparison" ? "grid grid-cols-1 md:grid-cols-12 gap-10 items-start" : ""}>
          {/* Main content */}
          <div className={post.type === "comparison" ? "md:col-span-8 space-y-10" : "space-y-10"}>
            {/* Author */}
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {initials(post.authorUsername)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">@{post.authorUsername}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  Posted {relativeTime(post.publishedAt ?? post.createdAt)} ·{" "}
                  {post.type}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {post.status === "draft" && (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                    Draft
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-widest"
                >
                  {post.type}
                </Badge>
                {token && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("size-8", bookmarked ? "text-primary" : "text-muted-foreground")}
                    onClick={() => void toggleBookmark()}
                    title={bookmarked ? "Remove bookmark" : "Bookmark"}
                  >
                    <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
                  </Button>
                )}
                {isAuthor && !isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setIsEditing(true)}
                    title="Edit post"
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Draft publish banner */}
            {isAuthor && post.status === "draft" && !isEditing && (
              <div className="flex items-center justify-between rounded-lg border border-dashed p-4 text-sm">
                <span className="text-muted-foreground">This post is a draft and not visible to the community.</span>
                <Button size="sm" disabled={isSaving} data-testid="publish-draft-btn" onClick={() => void handlePublishDraft()}>
                  {isSaving ? <Spinner className="size-4 mr-2" /> : null}
                  Publish
                </Button>
              </div>
            )}

            {/* Title */}
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-extrabold h-auto py-2"
                data-testid="edit-title-input"
              />
            ) : (
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                {post.title}
              </h1>
            )}

            {/* Body */}
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={6}
                  placeholder="Add context or notes..."
                  className="resize-none"
                  data-testid="edit-body-input"
                />
                <div className="flex gap-3">
                  <Button disabled={isSaving} onClick={() => void handleSaveEdit()}>
                    {isSaving ? <Spinner className="size-4 mr-2" /> : null}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => { setIsEditing(false); setEditTitle(post.title); setEditBody(post.body ?? ""); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : bodyParagraphs.length > 0 ? (
              <div className="space-y-4">
                {bodyParagraphs.map((para, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            ) : null}

            {/* Offer details / Comparison table */}
            {snapshots.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold">
                  {post.type === "comparison" ? "Offer Comparison" : "Offer Details"}
                </h2>
                <Card className="shadow-none overflow-hidden">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground w-[200px]">
                            Detail
                          </TableHead>
                          {snapshots.map((s, i) => (
                            <TableHead key={i} className="px-6 py-4 font-bold">
                              {s.label ??
                                s.company ??
                                `Option ${String.fromCharCode(65 + i)}`}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                            Company
                          </TableCell>
                          {snapshots.map((s, i) => (
                            <TableCell key={i} className="px-6 py-4 font-bold">
                              {s.company ?? "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                            Role
                          </TableCell>
                          {snapshots.map((s, i) => (
                            <TableCell key={i} className="px-6 py-4 font-bold">
                              {s.role ?? "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-primary/5 font-semibold">
                          <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                            Compensation
                          </TableCell>
                          {snapshots.map((s, i) => (
                            <TableCell key={i} className="px-6 py-4 font-bold">
                              {s.compensation ?? "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar — comparisons only */}
          {post.type === "comparison" && (
            <aside className="md:col-span-4 space-y-6 md:sticky md:top-24">
              {snapshots.length > 0 && (
                <Card className="shadow-none">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Community Vote</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VoteSection
                      postId={post.id}
                      snapshots={snapshots}
                      tally={tally}
                    />
                  </CardContent>
                </Card>
              )}
            </aside>
          )}
        </div>

        {/* Comments — full width below post */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">
            Comments ({comments.length})
          </h2>
          <CommentsSection postId={post.id} initialComments={comments} />
        </div>

        <div className="pt-2">
          <Link href="/offers/submit">
            <Button variant="outline">
              Publish Your Own Post
            </Button>
          </Link>
        </div>
        </div>
        </LockedPaycheckSection>
      </div>
    </div>
  );
}
