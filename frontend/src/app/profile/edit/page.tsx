'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  getStoredUser,
  updateProfile,
  updateStoredUser,
  getToken,
  clearAuth,
  getSkills,
  type Skill,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';

export default function ProfileEditPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nipCompany, setNipCompany] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [, setSkillsError] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [skillsSearch, setSkillsSearch] = useState('');
  const [defaultMessage, setDefaultMessage] = useState('');
  const [accountType, setAccountType] = useState<
    'CLIENT' | 'FREELANCER' | 'ADMIN' | null
  >(null);

  const [hasPassword, setHasPassword] = useState(true);

  useEffect(() => {
    setMounted(true);
    const user = getStoredUser();
    if (user) {
      setName(user.name ?? '');
      setSurname(user.surname ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setNipCompany(user.nipCompany ?? '');
      setAccountType(user.accountType);
      setHasPassword(user.hasPassword !== false);
      if (Array.isArray(user.skills)) {
        setSelectedSkillIds(user.skills.map((skill) => skill.id));
      }
      if (user.defaultMessage != null) {
        setDefaultMessage(user.defaultMessage);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace('/login');
      return;
    }
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    async function loadSkills() {
      setSkillsError('');
      setSkillsLoading(true);
      try {
        const allSkills = await getSkills();
        if (!cancelled) {
          setSkills(allSkills);
        }
      } catch (err) {
        if (!cancelled) {
          setSkillsError(
            err instanceof Error ? err.message : 'Failed to load skills',
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
  }, [mounted]);

  function toggleSkill(id: string) {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const filteredSkills =
    skillsSearch.trim().length === 0
      ? skills
      : skills.filter((skill) =>
          skill.name.toLowerCase().includes(skillsSearch.trim().toLowerCase()),
        );

  async function handleBasicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {
        name: name.trim() || undefined,
        surname: surname.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        nipCompany: nipCompany.trim(),
        ...(accountType === 'FREELANCER' && {
          defaultMessage: defaultMessage.trim() || undefined,
        }),
      };
      const { user: updated } = await updateProfile(payload);
      updateStoredUser(updated);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSkillsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {
        skillIds: selectedSkillIds,
      };
      const { user: updated } = await updateProfile(payload);
      updateStoredUser(updated);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!password.trim() || !passwordConfirm.trim()) {
      setError(t('profile.passwordBothRequired'));
      return;
    }
    if (password.trim() !== passwordConfirm.trim()) {
      setError(t('profile.passwordMismatch'));
      return;
    }
    if (hasPassword && !oldPassword.trim()) {
      setError(t('profile.passwordBothRequired'));
      return;
    }
    setLoading(true);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {
        ...(hasPassword && { oldPassword: oldPassword.trim() }),
        password: password.trim(),
      };
      const { user: updated } = await updateProfile(payload);
      updateStoredUser(updated);
      setHasPassword(updated.hasPassword !== false);
      setOldPassword('');
      setPassword('');
      setPasswordConfirm('');
      setSuccess(true);
      if (hasPassword) {
        clearAuth();
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('profile.editProfile')}</CardTitle>
          <CardDescription>{t('profile.editProfileDesc')}</CardDescription>
        </CardHeader>
        <Tabs defaultValue="basic">
          <CardContent className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="basic">{t('profile.tabBasic')}</TabsTrigger>
              <TabsTrigger value="skills">{t('profile.tabSkills')}</TabsTrigger>
              <TabsTrigger value="password">
                {t('profile.tabPassword')}
              </TabsTrigger>
            </TabsList>
            {error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400 rounded-md bg-green-500/10 px-3 py-2">
                {t('profile.profileSaved')}
              </p>
            )}
            <TabsContent value="basic" className="space-y-4">
              <form onSubmit={handleBasicSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('auth.name')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('auth.name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="given-name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">{t('auth.surname')}</Label>
                  <Input
                    id="surname"
                    type="text"
                    placeholder={t('auth.surname')}
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    autoComplete="family-name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('profile.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t('onboarding.phonePlaceholder')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('profile.phoneDesc')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nipCompany">{t('profile.nipCompany')}</Label>
                  <Input
                    id="nipCompany"
                    type="text"
                    placeholder={t('profile.nipCompanyPlaceholder')}
                    value={nipCompany}
                    onChange={(e) =>
                      setNipCompany(
                        e.target.value.replace(/\D/g, '').slice(0, 10),
                      )
                    }
                    disabled={loading}
                    maxLength={10}
                  />
                </div>
                {accountType === 'FREELANCER' && (
                  <div className="space-y-2">
                    <Label htmlFor="defaultMessage">
                      {t('profile.defaultMessage')}
                    </Label>
                    <Textarea
                      id="defaultMessage"
                      placeholder={t('profile.defaultMessagePlaceholder')}
                      value={defaultMessage}
                      onChange={(e) => setDefaultMessage(e.target.value)}
                      rows={8}
                      disabled={loading}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('profile.defaultMessageDesc')}
                    </p>
                  </div>
                )}
                <CardFooter className="px-0">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('common.saving') : t('common.save')}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <form onSubmit={handleSkillsSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.freelancerSkillsDesc')}
                </p>
                <Input
                  type="text"
                  placeholder={t(
                    'onboarding.freelancerSkillsSearchPlaceholder',
                  )}
                  value={skillsSearch}
                  onChange={(e) => setSkillsSearch(e.target.value)}
                  disabled={skillsLoading || loading}
                />
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
                  {skillsLoading && (
                    <p className="text-sm text-muted-foreground">
                      {t('common.loading')}
                    </p>
                  )}
                  {!skillsLoading && filteredSkills.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {skillsSearch.trim().length > 0
                        ? t('onboarding.freelancerSkillsNoResults')
                        : t('onboarding.freelancerSkillsEmpty')}
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
                <CardFooter className="px-0">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('common.saving') : t('common.save')}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="password" className="space-y-4">
              {!hasPassword && (
                <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
                  {t('profile.noPasswordGoogle')}
                </p>
              )}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {hasPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">
                      {t('profile.currentPassword')}
                    </Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      placeholder={t('profile.currentPasswordPlaceholder')}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      autoComplete="current-password"
                      disabled={loading}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {hasPassword
                      ? t('profile.newPassword')
                      : t('profile.setPassword')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('profile.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">
                    {t('profile.newPasswordConfirm')}
                  </Label>
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder={t('profile.passwordPlaceholder')}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('profile.passwordMinLength')}
                  </p>
                </div>
                <CardFooter className="px-0">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading
                      ? t('common.saving')
                      : hasPassword
                        ? t('common.save')
                        : t('profile.setPassword')}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
