import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">403</CardTitle>
          <CardDescription className="text-lg">
            Unauthorized Access
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this resource.
            Please contact your administrator if you believe this is an error.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild variant="default" className="w-full">
            <Link href="/">Go to Home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
