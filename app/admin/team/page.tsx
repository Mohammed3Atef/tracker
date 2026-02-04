"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamGrid } from "@/components/dashboard/team-grid";
import { SessionDetails } from "@/components/time/session-details";
import { SessionTimeline } from "@/components/time/session-timeline";
import { useUsers } from "@/hooks/use-users";
import { useAllUsersStatus } from "@/hooks/use-user-time-status";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { formatDuration } from "@/lib/time-helpers";
import { Search, Users, Clock, Calendar, Filter } from "lucide-react";
import { useMyTime } from "@/hooks/use-my-time";

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<"grid" | "list">("grid");
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);

  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: usersStatus, isLoading: statusLoading } = useAllUsersStatus();

  // Get today's entries for selected user
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: selectedUserEntries } = useTimeEntries({
    from: today,
    to: tomorrow,
    userId: selectedUserId || undefined,
  });

  // Create user status map
  const statusMap = new Map();
  usersStatus?.forEach((status) => {
    statusMap.set(status.userId, status);
  });

  // Get users with status
  const usersWithStatus =
    users?.map((user) => {
      const status = statusMap.get(user.id);
      const name = user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user.email;
      return {
        ...user,
        name,
        status,
      };
    }) || [];

  // Filter users
  const filteredUsers = usersWithStatus.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.name.toLowerCase().includes(query)
    );
  });

  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId);
    setUserDetailsDialogOpen(true);
  };

  const selectedUser = usersWithStatus.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Overview</h1>
          <p className="text-muted-foreground">View and manage all team members</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedView === "grid" ? "default" : "outline"}
            onClick={() => setSelectedView("grid")}
          >
            <Users className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={selectedView === "list" ? "default" : "outline"}
            onClick={() => setSelectedView("list")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Grid/List View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members ({filteredUsers.length})</CardTitle>
              <CardDescription>All team members and their current status</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading || statusLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
            </div>
          ) : selectedView === "grid" ? (
            <TeamGrid
              members={filteredUsers.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                status: user.status,
              }))}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const status = user.status;
                const statusBadge = status?.hasActiveSession ? (
                  status.hasActiveBreak ? (
                    <Badge variant="default" className="bg-orange-500">
                      On Break
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-500">
                      Clocked In
                    </Badge>
                  )
                ) : (
                  <Badge variant="secondary">Clocked Out</Badge>
                );

                return (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{user.name}</h3>
                            {statusBadge}
                            <Badge variant="outline">{user.role.name}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
                          {status && (
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Today:</span>
                                <span className="font-semibold">
                                  {formatDuration(status.totalWorkedToday)}
                                </span>
                              </div>
                              {status.hasActiveSession && status.session && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Started:</span>
                                  <span>
                                    {new Date(status.session.startTime).toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <Button variant="outline" onClick={() => handleViewDetails(user.id)}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={userDetailsDialogOpen} onOpenChange={setUserDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.name || "User Details"} - Time Tracking
            </DialogTitle>
            <DialogDescription>
              View detailed time tracking information for this team member
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <Tabs defaultValue="status" className="w-full">
              <TabsList>
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              <TabsContent value="status" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedUser.status ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Status:</span>
                          {selectedUser.status.hasActiveSession ? (
                            selectedUser.status.hasActiveBreak ? (
                              <Badge variant="default" className="bg-orange-500">
                                On Break
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-500">
                                Clocked In
                              </Badge>
                            )
                          ) : (
                            <Badge variant="secondary">Clocked Out</Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Worked Today:</span>
                          <span className="font-semibold">
                            {formatDuration(selectedUser.status.totalWorkedToday)}
                          </span>
                        </div>
                        {selectedUser.status.session && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Session Start:</span>
                              <span>
                                {new Date(
                                  selectedUser.status.session.startTime
                                ).toLocaleString()}
                              </span>
                            </div>
                            {selectedUser.status.session.endTime && (
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Session End:</span>
                                <span>
                                  {new Date(
                                    selectedUser.status.session.endTime
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No active session</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="sessions" className="space-y-4">
                {selectedUserEntries && selectedUserEntries.length > 0 ? (
                  <div className="space-y-4">
                    {selectedUserEntries.map((entry) => (
                      <SessionDetails
                        key={entry.id}
                        session={entry}
                        allowEdit={true}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No sessions found for today</p>
                )}
              </TabsContent>
              <TabsContent value="timeline" className="space-y-4">
                {selectedUserEntries && selectedUserEntries.length > 0 ? (
                  <SessionTimeline sessions={selectedUserEntries} />
                ) : (
                  <p className="text-muted-foreground">No sessions found for today</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
