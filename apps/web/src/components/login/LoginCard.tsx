import { Button } from "@/components/ui/button";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <Link href="/" className="text-xs">
          Back to Home
        </Link>
        <CardTitle className="flex justify-center-safe">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@gmail.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <span className="ml-auto inline-block text-sm text-muted-foreground">
                  Password reset coming soon
                </span>
              </div>
              <Input id="password" type="password" required />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">
          Login
        </Button>
        <FieldDescription className="text-center">
          New?{" "}
          <Link href="/signup" className="font-medium">
            Sign up
          </Link>
        </FieldDescription>
      </CardFooter>
    </Card>
  );
}
