"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Shield } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserRole } from "@/lib/auth/types";
import { isAdminRole } from "@/lib/auth/roleUi";
import {
  fetchAdminUsers,
  patchUserRole,
  type AdminUserRow,
  type AdminUsersPage,
} from "@/lib/admin/api";

const ROLES: UserRole[] = ["STUDENT", "ADMIN"];

const PAGE_SIZE = 10;

type SortField = "username" | "email" | "firstName" | "lastName" | "role";

const SORT_LABEL: Record<SortField, string> = {
  username: "Username",
  email: "Email",
  firstName: "First name",
  lastName: "Last name",
  role: "Role",
};

export function AdminPageClient() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const [pageData, setPageData] = useState<AdminUsersPage | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<number, UserRole>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoadError(null);
    try {
      const data = await fetchAdminUsers(token, {
        page,
        size: PAGE_SIZE,
        sortField,
        sortDir,
        search: appliedSearch,
      });
      setPageData(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load users.";
      setLoadError(msg);
      setPageData(null);
    }
  }, [token, page, sortField, sortDir, appliedSearch]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=/admin");
      return;
    }
    if (!isAdminRole(user?.role)) {
      return;
    }
    void load();
  }, [isLoading, isAuthenticated, user?.role, router, load]);

  useEffect(() => {
    if (!pageData?.content) return;
    const next: Record<number, UserRole> = {};
    for (const u of pageData.content) {
      next[u.id] = u.role;
    }
    setPending(next);
  }, [pageData]);

  function toggleSort(field: SortField) {
    setPage(0);
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function applySearch() {
    setPage(0);
    setAppliedSearch(searchInput.trim());
  }

  async function saveRow(row: AdminUserRow) {
    const role = pending[row.id];
    if (!token || role === undefined || role === row.role) return;
    setSavingId(row.id);
    setLoadError(null);
    try {
      const updated = await patchUserRole(token, row.id, role);
      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((u) => (u.id === updated.id ? updated : u)),
        };
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not update role.";
      setLoadError(msg);
    } finally {
      setSavingId(null);
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24">
          <Spinner className="size-8" />
        </div>
      </PageShell>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!isAdminRole(user.role)) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
          <Shield className="size-12 mx-auto text-muted-foreground" aria-hidden />
          <h1 className="text-2xl font-semibold">Admin only</h1>
          <p className="text-muted-foreground text-sm">
            Your account does not have access to this page.
          </p>
          <Button asChild variant="secondary">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const totalPages = pageData ? Math.max(1, pageData.totalPages) : 1;
  const currentPage = pageData ? pageData.number + 1 : 1;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="size-8 text-muted-foreground" aria-hidden />
            Users
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Platform administration: search and update roles for{" "}
            <span className="text-foreground/90">other</span> accounts (not your own session).
            This screen is separate from the student dashboard and community tools.
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Search by name or email, sort columns, 10 users per page.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:max-w-xl">
          <div className="flex-1 space-y-2">
            <label htmlFor="admin-user-search" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="admin-user-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Username, email, or name"
              className="h-10"
            />
          </div>
          <Button type="button" className="h-10 shrink-0" onClick={applySearch}>
            Search
          </Button>
        </div>

        {loadError ? (
          <p className="text-destructive text-sm" role="alert">
            {loadError}
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>All users</CardTitle>
            <CardDescription>
              {pageData
                ? `${pageData.totalElements} user(s) total · page ${currentPage} of ${totalPages}`
                : "Loading…"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!pageData ? (
              <div className="flex justify-center py-12">
                <Spinner className="size-8" />
              </div>
            ) : (
              <>
                <div className="min-w-0 w-full">
                  <Table className="table-fixed w-full min-w-176">
                    <TableHeader>
                      <TableRow>
                        {(Object.keys(SORT_LABEL) as SortField[]).map((field) => (
                          <TableHead
                            key={field}
                            className={
                              field === "username"
                                ? "w-[16%] min-w-28"
                                : field === "email"
                                  ? "w-[26%] min-w-40"
                                  : field === "firstName"
                                    ? "w-[14%] min-w-20"
                                    : field === "lastName"
                                      ? "w-[14%] min-w-20"
                                      : "w-30 min-w-30"
                            }
                          >
                            <button
                              type="button"
                              className="inline-flex max-w-full items-center gap-1 font-medium hover:text-foreground text-muted-foreground hover:underline"
                              onClick={() => toggleSort(field)}
                            >
                              <span className="truncate">{SORT_LABEL[field]}</span>
                              {sortField === field ? (
                                sortDir === "asc" ? (
                                  <ArrowUp className="size-3.5 shrink-0" aria-hidden />
                                ) : (
                                  <ArrowDown className="size-3.5 shrink-0" aria-hidden />
                                )
                              ) : null}
                            </button>
                          </TableHead>
                        ))}
                        <TableHead className="w-26 min-w-26 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageData.content.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="h-[min(30rem,70vh)] min-h-80 align-middle text-center text-muted-foreground"
                          >
                            No users match this search.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {pageData.content.map((row) => (
                            <TableRow key={row.id} className="h-12">
                              <TableCell className="max-w-0 font-medium">
                                <span className="block truncate" title={row.username}>
                                  {row.username}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-0 text-muted-foreground">
                                <span className="block truncate" title={row.email}>
                                  {row.email}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-0">
                                <span className="block truncate" title={row.firstName}>
                                  {row.firstName}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-0">
                                <span className="block truncate" title={row.lastName}>
                                  {row.lastName}
                                </span>
                              </TableCell>
                              <TableCell className="w-30 min-w-30">
                                <select
                                  className="border rounded-md h-9 w-full max-w-[120px] px-2 text-sm bg-background"
                                  aria-label={`Role for ${row.username}`}
                                  value={pending[row.id] ?? row.role}
                                  onChange={(e) =>
                                    setPending((p) => ({
                                      ...p,
                                      [row.id]: e.target.value as UserRole,
                                    }))
                                  }
                                >
                                  {ROLES.map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell className="w-26 min-w-26 text-right">
                                <Button
                                  size="sm"
                                  disabled={
                                    savingId === row.id ||
                                    (pending[row.id] ?? row.role) === row.role
                                  }
                                  onClick={() => void saveRow(row)}
                                >
                                  {savingId === row.id ? "Saving…" : "Save"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {Array.from({
                            length: Math.max(0, PAGE_SIZE - pageData.content.length),
                          }).map((_, i) => (
                            <TableRow
                              key={`pad-${i}`}
                              aria-hidden
                              className="pointer-events-none h-12 hover:bg-transparent"
                            >
                              <TableCell className="max-w-0 border-b border-border/30" />
                              <TableCell className="max-w-0 border-b border-border/30" />
                              <TableCell className="max-w-0 border-b border-border/30" />
                              <TableCell className="max-w-0 border-b border-border/30" />
                              <TableCell className="border-b border-border/30" />
                              <TableCell className="border-b border-border/30" />
                            </TableRow>
                          ))}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {pageData.totalPages > 1 ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                    {pageData.content.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Showing {(pageData.number ?? 0) * PAGE_SIZE + 1}–
                        {(pageData.number ?? 0) * PAGE_SIZE + pageData.content.length} of{" "}
                        {pageData.totalElements}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No results on this page.</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={page <= 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={page >= pageData.totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
