"use client";

import { useEffect, useState, useRef } from "react";
import {
  getCategories,
  getLocations,
  getSkills,
  getDraftJob,
  type Category,
  type Location,
  type Skill,
  type BillingType,
  type HoursPerWeek,
  type ExperienceLevel,
  type ProjectType,
  type JobLanguage,
  type CreateJobPayload,
  type Job,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectBox } from "@/components/ui/SelectBox";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import ReactCountryFlag from "react-country-flag";

const CURRENCIES = ["PLN", "EUR", "USD", "GBP", "CHF"];

/** Suggested hourly rates in PLN by category slug (backend slug, locale-independent). */
const SUGGESTED_HOURLY_RATES_PLN: Record<
  string,
  { JUNIOR: number; MID: number; SENIOR: number }
> = {
  programming: { JUNIOR: 70, MID: 120, SENIOR: 180 },
  design: { JUNIOR: 60, MID: 100, SENIOR: 150 },
  marketing: { JUNIOR: 55, MID: 95, SENIOR: 140 },
  writing: { JUNIOR: 50, MID: 85, SENIOR: 130 },
  "office-working": { JUNIOR: 45, MID: 75, SENIOR: 110 },
  other: { JUNIOR: 50, MID: 90, SENIOR: 130 },
};

const DEFAULT_SUGGESTED_HOURLY_PLN = 100;

function getSuggestedHourlyRatePln(
  categorySlug: string,
  experienceLevel: ExperienceLevel
): number {
  const slug = categorySlug.trim().toLowerCase();
  const byLevel = SUGGESTED_HOURLY_RATES_PLN[slug];
  if (byLevel && byLevel[experienceLevel] != null) {
    return byLevel[experienceLevel];
  }
  return DEFAULT_SUGGESTED_HOURLY_PLN;
}

type SelectedSkill = { id: string | null; name: string };

export interface JobFormData {
  title: string;
  description: string;
  categoryId: string;
  language: JobLanguage;
  billingType: BillingType | "";
  hoursPerWeek: HoursPerWeek | "";
  rate: string;
  rateNegotiable: boolean;
  currency: string;
  experienceLevel: ExperienceLevel | "";
  locationId: string;
  isRemote: boolean;
  projectType: ProjectType | "";
  offerDays: number | "";
  selectedSkills: SelectedSkill[];
}

interface JobFormProps {
  initialData?: Job;
  onSubmit: (data: CreateJobPayload) => Promise<void>;
  mode: "create" | "edit";
  loading?: boolean;
}

export function JobForm({ initialData, onSubmit, mode, loading: externalLoading = false }: JobFormProps) {
  const { t } = useTranslations();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [language, setLanguage] = useState<JobLanguage>("POLISH");
  const [billingType, setBillingType] = useState<BillingType | "">("");
  const [hoursPerWeek, setHoursPerWeek] = useState<HoursPerWeek | "">("");
  const [rate, setRate] = useState("1000");
  const [rateNegotiable, setRateNegotiable] = useState(false);
  const [currency, setCurrency] = useState("PLN");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [locationId, setLocationId] = useState("");
  const [isRemote, setIsRemote] = useState(true);
  const [projectType, setProjectType] = useState<ProjectType | "">("");
  const [offerDays, setOfferDays] = useState<number | "">("");
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const BILLING_LABELS: Record<BillingType, string> = {
    FIXED: t("jobs.fixedRate"),
    HOURLY: t("jobs.newJobForm.hourlyRate"),
  };

  const BILLING_DESCRIPTIONS: Record<BillingType, string> = {
    HOURLY: t("jobs.newJobForm.billingTypeHourlyDescription"),
    FIXED: t("jobs.newJobForm.billingTypeFixedDescription"),
  };

  const HOURS_LABELS: Record<HoursPerWeek, string> = {
    LESS_THAN_10: t("jobs.lessThan10"),
    FROM_11_TO_20: t("jobs.from11To20"),
    FROM_21_TO_30: t("jobs.from21To30"),
    MORE_THAN_30: t("jobs.moreThan30"),
  };

  const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
    JUNIOR: t("jobs.junior"),
    MID: t("jobs.mid"),
    SENIOR: t("jobs.senior"),
  };

  const EXPERIENCE_DESCRIPTIONS: Record<ExperienceLevel, string> = {
    JUNIOR: t("jobs.newJobForm.experienceJuniorDescription"),
    MID: t("jobs.newJobForm.experienceMidDescription"),
    SENIOR: t("jobs.newJobForm.experienceSeniorDescription"),
  };

  const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
    ONE_TIME: t("jobs.oneTime"),
    CONTINUOUS: t("jobs.continuous"),
  };

  const PROJECT_TYPE_DESCRIPTIONS: Record<ProjectType, string> = {
    ONE_TIME: t("jobs.newJobForm.projectTypeOneTimeDescription"),
    CONTINUOUS: t("jobs.newJobForm.projectTypeContinuousDescription"),
  };

  // Load initial data for edit mode or draft from localStorage
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCategoryId(initialData.categoryId);
      setLanguage(initialData.language ?? "POLISH");
      setBillingType(initialData.billingType);
      setHoursPerWeek(initialData.hoursPerWeek ?? "");
      setRate(initialData.rate ?? "1000");
      setRateNegotiable(initialData.rateNegotiable ?? false);
      setCurrency(initialData.currency ?? "PLN");
      setExperienceLevel(initialData.experienceLevel);
      setLocationId(initialData.locationId ?? "");
      setIsRemote(initialData.isRemote);
      setProjectType(initialData.projectType);
      if (initialData.deadline && initialData.createdAt) {
        const ms = new Date(initialData.deadline).getTime() - new Date(initialData.createdAt).getTime();
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
        initialData.skills?.map((r) => ({ id: r.skill.id, name: r.skill.name })) ?? []
      );
    } else if (mode === "create" && !draftLoaded) {
      // Try to load draft from localStorage only once
      const draft = getDraftJob();
      if (draft) {
        setTitle(draft.title);
        setDescription(draft.description);
        setCategoryId(draft.categoryId);
        setLanguage(draft.language ?? "POLISH");
        setBillingType(draft.billingType);
        setHoursPerWeek(draft.hoursPerWeek ?? "");
        setRate(draft.rate.toString());
        setRateNegotiable(draft.rateNegotiable ?? false);
        setCurrency(draft.currency ?? "PLN");
        setExperienceLevel(draft.experienceLevel);
        setLocationId(draft.locationId ?? "");
        setIsRemote(draft.isRemote);
        setProjectType(draft.projectType);
        setOfferDays(draft.offerDays ?? 14);
        setDraftLoaded(true);
      }
    }
  }, [initialData, mode, draftLoaded]);

  // Load draft skills after skills list is loaded
  useEffect(() => {
    if (mode === "create" && skills.length > 0 && draftLoaded) {
      const draft = getDraftJob();
      if (draft) {
        const loadedSkills: SelectedSkill[] = [];

        // Load skills by ID
        if (draft.skillIds && draft.skillIds.length > 0) {
          draft.skillIds.forEach((id) => {
            const skill = skills.find((s) => s.id === id);
            if (skill) loadedSkills.push({ id: skill.id, name: skill.name });
          });
        }

        // Add new skill names
        if (draft.newSkillNames && draft.newSkillNames.length > 0) {
          draft.newSkillNames.forEach((name) => {
            loadedSkills.push({ id: null, name });
          });
        }

        if (loadedSkills.length > 0) {
          setSelectedSkills(loadedSkills);
        }
      }
    }
  }, [mode, skills, draftLoaded]);

  // Load categories, locations, skills
  useEffect(() => {
    Promise.all([
      getCategories(),
      getLocations(),
      getSkills(),
    ])
      .then(([cats, locs, sk]) => {
        setCategories(cats);
        setLocations(locs);
        setSkills(sk);
      })
      .catch(() => setErrors({ general: t("jobs.failedToLoadData") }))
      .finally(() => setLoading(false));
  }, []);

  // Suggest hourly rate from category × experience level matrix (create mode, HOURLY billing)
  useEffect(() => {
    if (mode !== "create" || !categoryId || !experienceLevel || billingType !== "HOURLY") {
      return;
    }
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;
    const suggested = getSuggestedHourlyRatePln(category.slug, experienceLevel as ExperienceLevel);
    setRate(String(suggested));
  }, [mode, categoryId, experienceLevel, billingType, categories]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = t("jobs.fillRequired");
    }
    if (!description.trim()) {
      newErrors.description = t("jobs.fillRequired");
    }
    if (!categoryId) {
      newErrors.category = t("jobs.fillRequired");
    }
    if (!experienceLevel) {
      newErrors.experienceLevel = t("jobs.newJobForm.selectExperienceLevel");
    }
    if (!projectType) {
      newErrors.projectType = t("jobs.newJobForm.selectProjectType");
    }
    if (!billingType) {
      newErrors.billingType = t("jobs.newJobForm.selectBillingType");
    }
    if (billingType === "HOURLY" && !hoursPerWeek) {
      newErrors.hoursPerWeek = t("jobs.selectHoursPerWeek");
    }
    const rateNum = parseFloat(rate.replace(",", "."));
    if (!rate || isNaN(rateNum) || rateNum < 0) {
      newErrors.rate = t("jobs.invalidRate");
    }
    const allowedOfferDays = [7, 14, 21, 30];
    if (!offerDays || !allowedOfferDays.includes(offerDays)) {
      newErrors.offerDays = t("jobs.invalidOfferDays");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    const rateNum = parseFloat(rate.replace(",", "."));
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        language,
        billingType: billingType as BillingType,
        hoursPerWeek: billingType === "HOURLY" ? (hoursPerWeek as HoursPerWeek) : undefined,
        rate: rateNum,
        rateNegotiable,
        currency,
        experienceLevel: experienceLevel as ExperienceLevel,
        locationId: locationId || undefined,
        isRemote,
        projectType: projectType as ProjectType,
        offerDays: offerDays as number,
        skillIds: selectedSkills.filter((s) => s.id != null).map((s) => s.id as string),
        newSkillNames: selectedSkills.filter((s) => s.id == null).map((s) => s.name),
      });
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : t("jobs.failedToCreate") });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || externalLoading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errors.general && (
        <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
      )}

      {/* Step 1: Language, Title, Description, Category */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("jobs.newJobForm.step1")}</h2>
        <div className="space-y-2">
          <Label>{t("jobs.language")}</Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setLanguage("POLISH")}
              disabled={submitting}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                language === "POLISH"
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-input bg-background hover:border-ring",
                "disabled:opacity-50"
              )}
            >
              <ReactCountryFlag
                svg
                countryCode="PL"
                style={{ width: "1.5em", height: "1.5em" }}
              />
              <span className="font-medium">{t("jobs.polish")}</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage("ENGLISH")}
              disabled={submitting}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                language === "ENGLISH"
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-input bg-background hover:border-ring",
                "disabled:opacity-50"
              )}
            >
              <ReactCountryFlag
                svg
                countryCode="GB"
                style={{ width: "1.5em", height: "1.5em" }}
              />
              <span className="font-medium">{t("jobs.english")}</span>
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">{t("jobs.title")}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) {
                setErrors((prev) => ({ ...prev, title: "" }));
              }
            }}
            placeholder={t("jobs.newJobForm.titlePlaceholder")}
            maxLength={200}
            disabled={submitting}
            className={cn("h-11 text-base", errors.title && "border-destructive")}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.title}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t("jobs.description")}</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            placeholder={t("jobs.newJobForm.descriptionPlaceholder")}
            maxLength={5000}
            rows={6}
            disabled={submitting}
            className={cn(
              "flex w-full rounded-md border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "placeholder:text-muted-foreground disabled:opacity-50",
              errors.description ? "border-destructive" : "border-input"
            )}
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.description}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("jobs.category")}</Label>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((c) => (
                  <SelectBox
                    key={c.id}
                    value={c.id}
                    label={c.name}
                    selected={categoryId === c.id}
                    onSelect={() => {
                      setCategoryId(c.id);
                      if (errors.category) {
                        setErrors((prev) => ({ ...prev, category: "" }));
                      }
                    }}
                    disabled={submitting}
                    className={errors.category ? "border-destructive" : undefined}
                  />
                ))}
              </div>
              {errors.category && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.category}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Step 2: Experience Level, Expected Skills, Remote */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("jobs.newJobForm.step2")}</h2>

        <div className="space-y-3">
          <Label>{t("jobs.experienceLevel")}</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((level) => (
              <SelectBox
                key={level}
                value={level}
                label={EXPERIENCE_LABELS[level]}
                description={EXPERIENCE_DESCRIPTIONS[level]}
                selected={experienceLevel === level}
                onSelect={() => {
                  setExperienceLevel(level);
                  if (errors.experienceLevel) {
                    setErrors((prev) => ({ ...prev, experienceLevel: "" }));
                  }
                }}
                disabled={submitting}
                className={errors.experienceLevel ? "border-destructive" : undefined}
              />
            ))}
          </div>
          {errors.experienceLevel && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.experienceLevel}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("jobs.newJobForm.expectedSkills")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("jobs.newJobForm.skillsDescription")}
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
                  aria-label={t("jobs.newJobForm.remove")}
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
                placeholder={t("jobs.newJobForm.addSkillPlaceholder")}
                disabled={submitting}
                className="border-0 shadow-none focus-visible:ring-0 h-11 text-base min-w-0"
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
                        {t("jobs.newJobForm.addNewSkill", { name: skillInput.trim() })}
                      </button>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isRemote"
              checked={isRemote}
              onCheckedChange={(checked) => setIsRemote(checked === true)}
              disabled={submitting}
            />
            <Label htmlFor="isRemote" className="cursor-pointer text-base font-medium">
              {t("jobs.remoteWork")}
            </Label>
          </div>

          {!isRemote && (
            <div className="space-y-2">
              <Label htmlFor="location">{t("jobs.location")}</Label>
              <Select
                value={locationId}
                onValueChange={setLocationId}
                disabled={submitting || locations.length === 0}
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder={t("jobs.newJobForm.notSelected")} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Project Type, Billing Type, Hours Per Week, Fixed Rate */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("jobs.newJobForm.step3")}</h2>

        <div className="space-y-3">
          <Label>{t("jobs.projectType")}</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((type) => (
              <SelectBox
                key={type}
                value={type}
                label={PROJECT_TYPE_LABELS[type]}
                description={PROJECT_TYPE_DESCRIPTIONS[type]}
                selected={projectType === type}
                onSelect={() => {
                  setProjectType(type);
                  if (errors.projectType) {
                    setErrors((prev) => ({ ...prev, projectType: "" }));
                  }
                }}
                disabled={submitting}
                className={errors.projectType ? "border-destructive" : undefined}
              />
            ))}
          </div>
          {errors.projectType && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.projectType}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>{t("jobs.billingType")}</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(BILLING_LABELS) as BillingType[]).map((type) => (
              <SelectBox
                key={type}
                value={type}
                label={BILLING_LABELS[type]}
                description={BILLING_DESCRIPTIONS[type]}
                selected={billingType === type}
                onSelect={() => {
                  setBillingType(type);
                  if (errors.billingType) {
                    setErrors((prev) => ({ ...prev, billingType: "" }));
                  }
                }}
                disabled={submitting}
                className={errors.billingType ? "border-destructive" : undefined}
              />
            ))}
          </div>
          {errors.billingType && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.billingType}</p>
          )}

          {billingType === "HOURLY" && (
            <div className="space-y-3 mt-4">
              <Label>{t("jobs.hoursPerWeek")}</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(HOURS_LABELS) as HoursPerWeek[]).map((hours) => (
                  <SelectBox
                    key={hours}
                    value={hours}
                    label={HOURS_LABELS[hours]}
                    selected={hoursPerWeek === hours}
                    onSelect={() => {
                      setHoursPerWeek(hours);
                      if (errors.hoursPerWeek) {
                        setErrors((prev) => ({ ...prev, hoursPerWeek: "" }));
                      }
                    }}
                    disabled={submitting}
                    className={errors.hoursPerWeek ? "border-destructive" : undefined}
                  />
                ))}
              </div>
              {errors.hoursPerWeek && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.hoursPerWeek}</p>
              )}
            </div>
          )}

          {billingType && (
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">
                    {billingType === "HOURLY" ? t("jobs.newJobForm.hourlyRate") : t("jobs.newJobForm.fixedRate")}
                  </Label>
                  <Input
                    id="rate"
                    type="number"
                    min={0}
                    step="0.01"
                    value={rate}
                    onChange={(e) => {
                      setRate(e.target.value);
                      if (errors.rate) {
                        setErrors((prev) => ({ ...prev, rate: "" }));
                      }
                    }}
                    placeholder="0"
                    disabled={submitting}
                    className={cn("h-11 text-base", errors.rate && "border-destructive")}
                    aria-invalid={!!errors.rate}
                  />
                  {errors.rate && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.rate}</p>
                  )}
                  {billingType === "HOURLY" && (
                    <p className="text-xs text-muted-foreground">
                      {t("jobs.newJobForm.suggestedRateNote")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("jobs.currency")}</Label>
                  <Select
                    value={currency}
                    onValueChange={setCurrency}
                    disabled={submitting}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rateNegotiable"
                  checked={rateNegotiable}
                  onCheckedChange={(checked) => setRateNegotiable(checked === true)}
                  disabled={submitting}
                />
                <Label htmlFor="rateNegotiable" className="cursor-pointer">
                  {t("jobs.rateNegotiable")}
                </Label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 4: Offer Days */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("jobs.newJobForm.step4")}</h2>

        <div className="space-y-3">
          <Label>{t("jobs.offerDays")}</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[7, 14, 21, 30].map((days) => (
              <SelectBox
                key={days}
                value={days.toString()}
                label={`${days} ${t("jobs.newJobForm.days")}`}
                selected={offerDays === days}
                onSelect={() => {
                  setOfferDays(days);
                  if (errors.offerDays) {
                    setErrors((prev) => ({ ...prev, offerDays: "" }));
                  }
                }}
                disabled={submitting}
                className={errors.offerDays ? "border-destructive" : undefined}
              />
            ))}
          </div>
          {errors.offerDays && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.offerDays}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={submitting} size="lg" className="w-full">
        {submitting
          ? t("jobs.newJobForm.submitting")
          : mode === "create"
            ? t("jobs.newJobForm.submit")
            : t("jobs.saveChanges")}
      </Button>
    </form>
  );
}
