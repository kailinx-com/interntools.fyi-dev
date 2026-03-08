"use client";

import { Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
};

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function PayrollConfigurationCard({
  config,
  states,
  ficaMode,
  onConfigChange,
}: PayrollConfigurationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="size-4" />
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
                <SelectValue />
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nonresident">Non-Resident</SelectItem>
                <SelectItem value="resident">Resident</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-semibold">Tax Status</h3>
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
                  <SelectValue />
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
                value={config.arrivalYear}
                onChange={(e) =>
                  onConfigChange("arrivalYear", parseNumber(e.target.value))
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="work-auth">Work Authorized</Label>
            <Switch
              id="work-auth"
              checked={config.isWorkAuthorized}
              onCheckedChange={(checked) =>
                onConfigChange("isWorkAuthorized", Boolean(checked))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">FICA Status</span>
            <Badge variant={ficaMode === "exempt" ? "secondary" : "outline"}>
              {ficaMode.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
