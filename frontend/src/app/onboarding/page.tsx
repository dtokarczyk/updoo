"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getStoredUser,
  updateProfile,
  updateStoredUser,
  needsOnboarding,
  type AccountType,
} from "@/lib/api";

const STEP_NAME = 1;
const STEP_ACCOUNT_TYPE = 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(STEP_NAME);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const user = typeof window !== "undefined" ? getStoredUser() : null;

  useEffect(() => {
    if (user === null) {
      router.replace("/login");
      return;
    }
    if (!needsOnboarding(user)) {
      router.replace("/");
      return;
    }
    if (user.name != null) {
      setName(user.name);
      setStep(STEP_ACCOUNT_TYPE);
    }
    if (user.accountType != null) {
      setAccountType(user.accountType);
    }
  }, [user?.id, user?.name, user?.accountType, router]);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user: updated } = await updateProfile({ name: name.trim() || undefined });
      updateStoredUser(updated);
      setStep(STEP_ACCOUNT_TYPE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccountTypeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user: updated } = await updateProfile({
        accountType: accountType || undefined,
      });
      updateStoredUser(updated);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (user === null) {
    return null;
  }

  if (!needsOnboarding(user) && user.name != null && user.accountType != null) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {step === STEP_NAME && (
          <>
            <CardHeader>
              <CardTitle>What should we call you?</CardTitle>
              <CardDescription>
                Enter your name. You can change it later in settings.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleNameSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving…" : "Continue"}
                </Button>
              </CardFooter>
            </form>
          </>
        )}

        {step === STEP_ACCOUNT_TYPE && (
          <>
            <CardHeader>
              <CardTitle>Account type</CardTitle>
              <CardDescription>
                Choose how you will use the app. You can change this later.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAccountTypeSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account type</Label>
                  <select
                    id="accountType"
                    value={accountType}
                    onChange={(e) =>
                      setAccountType((e.target.value || "") as AccountType | "")
                    }
                    disabled={loading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">— Select —</option>
                    <option value="CLIENT">Client</option>
                    <option value="FREELANCER">Freelancer</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => setStep(STEP_NAME)}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Saving…" : "Finish"}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
