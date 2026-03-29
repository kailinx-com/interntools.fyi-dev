"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  deletePlannerDocument,
  getPlannerDocument,
  listPlannerDocuments,
  savePlannerDocument,
  type PlannerDetail,
  type PlannerDocumentPayload,
  type PlannerSummary,
} from "@/lib/paycheck-persistence";

type PlannerDocumentPanelProps = {
  token: string;
  months: PlannerDocumentPayload["months"];
  expenses: PlannerDocumentPayload["expenses"];
  onLoad: (data: PlannerDetail["data"]) => void;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function formatCreatedAt(createdAt: string): string {
  const parsed = new Date(createdAt);

  if (Number.isNaN(parsed.getTime())) {
    return "Saved recently";
  }

  return parsed.toLocaleString();
}

export function PlannerDocumentPanel({
  token,
  months,
  expenses,
  onLoad,
}: PlannerDocumentPanelProps) {
  const [open, setOpen] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [documents, setDocuments] = useState<PlannerSummary[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const refreshDocuments = useCallback(
    async (preferredId?: string) => {
      setIsLoadingList(true);
      setListError(null);

      try {
        const nextDocuments = await listPlannerDocuments(token);
        setDocuments(nextDocuments);
        setSelectedDocumentId((current) => {
          if (preferredId && nextDocuments.some((document) => document.id === preferredId)) {
            return preferredId;
          }

          if (current && nextDocuments.some((document) => document.id === current)) {
            return current;
          }

          return nextDocuments[0]?.id ?? "";
        });
      } catch (error) {
        setListError(getErrorMessage(error));
      } finally {
        setIsLoadingList(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  const handleSave = async () => {
    setIsSaving(true);
    setActionError(null);

    try {
      const savedDocument = await savePlannerDocument(token, {
        name: documentName,
        data: { months, expenses },
      });

      setDocumentName("");
      await refreshDocuments(savedDocument.id);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async () => {
    if (!selectedDocument) {
      return;
    }

    setIsLoadingDocument(true);
    setActionError(null);

    try {
      const detail = await getPlannerDocument(token, selectedDocument.id);
      onLoad(detail.data);
      setOpen(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsLoadingDocument(false);
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
      await refreshDocuments(
        selectedDocumentId === documentId ? "" : selectedDocumentId,
      );
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
        className="gap-2"
        onClick={() => {
          setOpen(true);
          void refreshDocuments();
        }}
      >
        <FolderOpen className="size-4" />
        Saved Plans
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saved planner documents</DialogTitle>
            <DialogDescription>
              Save the current monthly income and expense JSON, then load or
              delete saved plans later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="planner-name">
              Planner name
            </label>
            <div className="flex gap-2">
              <Input
                id="planner-name"
                value={documentName}
                maxLength={100}
                placeholder="Apartment budget plan"
                onChange={(event) => setDocumentName(event.target.value)}
              />
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Spinner /> : <Save className="size-4" />}
                Save current
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Load saved plan</div>

            {isLoadingList ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Spinner />
                Loading saved plans...
              </div>
            ) : documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No saved plans yet.</p>
            ) : (
              <>
                <Select
                  value={selectedDocumentId}
                  onValueChange={setSelectedDocumentId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a saved plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((document) => (
                      <SelectItem key={document.id} value={document.id}>
                        {document.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleLoad}
                  disabled={!selectedDocument || isLoadingDocument}
                >
                  {isLoadingDocument ? <Spinner /> : null}
                  Load selected
                </Button>

                <div className="space-y-2">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{document.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {formatCreatedAt(document.createdAt)}
                        </div>
                      </div>
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
                  ))}
                </div>
              </>
            )}
          </div>

          {listError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{listError}</p>
          ) : null}

          {actionError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {actionError}
            </p>
          ) : null}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
