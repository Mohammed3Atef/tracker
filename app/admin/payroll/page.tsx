"use client";

import React, { useEffect, useState } from "react";
import { usePayrollPreview, type EmployeePayrollSummary } from "@/hooks/use-payroll-preview";
import { useApiToast } from "@/hooks/use-api-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, DollarSign, Calendar } from "lucide-react";
import { formatDuration } from "@/lib/time-helpers";

export default function PayrollPage() {
  // Default to current month
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data, isLoading, error } = usePayrollPreview(month);
  const { toastApiError } = useApiToast();

  // Track expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (error) {
      toastApiError(error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const toggleRow = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Payroll Preview</h1>
        <p className="text-muted-foreground">Monthly summary of worked time, overtime, and leave days</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Select a month to view payroll preview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-48"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !data || data.employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payroll data available</p>
              <p className="text-sm">No employees found for the selected month</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Total Hours</TableHead>
                      <TableHead className="text-right">Overtime</TableHead>
                      <TableHead className="text-right">Paid Leave</TableHead>
                      <TableHead className="text-right">Unpaid Leave</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.employees.map((employee) => {
                      const isExpanded = expandedRows.has(employee.userId);
                      return (
                        <React.Fragment key={employee.userId}>
                          <TableRow
                            className="cursor-pointer"
                            onClick={() => toggleRow(employee.userId)}
                          >
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(employee.userId);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              {employee.name || employee.email}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatDuration(employee.totalWorkedMinutes)}
                            </TableCell>
                            <TableCell className="text-right">
                              {employee.overtimeMinutes > 0 ? (
                                <Badge variant="destructive">
                                  {formatDuration(employee.overtimeMinutes)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {employee.paidLeaveDays > 0 ? (
                                <Badge variant="default">{employee.paidLeaveDays} days</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {employee.unpaidLeaveDays > 0 ? (
                                <Badge variant="secondary">{employee.unpaidLeaveDays} days</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={6} className="p-0">
                                <div className="p-4 bg-muted/50">
                                  <h4 className="font-semibold mb-3">Daily Breakdown</h4>
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Date</TableHead>
                                          <TableHead className="text-right">Worked</TableHead>
                                          <TableHead className="text-right">Overtime</TableHead>
                                          <TableHead className="text-right">Leave</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {employee.dailyBreakdown.map((day) => (
                                          <TableRow key={day.date}>
                                            <TableCell>{formatDate(day.date)}</TableCell>
                                            <TableCell className="text-right">
                                              {day.workedMinutes > 0
                                                ? formatDuration(day.workedMinutes)
                                                : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {day.overtimeMinutes > 0 ? (
                                                <Badge variant="destructive" className="text-xs">
                                                  {formatDuration(day.overtimeMinutes)}
                                                </Badge>
                                              ) : (
                                                "-"
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex justify-end gap-1">
                                                {day.hasPaidLeave && (
                                                  <Badge variant="default" className="text-xs">
                                                    Paid
                                                  </Badge>
                                                )}
                                                {day.hasUnpaidLeave && (
                                                  <Badge variant="secondary" className="text-xs">
                                                    Unpaid
                                                  </Badge>
                                                )}
                                                {!day.hasPaidLeave && !day.hasUnpaidLeave && (
                                                  <span className="text-muted-foreground">-</span>
                                                )}
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {data.employees.map((employee) => {
                  const isExpanded = expandedRows.has(employee.userId);
                  return (
                    <Card key={employee.userId}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{employee.name || employee.email}</p>
                              <p className="text-sm text-muted-foreground">{employee.email}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(employee.userId)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total Hours</p>
                              <p className="font-medium">{formatDuration(employee.totalWorkedMinutes)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Overtime</p>
                              <div className="font-medium">
                                {employee.overtimeMinutes > 0 ? (
                                  <Badge variant="destructive">
                                    {formatDuration(employee.overtimeMinutes)}
                                  </Badge>
                                ) : (
                                  <span>-</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Paid Leave</p>
                              <div className="font-medium">
                                {employee.paidLeaveDays > 0 ? (
                                  <Badge variant="default">{employee.paidLeaveDays} days</Badge>
                                ) : (
                                  <span>-</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Unpaid Leave</p>
                              <div className="font-medium">
                                {employee.unpaidLeaveDays > 0 ? (
                                  <Badge variant="secondary">{employee.unpaidLeaveDays} days</Badge>
                                ) : (
                                  <span>-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t pt-4 mt-4">
                              <h4 className="font-semibold mb-3">Daily Breakdown</h4>
                              <div className="space-y-2">
                                {employee.dailyBreakdown.map((day) => (
                                  <div
                                    key={day.date}
                                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{formatDate(day.date)}</p>
                                      <div className="flex gap-1 mt-1">
                                        {day.hasPaidLeave && (
                                          <Badge variant="default" className="text-xs">
                                            Paid
                                          </Badge>
                                        )}
                                        {day.hasUnpaidLeave && (
                                          <Badge variant="secondary" className="text-xs">
                                            Unpaid
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right text-sm">
                                      <p>
                                        {day.workedMinutes > 0
                                          ? formatDuration(day.workedMinutes)
                                          : "-"}
                                      </p>
                                      {day.overtimeMinutes > 0 && (
                                        <p className="text-red-600">
                                          OT: {formatDuration(day.overtimeMinutes)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
