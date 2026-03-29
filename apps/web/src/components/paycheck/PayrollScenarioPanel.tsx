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
  deleteScenario,
  getScenario,
  listScenarios,
  saveScenario,
  type ScenarioSummary,
} from "@/lib/paycheck-persistence";
import { type PaycheckConfig } from "@/lib/paycheck";

type PayrollScenarioPanelProps = {
  currentConfig: PaycheckConfig;
  token: string;
  onLoad: (config: PaycheckConfig) => void;
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

export function PayrollScenarioPanel({
  currentConfig,
  token,
  onLoad,
}: PayrollScenarioPanelProps) {
  const [open, setOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [deletingScenarioId, setDeletingScenarioId] = useState<number | null>(
    null,
  );

  const selectedScenario = useMemo(
    () =>
      scenarios.find((scenario) => String(scenario.id) === selectedScenarioId) ??
      null,
    [scenarios, selectedScenarioId],
  );

  const refreshScenarios = useCallback(
    async (preferredId?: string) => {
      setIsLoadingList(true);
      setListError(null);

      try {
        const nextScenarios = await listScenarios(token);
        setScenarios(nextScenarios);
        setSelectedScenarioId((current) => {
          if (
            preferredId &&
            nextScenarios.some((scenario) => String(scenario.id) === preferredId)
          ) {
            return preferredId;
          }

          if (
            current &&
            nextScenarios.some((scenario) => String(scenario.id) === current)
          ) {
            return current;
          }

          return nextScenarios[0] ? String(nextScenarios[0].id) : "";
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
    void refreshScenarios();
  }, [refreshScenarios]);

  const handleSave = async () => {
    setIsSaving(true);
    setActionError(null);

    try {
      const savedScenario = await saveScenario(token, {
        name: scenarioName,
        config: currentConfig,
      });

      setScenarioName("");
      await refreshScenarios(String(savedScenario.id));
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async () => {
    if (!selectedScenario) {
      return;
    }

    setIsLoadingScenario(true);
    setActionError(null);

    try {
      const detail = await getScenario(token, selectedScenario.id);
      onLoad(detail.config);
      setOpen(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsLoadingScenario(false);
    }
  };

  const handleDelete = async (scenarioId: number) => {
    if (!window.confirm("Delete this saved scenario?")) {
      return;
    }

    setDeletingScenarioId(scenarioId);
    setActionError(null);

    try {
      await deleteScenario(token, scenarioId);
      await refreshScenarios(
        selectedScenarioId === String(scenarioId) ? "" : selectedScenarioId,
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDeletingScenarioId(null);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => {
          setOpen(true);
          void refreshScenarios();
        }}
      >
        <FolderOpen className="size-4" />
        Saved Scenarios
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saved calculator scenarios</DialogTitle>
            <DialogDescription>
              Save the current paycheck configuration, then load or delete saved
              scenarios later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="scenario-name">
              Scenario name
            </label>
            <div className="flex gap-2">
              <Input
                id="scenario-name"
                value={scenarioName}
                maxLength={100}
                placeholder="Summer 2026 internship"
                onChange={(event) => setScenarioName(event.target.value)}
              />
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Spinner /> : <Save className="size-4" />}
                Save current
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Load saved scenario</div>

            {isLoadingList ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Spinner />
                Loading saved scenarios...
              </div>
            ) : scenarios.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No saved scenarios yet.
              </p>
            ) : (
              <>
                <Select
                  value={selectedScenarioId}
                  onValueChange={setSelectedScenarioId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a saved scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((scenario) => (
                      <SelectItem
                        key={scenario.id}
                        value={String(scenario.id)}
                      >
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleLoad}
                  disabled={!selectedScenario || isLoadingScenario}
                >
                  {isLoadingScenario ? <Spinner /> : null}
                  Load selected
                </Button>

                <div className="space-y-2">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{scenario.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {formatCreatedAt(scenario.createdAt)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(scenario.id)}
                        disabled={deletingScenarioId === scenario.id}
                      >
                        {deletingScenarioId === scenario.id ? (
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
