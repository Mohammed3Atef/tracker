"use client";

import { useEffect } from "react";
import { useHealth } from "@/hooks/use-health";
import { useApiToast } from "@/hooks/use-api-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function DebugPage() {
  const { data, isLoading, error, isError, refetch, isRefetching } = useHealth();
  const { toastApiError } = useApiToast();
  const queryClient = useQueryClient();

  // Show error toast when error occurs
  useEffect(() => {
    if (isError && error) {
      toastApiError(error as Error);
    }
  }, [isError, error, toastApiError]);

  const handleRefetch = () => {
    refetch();
  };

  const handleInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["health"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Debug Page</h1>
        <p className="text-muted-foreground">
          Test the API foundation layer with the health endpoint
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Health Endpoint</CardTitle>
              <CardDescription>GET /api/health</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefetch}
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refetch
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInvalidate}
              >
                Invalidate Cache
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && !data && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Error occurred</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
              </div>
            </div>
          )}

          {data && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">Success</span>
                <Badge variant="outline" className="ml-2">
                  {data.status}
                </Badge>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-md">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Query State:</strong>{" "}
              {isLoading && !data && "Loading"}
              {isRefetching && data && "Refetching"}
              {isError && "Error"}
              {data && !isLoading && !isRefetching && "Success"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
