"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/time-helpers";
import { Clock, User, MoreVertical } from "lucide-react";
import Link from "next/link";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: {
    hasActiveSession: boolean;
    hasActiveBreak: boolean;
    totalWorkedToday: number;
  };
}

interface TeamGridProps {
  members: TeamMember[];
  onViewDetails?: (memberId: string) => void;
}

export function TeamGrid({ members, onViewDetails }: TeamGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {members.map((member) => {
        const status = member.status;
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
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm">{member.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {member.role}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    {statusBadge}
                  </div>
                  {status && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Today
                      </span>
                      <span className="text-sm font-semibold">
                        {formatDuration(status.totalWorkedToday)}
                      </span>
                    </div>
                  )}
                </div>

                {onViewDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => onViewDetails(member.id)}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
