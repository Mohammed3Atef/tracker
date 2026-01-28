"use client";

import React, { useEffect, useState } from "react";
import { useAllLeaves, type LeaveFilters } from "@/hooks/use-all-leaves";
import { useUsers } from "@/hooks/use-users";
import { useApproveLeave, useRejectLeave } from "@/hooks/use-leave-actions";
import { useApiToast } from "@/hooks/use-api-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Loader2, Calendar, Eye, Filter } from "lucide-react";
import { formatDateRange } from "@/lib/timezone-helpers";
import { LeaveRequest } from "@/hooks/use-my-leaves";

export default function AdminLeavesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userIdFilter, setUserIdFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Build filters object
  const filters: LeaveFilters = React.useMemo(() => {
    const f: LeaveFilters = {};
    if (statusFilter !== "all") f.status = statusFilter;
    if (userIdFilter !== "all") f.userId = userIdFilter;
    if (typeFilter !== "all") f.type = typeFilter;
    if (fromDate) f.from = fromDate;
    if (toDate) f.to = toDate;
    return f;
  }, [statusFilter, userIdFilter, typeFilter, fromDate, toDate]);

  const { data: allLeaves, isLoading, error } = useAllLeaves(filters);
  const { data: users } = useUsers();
  const { toastApiError } = useApiToast();
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewReasonDialogOpen, setViewReasonDialogOpen] = useState(false);
  const [viewingReason, setViewingReason] = useState<string>("");

  useEffect(() => {
    if (error) {
      toastApiError(error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (approveLeave.error) {
      toastApiError(approveLeave.error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveLeave.error]);

  useEffect(() => {
    if (rejectLeave.error) {
      toastApiError(rejectLeave.error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectLeave.error]);

  const handleApprove = async (id: string) => {
    try {
      await approveLeave.mutateAsync(id);
    } catch (error) {
      // Error handled by useEffect
    }
  };

  const handleReject = async () => {
    if (!selectedLeave) return;

    try {
      await rejectLeave.mutateAsync({
        id: selectedLeave.id,
        data: { rejectionReason: rejectionReason || undefined },
      });
      setRejectDialogOpen(false);
      setSelectedLeave(null);
      setRejectionReason("");
    } catch (error) {
      // Error handled by useEffect
    }
  };

  const openRejectDialog = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="default">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUserName = (leave: LeaveRequest) => {
    // First try to get name from leave.user.profile (from API)
    if (leave.user.profile) {
      return `${leave.user.profile.firstName} ${leave.user.profile.lastName}`;
    }
    // Fallback to users list
    const user = users?.find((u) => u.id === leave.userId);
    if (user?.profile) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return leave.user.email;
  };

  // Filter leaves by status for tabs
  const pendingLeaves = allLeaves?.filter((l) => l.status === "PENDING") || [];
  const approvedLeaves = allLeaves?.filter((l) => l.status === "APPROVED") || [];
  const rejectedLeaves = allLeaves?.filter((l) => l.status === "REJECTED") || [];

  const renderLeavesTable = (leaves: LeaveRequest[]) => {
    if (leaves.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No leave requests found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      );
    }

    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Submitted</TableHead>
                {statusFilter === "all" || statusFilter === "PENDING" ? (
                  <TableHead className="text-right">Actions</TableHead>
                ) : (
                  <TableHead className="text-right">Decision</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{getUserName(leave)}</TableCell>
                  <TableCell>
                    {formatDateRange(new Date(leave.startDate), new Date(leave.endDate))}
                  </TableCell>
                  <TableCell>{leave.type}</TableCell>
                  <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  <TableCell className="max-w-xs">
                    {leave.reason ? (
                      <div className="flex items-center gap-2">
                        <span className="truncate flex-1">{leave.reason}</span>
                        {leave.reason.length > 30 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setViewingReason(leave.reason || "");
                              setViewReasonDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(leave.createdAt).toLocaleDateString()}
                  </TableCell>
                  {statusFilter === "all" || statusFilter === "PENDING" ? (
                    <TableCell className="text-right">
                      {leave.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(leave.id)}
                            disabled={approveLeave.isPending}
                          >
                            {approveLeave.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(leave)}
                            disabled={rejectLeave.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : leave.status === "APPROVED" ? (
                        <div className="text-right text-sm text-muted-foreground">
                          {leave.approvedAt && (
                            <div>
                              Approved {new Date(leave.approvedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : leave.status === "REJECTED" ? (
                        <div className="text-right text-sm text-muted-foreground">
                          {leave.rejectionReason && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs"
                              onClick={() => {
                                setViewingReason(leave.rejectionReason || "");
                                setViewReasonDialogOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Reason
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </TableCell>
                  ) : (
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {leave.status === "APPROVED" && leave.approvedAt && (
                        <div>Approved {new Date(leave.approvedAt).toLocaleDateString()}</div>
                      )}
                      {leave.status === "REJECTED" && leave.rejectionReason && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => {
                            setViewingReason(leave.rejectionReason || "");
                            setViewReasonDialogOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Reason
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {leaves.map((leave) => (
            <Card key={leave.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{getUserName(leave)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateRange(new Date(leave.startDate), new Date(leave.endDate))}
                      </p>
                    </div>
                    {getStatusBadge(leave.status)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Type:</span> {leave.type}
                    </p>
                    {leave.reason && (
                      <div>
                        <p className="text-muted-foreground mb-1">Reason:</p>
                        <p className="break-words">
                          {leave.reason.length > 100
                            ? `${leave.reason.substring(0, 100)}...`
                            : leave.reason}
                        </p>
                        {leave.reason.length > 100 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-1 h-6 text-xs"
                            onClick={() => {
                              setViewingReason(leave.reason || "");
                              setViewReasonDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Full
                          </Button>
                        )}
                      </div>
                    )}
                    {leave.status === "APPROVED" && leave.approvedAt && (
                      <p className="text-muted-foreground">
                        Approved: {new Date(leave.approvedAt).toLocaleDateString()}
                      </p>
                    )}
                    {leave.status === "REJECTED" && leave.rejectionReason && (
                      <div>
                        <p className="text-muted-foreground mb-1">Rejection Reason:</p>
                        <p className="break-words text-red-600">
                          {leave.rejectionReason.length > 100
                            ? `${leave.rejectionReason.substring(0, 100)}...`
                            : leave.rejectionReason}
                        </p>
                        {leave.rejectionReason.length > 100 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-1 h-6 text-xs text-red-600"
                            onClick={() => {
                              setViewingReason(leave.rejectionReason || "");
                              setViewReasonDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Full
                          </Button>
                        )}
                      </div>
                    )}
                    <p className="text-muted-foreground">
                      Submitted: {new Date(leave.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {leave.status === "PENDING" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleApprove(leave.id)}
                        disabled={approveLeave.isPending}
                      >
                        {approveLeave.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => openRejectDialog(leave)}
                        disabled={rejectLeave.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <p className="text-muted-foreground">Review and manage all employee leave requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>View and manage leave requests with filters</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <Label htmlFor="user-filter">Employee</Label>
                <select
                  id="user-filter"
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Employees</option>
                  {users?.map((user) => {
                    const name = user.profile
                      ? `${user.profile.firstName} ${user.profile.lastName}`
                      : user.email;
                    return (
                      <option key={user.id} value={user.id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <Label htmlFor="type-filter">Type</Label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Types</option>
                  <option value="VACATION">Vacation</option>
                  <option value="SICK">Sick</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="MATERNITY">Maternity</option>
                  <option value="PATERNITY">Paternity</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="from-date">From Date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="to-date">To Date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
            {(statusFilter !== "all" ||
              userIdFilter !== "all" ||
              typeFilter !== "all" ||
              fromDate ||
              toDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setUserIdFilter("all");
                  setTypeFilter("all");
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All ({allLeaves?.length || 0})</TabsTrigger>
                <TabsTrigger value="PENDING">Pending ({pendingLeaves.length})</TabsTrigger>
                <TabsTrigger value="APPROVED">Approved ({approvedLeaves.length})</TabsTrigger>
                <TabsTrigger value="REJECTED">Rejected ({rejectedLeaves.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                {renderLeavesTable(allLeaves || [])}
              </TabsContent>
              <TabsContent value="PENDING" className="mt-4">
                {renderLeavesTable(pendingLeaves)}
              </TabsContent>
              <TabsContent value="APPROVED" className="mt-4">
                {renderLeavesTable(approvedLeaves)}
              </TabsContent>
              <TabsContent value="REJECTED" className="mt-4">
                {renderLeavesTable(rejectedLeaves)}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              {selectedLeave && (
                <>
                  Reject leave request from {getUserName(selectedLeave)} for{" "}
                  {formatDateRange(
                    new Date(selectedLeave.startDate),
                    new Date(selectedLeave.endDate)
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter reason for rejection..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedLeave(null);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectLeave.isPending}
            >
              {rejectLeave.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Reason Dialog */}
      <Dialog open={viewReasonDialogOpen} onOpenChange={setViewReasonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reason</DialogTitle>
            <DialogDescription>Full reason text</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <p className="whitespace-pre-wrap break-words">{viewingReason}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewReasonDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
