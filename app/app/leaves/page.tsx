"use client";

import { useEffect, useState } from "react";
import { useMyLeaves } from "@/hooks/use-my-leaves";
import { useRequestLeave } from "@/hooks/use-leave-actions";
import { useApiToast } from "@/hooks/use-api-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Loader2, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDateForDisplay, formatDateRange } from "@/lib/timezone-helpers";

const LeaveRequestType = {
  VACATION: "VACATION",
  SICK: "SICK",
  PERSONAL: "PERSONAL",
  UNPAID: "UNPAID",
  MATERNITY: "MATERNITY",
  PATERNITY: "PATERNITY",
  OTHER: "OTHER",
} as const;

const leaveRequestSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  type: z.enum(["VACATION", "SICK", "PERSONAL", "UNPAID", "MATERNITY", "PATERNITY", "OTHER"]),
  reason: z.string().optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

const leaveTypeOptions = [
  { value: "VACATION", label: "Vacation" },
  { value: "SICK", label: "Sick Leave" },
  { value: "PERSONAL", label: "Personal" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "MATERNITY", label: "Maternity" },
  { value: "PATERNITY", label: "Paternity" },
  { value: "OTHER", label: "Other" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    case "APPROVED":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
    case "REJECTED":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
    case "CANCELLED":
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function LeavesPage() {
  const { data: leaves, isLoading, error } = useMyLeaves();
  const { toastApiError } = useApiToast();
  const requestLeave = useRequestLeave();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewReasonDialogOpen, setViewReasonDialogOpen] = useState(false);
  const [viewingReason, setViewingReason] = useState<string>("");
  const [viewRejectionDialogOpen, setViewRejectionDialogOpen] = useState(false);
  const [viewingRejectionReason, setViewingRejectionReason] = useState<string>("");

  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      type: undefined,
      reason: "",
    },
  });

  useEffect(() => {
    if (error) {
      toastApiError(error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (requestLeave.error) {
      toastApiError(requestLeave.error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestLeave.error]);

  const onSubmit = async (data: LeaveRequestFormValues) => {
    try {
      await requestLeave.mutateAsync(data);
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      // Error handled by useEffect
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Leave Requests</h1>
          <p className="text-muted-foreground">View and manage your time off requests</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription>
                Submit a new leave request. Dates must not overlap with existing approved leaves.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select leave type</option>
                          {leaveTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (Optional)</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={requestLeave.isPending}>
                    {requestLeave.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Your submitted leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !leaves || leaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leave requests yet</p>
              <p className="text-sm">Click "Request Leave" to submit your first request</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell className="font-medium">
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
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {formatDateRange(new Date(leave.startDate), new Date(leave.endDate))}
                        </span>
                        {getStatusBadge(leave.status)}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Type:</span> {leave.type}
                        </p>
                        {leave.reason && (
                          <div>
                            <p className="text-muted-foreground mb-1">Reason:</p>
                            <p className="break-words">{leave.reason.length > 100 ? `${leave.reason.substring(0, 100)}...` : leave.reason}</p>
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
                                View Full Reason
                              </Button>
                            )}
                          </div>
                        )}
                        {leave.rejectionReason && (
                          <div>
                            <p className="text-muted-foreground mb-1 text-red-600">Rejection Reason:</p>
                            <p className="break-words text-red-600">{leave.rejectionReason.length > 100 ? `${leave.rejectionReason.substring(0, 100)}...` : leave.rejectionReason}</p>
                            {leave.rejectionReason.length > 100 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="mt-1 h-6 text-xs text-red-600"
                                onClick={() => {
                                  setViewingRejectionReason(leave.rejectionReason || "");
                                  setViewRejectionDialogOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Full Rejection Reason
                              </Button>
                            )}
                          </div>
                        )}
                        <p className="text-muted-foreground">
                          Submitted: {new Date(leave.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Reason Dialog */}
      <Dialog open={viewReasonDialogOpen} onOpenChange={setViewReasonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reason</DialogTitle>
            <DialogDescription>
              Full reason text for this leave request
            </DialogDescription>
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

      {/* View Rejection Reason Dialog */}
      <Dialog open={viewRejectionDialogOpen} onOpenChange={setViewRejectionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
            <DialogDescription>
              Full rejection reason for this leave request
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <p className="whitespace-pre-wrap break-words text-red-600">{viewingRejectionReason}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRejectionDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
