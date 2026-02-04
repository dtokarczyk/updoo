"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  getCategories,
  getLocations,
  getSkills,
  getStoredUser,
  type Category,
  type Location,
  type Skill,
  type BillingType,
  type HoursPerWeek,
  type ExperienceLevel,
  type ProjectType,
  type JobLanguage,
  getJob,
  updateJob,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BILLING_LABELS: Record<BillingType, string> = {
  FIXED: "Stawka ryczałtowa (fix)",
  HOURLY: "Stawka godzinowa",
};

const HOURS_LABELS: Record<HoursPerWeek, string> = {
  LESS_THAN_10: "Mniej niż 10",
  FROM_11_TO_20: "11–20",
  FROM_21_TO_30: "21–30",
  MORE_THAN_30: "Powyżej 30",
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  JUNIOR: "Junior",
  MID: "Mid",
  SENIOR: "Senior",
};

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  ONE_TIME: "Jednorazowy",
  CONTINUOUS: "Ciągły",
};

const CURRENCIES = ["PLN", "EUR", "USD", "GBP", "CHF"];

type SelectedSkill = { id: string | null; name: string };

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [language, setLanguage] = useState<JobLanguage>("POLISH");
  const [billingType, setBillingType] = useState<BillingType>("HOURLY");
  const [hoursPerWeek, setHoursPerWeek] = useState<HoursPerWeek | "">("");
  const [rate, setRate] = useState("");
  const [rateNegotiable, setRateNegotiable] = useState(false);
  const [currency, setCurrency] = useState("PLN");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("MID");
  const [locationId, setLocationId] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [projectType, setProjectType] = useState<ProjectType>("ONE_TIME");
  const [offerDays, setOfferDays] = useState<number>(14);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const isAdmin = user.accountType === "ADMIN";
    if (!isAdmin && user.accountType !== "CLIENT") {
      router.replace("/");
      return;
    }
    if (!id) {
      setLoading(false);
      setError("Brak ID ogłoszenia");
      return;
    }
    Promise.all([
      getCategories(),
      getLocations(),
      getSkills(),
      getJob(id),
    ])
      .then(([cats, locs, sk, listing]) => {
        if (!isAdmin && listing.authorId !== user.id) {
          setError("Możesz edytować tylko swoje ogłoszenia");
          setLoading(false);
          return;
        }
        setCategories(cats);
        setLocations(locs);
        setSkills(sk);
        setTitle(listing.title);
        setDescription(listing.description);
        setCategoryId(listing.categoryId);
        setLanguage(listing.language ?? "POLISH");
        setBillingType(listing.billingType);
        setHoursPerWeek(listing.hoursPerWeek ?? "");
        setRate(listing.rate ?? "");
        setRateNegotiable(listing.rateNegotiable ?? false);
        setCurrency(listing.currency ?? "PLN");
        setExperienceLevel(listing.experienceLevel);
        setLocationId(listing.locationId ?? "");
        setIsRemote(listing.isRemote);
        setProjectType(listing.projectType);
        if (listing.deadline && listing.createdAt) {
          const ms = new Date(listing.deadline).getTime() - new Date(listing.createdAt).getTime();
          const days = Math.round(ms / (24 * 60 * 60 * 1000));
          const allowed = [7, 14, 21, 30];
          const closest = allowed.reduce((prev, curr) =>
            Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
          );
          setOfferDays(closest);
        } else {
          setOfferDays(14);
        }
        setSelectedSkills(
          listing.skills?.map((r) => ({ id: r.skill.id, name: r.skill.name })) ?? []
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nie udało się załadować ogłoszenia"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const addSkill = (skill: SelectedSkill) => {
    if (selectedSkills.some((s) => s.name.toLowerCase() === skill.name.toLowerCase())) return;
    setSelectedSkills((prev) => [...prev, skill]);
    setSkillInput("");
    setSkillDropdownOpen(false);
    skillInputRef.current?.focus();
  };

  const removeSkill = (index: number) => {
    setSelectedSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const raw = skillInput.trim();
      if (!raw) return;
      const fromDict = skills.find((s) => s.name.toLowerCase() === raw.toLowerCase());
      if (fromDict) {
        addSkill({ id: fromDict.id, name: fromDict.name });
      } else {
        addSkill({ id: null, name: raw });
      }
    }
  };

  const filteredSkills = skillInput.trim()
    ? skills.filter(
      (s) =>
        s.name.toLowerCase().includes(skillInput.toLowerCase()) &&
        !selectedSkills.some((sel) => sel.id === s.id)
    )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!id) return;
    if (!title.trim() || !description.trim() || !categoryId) {
      setError("Wypełnij tytuł, opis i kategorię");
      return;
    }
    const rateNum = parseFloat(rate.replace(",", "."));
    if (isNaN(rateNum) || rateNum < 0) {
      setError("Podaj poprawną stawkę");
      return;
    }
    if (billingType === "HOURLY" && !hoursPerWeek) {
      setError("Przy rozliczeniu godzinowym wybierz ilość godzin tygodniowo");
      return;
    }
    const allowedOfferDays = [7, 14, 21, 30];
    if (!allowedOfferDays.includes(offerDays)) {
      setError("Ilość dni na zebranie ofert: wybierz 7, 14, 21 lub 30 dni");
      return;
    }
    setSubmitting(true);
    try {
      await updateJob(id, {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        language,
        billingType,
        hoursPerWeek: billingType === "HOURLY" ? (hoursPerWeek as HoursPerWeek) : undefined,
        rate: rateNum,
        rateNegotiable,
        currency,
        experienceLevel,
        locationId: locationId || undefined,
        isRemote,
        projectType,
        offerDays,
        skillIds: selectedSkills.filter((s) => s.id != null).map((s) => s.id as string),
        newSkillNames: selectedSkills.filter((s) => s.id == null).map((s) => s.name),
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas zapisywania");
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass = cn(
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
    "disabled:opacity-50 md:text-sm"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
        <main className="max-w-xl mx-auto text-center text-muted-foreground">
          Ładowanie ogłoszenia...
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <main className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edytuj ogłoszenie</CardTitle>
            <CardDescription>
              Po zapisie ogłoszenie wróci do statusu „Szkic” i będzie wymagało ponownej akceptacji przez administratora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Szukam developera React"
                  maxLength={200}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opisz szczegóły ogłoszenia..."
                  maxLength={5000}
                  rows={6}
                  disabled={submitting}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "placeholder:text-muted-foreground disabled:opacity-50 md:text-sm"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategoria</Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={submitting || categories.length === 0}
                  className={selectClass}
                >
                  <option value="">
                    {categories.length === 0 ? "Ładowanie..." : "Wybierz kategorię"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Język ogłoszenia</Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as JobLanguage)}
                  disabled={submitting}
                  className={selectClass}
                >
                  <option value="POLISH">Polish</option>
                  <option value="ENGLISH">English</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Typ rozliczenia</Label>
                <div className="flex gap-4">
                  {(Object.keys(BILLING_LABELS) as BillingType[]).map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="billingType"
                        checked={billingType === t}
                        onChange={() => setBillingType(t)}
                        disabled={submitting}
                        className="rounded-full border-input"
                      />
                      <span className="text-sm">{BILLING_LABELS[t]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {billingType === "HOURLY" && (
                <div className="space-y-2">
                  <Label htmlFor="hoursPerWeek">Ilość godzin tygodniowo</Label>
                  <select
                    id="hoursPerWeek"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value as HoursPerWeek | "")}
                    disabled={submitting}
                    className={selectClass}
                  >
                    <option value="">Wybierz przedział</option>
                    {(Object.keys(HOURS_LABELS) as HoursPerWeek[]).map((h) => (
                      <option key={h} value={h}>
                        {HOURS_LABELS[h]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">
                    {billingType === "HOURLY" ? "Stawka godzinowa" : "Stawka (ryczałt)"}
                  </Label>
                  <Input
                    id="rate"
                    type="number"
                    min={0}
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="0"
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Waluta</Label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={submitting}
                    className={selectClass}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="rateNegotiable"
                  type="checkbox"
                  checked={rateNegotiable}
                  onChange={(e) => setRateNegotiable(e.target.checked)}
                  disabled={submitting}
                  className="rounded border-input"
                />
                <Label htmlFor="rateNegotiable" className="cursor-pointer">
                  Stawka do negocjacji
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Oczekiwany poziom doświadczenia</Label>
                <select
                  id="experienceLevel"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  disabled={submitting}
                  className={selectClass}
                >
                  {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((l) => (
                    <option key={l} value={l}>
                      {EXPERIENCE_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Miejsce</Label>
                <select
                  id="location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  disabled={submitting || locations.length === 0}
                  className={selectClass}
                >
                  <option value="">Nie wybrano</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isRemote"
                  type="checkbox"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  disabled={submitting}
                  className="rounded border-input"
                />
                <Label htmlFor="isRemote" className="cursor-pointer">
                  Praca zdalna (remote)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">Typ projektu</Label>
                <select
                  id="projectType"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  disabled={submitting}
                  className={selectClass}
                >
                  {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((p) => (
                    <option key={p} value={p}>
                      {PROJECT_TYPE_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offerDays">Ilość dni na zebranie ofert</Label>
                <select
                  id="offerDays"
                  value={offerDays}
                  onChange={(e) => setOfferDays(Number(e.target.value))}
                  disabled={submitting}
                  className={selectClass}
                >
                  {[7, 14, 21, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} dni
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  7, 14, 21 lub 30 dni na zbieranie ofert od daty utworzenia.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Oczekiwane skille</Label>
                <p className="text-xs text-muted-foreground">
                  Wybierz z listy lub wpisz nazwę i naciśnij Enter, aby dodać (w tym nowy skill).
                </p>
                <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md bg-transparent min-h-10">
                  {selectedSkills.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-sm"
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() => removeSkill(i)}
                        disabled={submitting}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 leading-none"
                        aria-label="Usuń"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="relative inline-flex flex-1 min-w-[120px]">
                    <Input
                      ref={skillInputRef}
                      value={skillInput}
                      onChange={(e) => {
                        setSkillInput(e.target.value);
                        setSkillDropdownOpen(true);
                      }}
                      onFocus={() => setSkillDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setSkillDropdownOpen(false), 150)}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="Dodaj skill..."
                      disabled={submitting}
                      className="border-0 shadow-none focus-visible:ring-0 h-8 min-w-0"
                    />
                    {skillDropdownOpen && (filteredSkills.length > 0 || skillInput.trim()) && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-md border border-input bg-background py-1 shadow-md">
                        {filteredSkills.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              addSkill({ id: s.id, name: s.name });
                            }}
                          >
                            {s.name}
                          </button>
                        ))}
                        {skillInput.trim() &&
                          !skills.some((s) => s.name.toLowerCase() === skillInput.trim().toLowerCase()) && (
                            <button
                              type="button"
                              className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted text-muted-foreground"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addSkill({ id: null, name: skillInput.trim() });
                              }}
                            >
                              + Dodaj „{skillInput.trim()}” jako nowy skill
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
