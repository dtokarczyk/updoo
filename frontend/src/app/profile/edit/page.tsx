"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  getToken,
  clearAuth,
} from "@/lib/api";
import { HomeNav } from "@/app/components/HomeNav";

export default function ProfileEditPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getStoredUser();
    if (user) {
      setName(user.name ?? "");
      setSurname(user.surname ?? "");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }
  }, [mounted, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {
        name: name.trim() || undefined,
        surname: surname.trim() || undefined,
      };
      if (password.trim()) payload.password = password.trim();
      const { user: updated } = await updateProfile(payload);
      updateStoredUser(updated);
      setPassword("");
      setSuccess(true);
      if (password.trim()) {
        clearAuth();
        router.push("/login");
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Zapisywanie nie powiodło się");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-foreground">
            Updoo
          </Link>
          <HomeNav />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Edycja profilu</CardTitle>
            <CardDescription>
              Zmień imię, nazwisko lub hasło. Po zmianie hasła zostaniesz wylogowany.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-green-600 dark:text-green-400 rounded-md bg-green-500/10 px-3 py-2">
                  Profil zapisany.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Imię</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Imię"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="given-name"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Nazwisko</Label>
                <Input
                  id="surname"
                  type="text"
                  placeholder="Nazwisko"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  autoComplete="family-name"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Nowe hasło (opcjonalnie)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Zostaw puste, aby nie zmieniać"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Min. 6 znaków. Po zmianie hasła zostaniesz wylogowany.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Zapisywanie…" : "Zapisz"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
