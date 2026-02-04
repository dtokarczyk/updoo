"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getStoredUser,
  updateProfile,
  updateStoredUser,
  needsOnboarding,
  getSkills,
  getDraftJob,
  type AccountType,
  type Skill,
  type AuthUser,
} from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";

const STEP_NAME = 1;
const STEP_ACCOUNT_TYPE = 2;
const STEP_SKILLS = 3;
const STEP_DEFAULT_MESSAGE = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [step, setStep] = useState(STEP_NAME);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState("");
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [skillsSearch, setSkillsSearch] = useState("");
  const [defaultMessage, setDefaultMessage] = useState("");
  const [showDraftModal, setShowDraftModal] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored === null) {
      router.replace("/login");
      return;
    }
    if (!needsOnboarding(stored)) {
      router.replace("/");
      return;
    }
    setUser(stored);
    if (stored.name != null) {
      setName(stored.name);
      setStep(STEP_ACCOUNT_TYPE);
    }
    if (stored.surname != null) {
      setSurname(stored.surname);
    }
    if (stored.accountType != null) {
      setAccountType(stored.accountType);
    }
    if (stored.accountType === "FREELANCER") {
      if (Array.isArray(stored.skills)) {
        setSelectedSkillIds(stored.skills.map((skill) => skill.id));
      }
      if (stored.defaultMessage != null) {
        setDefaultMessage(stored.defaultMessage);
      }
      // Check if we need to go to default message step
      const skillsCount = stored.skills?.length ?? 0;
      if (skillsCount > 0 && (stored.defaultMessage == null || stored.defaultMessage.trim() === "")) {
        setStep(STEP_DEFAULT_MESSAGE);
      }
    }
  }, [router]);

  useEffect(() => {
    if (step !== STEP_SKILLS || accountType !== "FREELANCER") return;
    if (availableSkills.length > 0) return;
    let cancelled = false;
    async function loadSkills() {
      setSkillsError("");
      setSkillsLoading(true);
      try {
        const skills = await getSkills();
        if (!cancelled) {
          setAvailableSkills(skills);
        }
      } catch (err) {
        if (!cancelled) {
          setSkillsError(
            err instanceof Error ? err.message : t("onboarding.saveFailed")
          );
        }
      } finally {
        if (!cancelled) {
          setSkillsLoading(false);
        }
      }
    }
    void loadSkills();
    return () => {
      cancelled = true;
    };
  }, [step, accountType, availableSkills.length]);

  function toggleSkill(id: string) {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filteredSkills =
    skillsSearch.trim().length === 0
      ? availableSkills
      : availableSkills.filter((skill) =>
        skill.name.toLowerCase().includes(skillsSearch.trim().toLowerCase())
      );

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user: updated } = await updateProfile({
        name: name.trim() || undefined,
        surname: surname.trim() || undefined,
      });
      updateStoredUser(updated);
      setStep(STEP_ACCOUNT_TYPE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("onboarding.saveFailed")
      );
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
      if (accountType === "FREELANCER") {
        setStep(STEP_SKILLS);
      } else {
        // Check if there's a draft job for CLIENT
        const draft = getDraftJob();
        if (draft) {
          setLoading(false);
          setShowDraftModal(true);
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("onboarding.saveFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSkillsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user: updated } = await updateProfile({
        skillIds: selectedSkillIds,
      });
      updateStoredUser(updated);
      setStep(STEP_DEFAULT_MESSAGE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("onboarding.saveFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDefaultMessageSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user: updated } = await updateProfile({
        defaultMessage: defaultMessage.trim() || undefined,
      });
      updateStoredUser(updated);
      // Check if there's a draft job (shouldn't happen for freelancer, but check anyway)
      const draft = getDraftJob();
      if (draft && updated.accountType === "CLIENT") {
        setLoading(false);
        setShowDraftModal(true);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("onboarding.saveFailed")
      );
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
    <div className="flex justify-center p-4 pt-12">
      <Card className="w-full max-w-md">
        {step === STEP_NAME && (
          <>
            <CardHeader>
              <CardTitle className="text-3xl">{t("onboarding.whatShouldWeCallYou")}</CardTitle>
              <CardDescription>
                {t("onboarding.enterNameSurname")}
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
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("auth.name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="given-name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">{t("auth.surname")}</Label>
                  <Input
                    id="surname"
                    type="text"
                    placeholder={t("auth.surname")}
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    autoComplete="family-name"
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter className="mt-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("onboarding.saving") : t("common.continue")}
                </Button>
              </CardFooter>
            </form>
          </>
        )}

        {step === STEP_ACCOUNT_TYPE && (
          <>
            <CardHeader>
              <CardTitle className="text-3xl">{t("onboarding.chooseAccountType")}</CardTitle>
              <CardDescription>
                {t("onboarding.chooseAccountTypeDesc")}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAccountTypeSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                    {error}
                  </p>
                )}
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setAccountType("CLIENT")}
                    className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${accountType === "CLIENT"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/60"
                      }`}
                  >
                    <div className="mt-1 rounded-md bg-primary/10 p-2">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {t("onboarding.clientTitle")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("onboarding.clientDesc")}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setAccountType("FREELANCER")}
                    className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${accountType === "FREELANCER"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/60"
                      }`}
                  >
                    <div className="mt-1 rounded-md bg-primary/10 p-2">
                      <Search className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {t("onboarding.freelancerTitle")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("onboarding.freelancerDesc")}
                      </p>
                    </div>
                  </button>
                </div>
              </CardContent>
              <CardFooter className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => setStep(STEP_NAME)}
                >
                  {t("common.back")}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !accountType}
                >
                  {loading ? t("onboarding.saving") : t("common.continue")}
                </Button>
              </CardFooter>
            </form>
          </>
        )}

        {step === STEP_SKILLS && accountType === "FREELANCER" && (
          <>
            <CardHeader>
              <CardTitle className="text-3xl">{t("onboarding.freelancerSkillsTitle")}</CardTitle>
              <CardDescription>
                {t("onboarding.freelancerSkillsDesc")}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSkillsSubmit}>
              <CardContent className="space-y-4">
                {(error || skillsError) && (
                  <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                    {error || skillsError}
                  </p>
                )}
                <div className="space-y-3">
                  <Input
                    id="skills-search"
                    type="text"
                    placeholder={t(
                      "onboarding.freelancerSkillsSearchPlaceholder"
                    )}
                    value={skillsSearch}
                    onChange={(e) => setSkillsSearch(e.target.value)}
                    disabled={skillsLoading || loading}
                  />
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
                    {skillsLoading && (
                      <p className="text-sm text-muted-foreground">
                        {t("common.loading")}
                      </p>
                    )}
                    {!skillsLoading && filteredSkills.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        {skillsSearch.trim().length > 0
                          ? t("onboarding.freelancerSkillsNoResults")
                          : t("onboarding.freelancerSkillsEmpty")}
                      </p>
                    )}
                    {!skillsLoading &&
                      filteredSkills.map((skill) => {
                        const checked = selectedSkillIds.includes(skill.id);
                        return (
                          <label
                            key={skill.id}
                            className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent/60 cursor-pointer"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleSkill(skill.id)}
                              className="shrink-0"
                              disabled={loading}
                              aria-label={skill.name}
                            />
                            <span>{skill.name}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => setStep(STEP_ACCOUNT_TYPE)}
                >
                  {t("common.back")}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? t("onboarding.saving") : t("common.continue")}
                </Button>
              </CardFooter>
            </form>
          </>
        )}

        {step === STEP_DEFAULT_MESSAGE && accountType === "FREELANCER" && (
          <>
            <CardHeader>
              <CardTitle className="text-3xl">{t("onboarding.freelancerDefaultMessageTitle")}</CardTitle>
              <CardDescription>
                {t("onboarding.freelancerDefaultMessageDesc")}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleDefaultMessageSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="defaultMessage">{t("profile.defaultMessage")}</Label>
                  <Textarea
                    id="defaultMessage"
                    placeholder={t("onboarding.freelancerDefaultMessagePlaceholder")}
                    value={defaultMessage}
                    onChange={(e) => setDefaultMessage(e.target.value)}
                    rows={8}
                    disabled={loading}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("onboarding.freelancerDefaultMessageHint")}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => setStep(STEP_SKILLS)}
                >
                  {t("common.back")}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? t("onboarding.saving") : t("common.continue")}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>

      {/* Modal after onboarding asking if user wants to continue editing draft */}
      <Dialog open={showDraftModal} onOpenChange={setShowDraftModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("jobs.draftModal.afterLoginTitle")}</DialogTitle>
            <DialogDescription>
              {t("jobs.draftModal.afterLoginDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDraftModal(false);
                router.push("/");
                router.refresh();
              }}
              className="w-full sm:w-auto"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setShowDraftModal(false);
                router.push("/job/new");
                router.refresh();
              }}
              className="w-full sm:w-auto"
            >
              {t("jobs.draftModal.continueEditing")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
