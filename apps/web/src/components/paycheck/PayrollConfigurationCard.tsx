"use client";

import { type ReactNode, useState } from "react";
import { ChevronDown, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type FicaMode, type PaycheckConfig } from "@/lib/paycheck";

type ConfigChangeHandler = <K extends keyof PaycheckConfig>(
  key: K,
  value: PaycheckConfig[K],
) => void;

type PayrollConfigurationCardProps = {
  config: PaycheckConfig;
  states: Array<{ value: string; label: string }>;
  ficaMode: FicaMode;
  onConfigChange: ConfigChangeHandler;
  savedPlansPanel?: ReactNode;
  savedPlansHint?: string | null;
};

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value: string, fallback = 0): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function PayrollConfigurationCard({
  config,
  states,
  ficaMode,
  onConfigChange,
  savedPlansPanel,
  savedPlansHint,
}: PayrollConfigurationCardProps) {
  const [isTaxStatusOpen, setIsTaxStatusOpen] = useState(false);

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="size-4" />
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {savedPlansPanel || savedPlansHint ? (
          <div className="space-y-3">
            {savedPlansHint ? (
              <p className="text-muted-foreground text-sm">{savedPlansHint}</p>
            ) : null}
            {savedPlansPanel}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={config.startDate}
              onChange={(e) => onConfigChange("startDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={config.endDate}
              onChange={(e) => onConfigChange("endDate", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hourly-rate">Hourly Rate ($)</Label>
            <Input
              id="hourly-rate"
              type="number"
              placeholder="25"
              value={config.hourlyRate}
              onChange={(e) =>
                onConfigChange("hourlyRate", parseNumber(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stipend">Stipend ($/wk)</Label>
            <Input
              id="stipend"
              type="number"
              placeholder="0"
              value={config.stipendPerWeek}
              onChange={(e) =>
                onConfigChange("stipendPerWeek", parseNumber(e.target.value))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hours-per-day">Hours / Day</Label>
            <Input
              id="hours-per-day"
              type="number"
              placeholder="8"
              value={config.workHoursPerDay}
              onChange={(e) =>
                onConfigChange("workHoursPerDay", parseNumber(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="days-per-week">Days / Week</Label>
            <Input
              id="days-per-week"
              type="number"
              placeholder="5"
              value={config.workDaysPerWeek}
              onChange={(e) =>
                onConfigChange("workDaysPerWeek", parseNumber(e.target.value))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Work State</Label>
            <Select
              value={config.state}
              onValueChange={(value) => onConfigChange("state", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Residency</Label>
            <Select
              value={config.residency}
              onValueChange={(value: "resident" | "nonresident") =>
                onConfigChange("residency", value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Residency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nonresident">Non-Resident</SelectItem>
                <SelectItem value="resident">Resident</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Collapsible
          open={isTaxStatusOpen}
          onOpenChange={setIsTaxStatusOpen}
          className="rounded-lg border"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
            <span className="font-semibold">Tax Status</span>
            <ChevronDown
              className={`text-muted-foreground size-4 transition-transform ${
                isTaxStatusOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 px-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visa Type</Label>
                <Select
                  value={config.visaType}
                  onValueChange={(value: "F1" | "J1" | "M1" | "Other") =>
                    onConfigChange("visaType", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F1">F-1 Student</SelectItem>
                    <SelectItem value="J1">J-1 Exchange</SelectItem>
                    <SelectItem value="M1">M-1 Vocational</SelectItem>
                    <SelectItem value="Other">Other / Citizen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival-year">Arrival Year</Label>
                <Input
                  id="arrival-year"
                  type="number"
                  step="1"
                  placeholder="2024"
                  value={config.arrivalYear}
                  onChange={(e) =>
                    onConfigChange("arrivalYear", parseInteger(e.target.value))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">FICA Status</span>
              <Badge variant={ficaMode === "exempt" ? "secondary" : "outline"}>
                {ficaMode.toUpperCase()}
              </Badge>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
