"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  getStoredSelectedPlannerDocument,
  saveStoredSelectedPlannerDocument,
  type StoredSelectedPlannerDocument,
} from "@/lib/paycheck/draft";
import {
  deletePlannerDocument,
  formatSavedItemTimestamp,
  getPlannerDocument,
  listPlannerDocuments,
  savePlannerDocument,
  type PlannerExpense,
  type SavedPlannerDocumentDetail,
  type SavedPlannerDocumentSummary,
} from "@/lib/paycheck/api";

type PlannerDocumentsPanelProps = {
  token: string;
  currentExpenses: PlannerExpense[];
  onLoad: (detail: SavedPlannerDocumentDetail) => void;
  triggerLabel?: string;
  compact?: boolean;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function PlannerDocumentsPanel({
  token,
  currentExpenses,
  onLoad,
  triggerLabel = "Planner docs",
  compact = false,
}: PlannerDocumentsPanelProps) {
  const [open, setOpen] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [selectedDocument, setSelectedDocument] =
    useState<StoredSelectedPlannerDocument | null>(() =>
      getStoredSelectedPlannerDocument(),
    );
  const [documents, setDocuments] = useState<SavedPlannerDocumentSummary[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  const canSave = documentName.trim().length > 0 && !isSaving;

  const syncSelectedDocument = (
    nextSelectedDocument: StoredSelectedPlannerDocument | null,
  ) => {
    setSelectedDocument(nextSelectedDocument);
    saveStoredSelectedPlannerDocument(nextSelectedDocument);
  };

  const refreshDocuments = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const nextDocuments = await listPlannerDocuments(token);
      setDocuments(nextDocuments);

      if (!selectedDocument) {
        return;
      }

      const matchingDocument = nextDocuments.find(
        (document) => document.id === selectedDocument.id,
      );

      if (!matchingDocument) {
        syncSelectedDocument(null);
      }
    } catch (error) {
      setListError(getErrorMessage(error));
    } finally {
      setIsLoadingList(false);
    }
  }, [selectedDocument, token]);

  useEffect(() => {
    if (open) {
      void refreshDocuments();
    }
  }, [open, refreshDocuments]);

  const handleSave = async () => {
    setIsSaving(true);
    setActionError(null);

    try {
      const detail = await savePlannerDocument(token, {
        name: documentName,
        plannerData: { expenses: currentExpenses },
      });
      syncSelectedDocument({ id: detail.id, name: detail.name });
      setDocumentName("");
      await refreshDocuments();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (documentId: string) => {
    setLoadingDocumentId(documentId);
    setActionError(null);

    try {
      const detail = await getPlannerDocument(token, documentId);
      syncSelectedDocument({ id: detail.id, name: detail.name });
      onLoad(detail);
      setOpen(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setLoadingDocumentId(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm("Delete this saved planner document?")) {
      return;
    }

    setDeletingDocumentId(documentId);
    setActionError(null);

    try {
      await deletePlannerDocument(token, documentId);

      if (selectedDocument?.id === documentId) {
        syncSelectedDocument(null);
      }

      await refreshDocuments();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDeletingDocumentId(null);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <FolderOpen className="size-4" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planner documents</DialogTitle>
            <DialogDescription>
              Save only your planner expenses here. Pick the calculator config
              separately in the planner header.
            </DialogDescription>
          </DialogHeader>

          {selectedDocument ? (
            <div className="bg-muted/40 space-y-2 rounded-lg border p-3">
              <div className="text-sm font-medium">Current planner document</div>
              <div className="text-muted-foreground text-sm">
                {selectedDocument.name}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="planner-document-name">
              Document name
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="planner-document-name"
                value={documentName}
                maxLength={100}
                placeholder="Summer 2026 expense plan"
                onChange={(event) => setDocumentName(event.target.value)}
                className="min-w-0 flex-1"
              />
              <Button onClick={handleSave} disabled={!canSave}>
                {isSaving ? <Spinner /> : <Save className="size-4" />}
                Save doc
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Saved planner documents</div>

            {isLoadingList ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Spinner />
                Loading planner documents...
              </div>
            ) : documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No saved planner documents yet.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{document.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {formatSavedItemTimestamp(document.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedDocument?.id === document.id ? (
                        <span className="text-muted-foreground text-xs font-medium">
                          Current
                        </span>
                      ) : null}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLoad(document.id)}
                        disabled={loadingDocumentId === document.id}
                      >
                        {loadingDocumentId === document.id ? <Spinner /> : null}
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                        disabled={deletingDocumentId === document.id}
                      >
                        {deletingDocumentId === document.id ? (
                          <Spinner />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {listError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{listError}</p>
          ) : null}

          {actionError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
          ) : null}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
