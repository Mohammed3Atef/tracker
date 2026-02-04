"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: ReactNode;
  description?: string;
  icon: LucideIcon;
  isLoading?: boolean;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading = false,
  trend,
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <p
                className={`text-xs mt-1 ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
