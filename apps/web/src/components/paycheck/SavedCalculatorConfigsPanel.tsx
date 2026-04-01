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
  getStoredSelectedCalculatorConfig,
  saveStoredSelectedCalculatorConfig,
  type StoredSelectedCalculatorConfig,
} from "@/lib/paycheck-draft";
import {
  deleteCalculatorConfig,
  formatSavedItemTimestamp,
  getCalculatorConfig,
  listCalculatorConfigs,
  saveCalculatorConfig,
  type SavedCalculatorConfigDetail,
  type SavedCalculatorConfigSummary,
} from "@/lib/paycheck-persistence";
import { type PaycheckConfig } from "@/lib/paycheck";

type SavedCalculatorConfigsPanelProps = {
  token: string;
  currentConfig: PaycheckConfig;
  onLoad: (detail: SavedCalculatorConfigDetail) => void;
  manageButtonLabel?: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function SavedCalculatorConfigsPanel({
  token,
  currentConfig,
  onLoad,
  manageButtonLabel = "Manage configs",
}: SavedCalculatorConfigsPanelProps) {
  const [open, setOpen] = useState(false);
  const [configName, setConfigName] = useState("");
  const [selectedConfig, setSelectedConfig] =
    useState<StoredSelectedCalculatorConfig | null>(() =>
      getStoredSelectedCalculatorConfig(),
    );
  const [configs, setConfigs] = useState<SavedCalculatorConfigSummary[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingConfigId, setLoadingConfigId] = useState<number | null>(null);
  const [deletingConfigId, setDeletingConfigId] = useState<number | null>(null);

  const canSave = configName.trim().length > 0 && !isSaving;

  const syncSelectedConfig = (
    nextSelectedConfig: StoredSelectedCalculatorConfig | null,
  ) => {
    setSelectedConfig(nextSelectedConfig);
    saveStoredSelectedCalculatorConfig(nextSelectedConfig);
  };

  const refreshConfigs = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const nextConfigs = await listCalculatorConfigs(token);
      setConfigs(nextConfigs);

      if (!selectedConfig) {
        return;
      }

      const matchingConfig = nextConfigs.find(
        (config) => config.id === selectedConfig.id,
      );

      if (!matchingConfig) {
        syncSelectedConfig(null);
      }
    } catch (error) {
      setListError(getErrorMessage(error));
    } finally {
      setIsLoadingList(false);
    }
  }, [selectedConfig, token]);

  useEffect(() => {
    if (selectedConfig) {
      setConfigName(selectedConfig.name);
      return;
    }

    setConfigName("");
  }, [selectedConfig]);

  useEffect(() => {
    if (open) {
      void refreshConfigs();
    }
  }, [open, refreshConfigs]);

  const handleSave = async () => {
    setIsSaving(true);
    setActionError(null);

    try {
      const detail = await saveCalculatorConfig(token, {
        name: configName,
        config: currentConfig,
      });
      syncSelectedConfig({
        id: detail.id,
        name: detail.name,
        config: detail.config,
      });
      setConfigName(detail.name);
      await refreshConfigs();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (configId: number) => {
    setLoadingConfigId(configId);
    setActionError(null);

    try {
      const detail = await getCalculatorConfig(token, configId);
      syncSelectedConfig({
        id: detail.id,
        name: detail.name,
        config: detail.config,
      });
      onLoad(detail);
      setOpen(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setLoadingConfigId(null);
    }
  };

  const handleDelete = async (configId: number) => {
    if (!window.confirm("Delete this saved calculator config?")) {
      return;
    }

    setDeletingConfigId(configId);
    setActionError(null);

    try {
      await deleteCalculatorConfig(token, configId);

      if (selectedConfig?.id === configId) {
        syncSelectedConfig(null);
      }

      await refreshConfigs();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDeletingConfigId(null);
    }
  };

  return (
    <>
      <div className="bg-muted/30 space-y-3 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">Saved config</p>
          {selectedConfig ? (
            <p className="text-muted-foreground min-w-0 truncate text-sm">
              Selected: {selectedConfig.name}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Input
            id="saved-calculator-config-name"
            value={configName}
            maxLength={100}
            placeholder="Summer 2026 internship config"
            onChange={(event) => setConfigName(event.target.value)}
            className="bg-background min-w-0 flex-1"
          />
          <Button onClick={handleSave} disabled={!canSave}>
            {isSaving ? <Spinner /> : <Save className="size-4" />}
            Save
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setOpen(true)}
        >
          <FolderOpen className="size-4" />
          {manageButtonLabel}
        </Button>

        {actionError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage calculator configs</DialogTitle>
            <DialogDescription>
              Load or delete your saved paycheck calculator configurations.
            </DialogDescription>
          </DialogHeader>

          {selectedConfig ? (
            <div className="bg-muted/40 space-y-2 rounded-lg border p-3">
              <div className="text-sm font-medium">Current calculator config</div>
              <div className="text-muted-foreground text-sm">
                {selectedConfig.name}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="text-sm font-medium">Saved calculator configs</div>

            {isLoadingList ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Spinner />
                Loading calculator configs...
              </div>
            ) : configs.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No saved calculator configs yet.
              </p>
            ) : (
              <div className="space-y-2">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{config.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {formatSavedItemTimestamp(config.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedConfig?.id === config.id ? (
                        <span className="text-muted-foreground text-xs font-medium">
                          Current
                        </span>
                      ) : null}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLoad(config.id)}
                        disabled={loadingConfigId === config.id}
                      >
                        {loadingConfigId === config.id ? <Spinner /> : null}
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(config.id)}
                        disabled={deletingConfigId === config.id}
                      >
                        {deletingConfigId === config.id ? (
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

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
