"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    // Client-side debug logging (only in development)
    if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG === "true") {
      console.log("[Login:Client] Attempting login for:", data.email);
    }
    
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Client-side debug logging
        if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG === "true") {
          console.error("[Login:Client] ❌ Login failed:", result.error);
          console.error("[Login:Client] Check server terminal for detailed auth logs");
        }
        
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Client-side debug logging
        if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG === "true") {
          console.log("[Login:Client] ✅ Login successful, fetching session...");
        }
        
        // Fetch session to get user role for redirect
        try {
          const response = await fetch("/api/auth/session");
          const session = await response.json();
          const userRole = session?.user?.role;

          // Redirect based on role
          if (userRole === "admin" || userRole === "manager") {
            router.push("/admin/dashboard");
          } else if (userRole === "employee") {
            router.push("/app/dashboard");
          } else {
            router.push(callbackUrl);
          }
          router.refresh();
        } catch (error) {
          // Fallback: redirect to callbackUrl or home
          router.push(callbackUrl);
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "An error occurred",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">
            <p>Demo credentials:</p>
            <ul className="mt-2 space-y-1">
              <li>• admin@demo.com / Demo@12345</li>
              <li>• manager@demo.com / Demo@12345</li>
              <li>• employee@demo.com / Demo@12345</li>
            </ul>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
