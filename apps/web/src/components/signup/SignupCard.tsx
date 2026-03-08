"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SignupCard(props: React.ComponentProps<typeof Card>) {
  return (
    <Card className={cn("w-full max-w-sm", props.className)} {...props}>
      <CardHeader>
        <Link href="/" className="text-xs">
          Back to Home
        </Link>
        <CardTitle className="flex justify-center-safe">
          Create an account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <FieldContent>
                <Input id="name" type="text" placeholder="John Doe" required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <FieldContent>
                <Input id="password" type="password" required />
              </FieldContent>
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <FieldContent>
                <Input id="confirm-password" type="password" required />
              </FieldContent>
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <Field>
              <FieldContent className="flex flex-col gap-2">
                <Button type="submit" className="w-full">
                  Create Account
                </Button>
              </FieldContent>
              <FieldDescription className="text-center">
                Already have an account?{" "}
                <Link href="/login" className="font-medium">
                  Sign in
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
