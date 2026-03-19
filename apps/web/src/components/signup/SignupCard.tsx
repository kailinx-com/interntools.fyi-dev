"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RegisterRequest } from "@/lib/auth/types";

export function SignupCard(props: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username || !firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    const payload = {
      username,
      firstName,
      lastName,
      email,
      password,
      role: "STUDENT" as const,
    } satisfies RegisterRequest;

    try {
      setIsSubmitting(true);
      await register(payload);
      setSuccessMessage("Account created successfully. Redirecting to login...");
      router.push("/login");
    } catch (error: unknown) {
      let message = "Something went wrong while creating your account.";

      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "object" && error !== null) {
        // Handle common HTTP client error shapes without using `any`.
        const maybeResponse = error as {
          response?: { data?: { message?: string } };
        };
        message = maybeResponse.response?.data?.message ?? message;
      }

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <FieldContent>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="intern123"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={isSubmitting}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="first-name">First name</FieldLabel>
              <FieldContent>
                <Input
                  id="first-name"
                  type="text"
                  autoComplete="given-name"
                  placeholder="John"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  disabled={isSubmitting}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="last-name">Last name</FieldLabel>
              <FieldContent>
                <Input
                  id="last-name"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  disabled={isSubmitting}
                />
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
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <FieldContent>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                />
              </FieldContent>
              <FieldDescription>Must be at least 8 characters long.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
              <FieldContent>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isSubmitting}
                />
              </FieldContent>
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>

            {errorMessage ? (
              <Field>
                <FieldDescription className="text-sm text-destructive">
                  {errorMessage}
                </FieldDescription>
              </Field>
            ) : null}

            {successMessage ? (
              <Field>
                <FieldDescription className="text-sm text-emerald-600">
                  {successMessage}
                </FieldDescription>
              </Field>
            ) : null}

            <Field>
              <FieldContent className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create Account"}
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
