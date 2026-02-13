'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Gauge,
  Flame,
  Megaphone,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { Switch } from '@/components/ui/switch';

type TabType = 'consent' | 'details' | 'about';

interface ConsentOption {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  enabled: boolean;
}

const CONSENT_OPTION_IDS = [
  'googleAnalytics',
  'googleAdWords',
  'hotjar',
  'vercelAnalytics',
  'vercelSpeedInsights',
  'facebookAds',
] as const;

function getConsentOptions(t: (key: string) => string): ConsentOption[] {
  const icons: Record<string, LucideIcon> = {
    googleAnalytics: BarChart3,
    googleAdWords: Megaphone,
    hotjar: Flame,
    vercelAnalytics: BarChart3,
    vercelSpeedInsights: Gauge,
    facebookAds: Share2,
  };
  return CONSENT_OPTION_IDS.map((id) => ({
    id,
    nameKey: `cookieConsent.options.${id}.name`,
    descriptionKey: `cookieConsent.options.${id}.description`,
    icon: icons[id] ?? BarChart3,
    enabled: true,
  }));
}

interface CookieConsentProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CookieConsent({ isOpen, onClose }: CookieConsentProps = {}) {
  const { t } = useTranslations();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('consent');
  const [consentOptions, setConsentOptions] = useState<ConsentOption[]>(() =>
    getConsentOptions(t),
  );

  useEffect(() => {
    if (isOpen !== undefined) {
      setIsVisible(isOpen);
    } else {
      const consent = localStorage.getItem('cookie-consent');
      if (!consent) {
        setIsVisible(true);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpen = () => setIsVisible(true);
    window.addEventListener('openCookieConsent', handleOpen);
    return () => window.removeEventListener('openCookieConsent', handleOpen);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isVisible]);

  useEffect(() => {
    const loadConsentValues = () => {
      try {
        const consent = localStorage.getItem('cookie-consent');
        if (consent) {
          const preferences = JSON.parse(consent);
          setConsentOptions((prev) =>
            prev.map((option) => ({
              ...option,
              enabled: preferences[option.id] !== false,
            })),
          );
        }
      } catch (error) {
        console.error('Error parsing consent preferences:', error);
        setConsentOptions(getConsentOptions(t));
      }
    };
    loadConsentValues();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cookie-consent') loadConsentValues();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [t]);

  const handleAllowAll = () => {
    try {
      const preferences = CONSENT_OPTION_IDS.reduce(
        (acc, id) => {
          acc[id] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      localStorage.setItem(
        'cookie-consent',
        JSON.stringify({
          ...preferences,
          timestamp: new Date().toISOString(),
        }),
      );
      setConsentOptions((prev) => prev.map((o) => ({ ...o, enabled: true })));
      setIsVisible(false);
      window.dispatchEvent(new CustomEvent('cookieConsentChanged'));
      onClose?.();
    } catch (error) {
      console.error('Error saving consent preferences:', error);
    }
  };

  const handleSavePreferences = () => {
    try {
      const preferences = consentOptions.reduce(
        (acc, option) => {
          if (option.enabled === false) acc[option.id] = false;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      localStorage.setItem(
        'cookie-consent',
        JSON.stringify({
          ...preferences,
          timestamp: new Date().toISOString(),
        }),
      );
      setIsVisible(false);
      window.dispatchEvent(new CustomEvent('cookieConsentChanged'));
      onClose?.();
    } catch (error) {
      console.error('Error saving consent preferences:', error);
    }
  };

  const toggleConsentOption = (optionId: string) => {
    setConsentOptions((prev) =>
      prev.map((option) =>
        option.id === optionId
          ? { ...option, enabled: !option.enabled }
          : option,
      ),
    );
  };

  if (!isVisible) return null;

  const DETAIL_DESCRIPTION_KEYS = [0, 1, 2, 3].map(
    (i) => `cookieConsent.details.description${i}`,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-background shadow-2xl">
        <div className="flex shrink-0 border-b border-border">
          {(['consent', 'details', 'about'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'hover:text-foreground/80'
              }`}
            >
              {t(`cookieConsent.tabs.${tab}`)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'consent' && (
            <div>
              <h2
                id="cookie-consent-title"
                className="mb-4 text-xl font-bold"
              >
                {t('cookieConsent.consent.title')}
              </h2>
              <p className="mb-6 text-sm leading-relaxed">
                {t('cookieConsent.consent.description')}
              </p>
            </div>
          )}

          {activeTab === 'details' && (
            <div>
              <h2 className="mb-4 text-xl font-bold">
                {t('cookieConsent.details.title')}
              </h2>
              <div className="mb-6 space-y-4 text-sm">
                {DETAIL_DESCRIPTION_KEYS.map((key) => (
                  <p key={key}>{t(key)}</p>
                ))}
              </div>
              <div className="space-y-4">
                {consentOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={option.id}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-medium">{t(option.nameKey)}</h3>
                        </div>
                        <Switch
                          checked={option.enabled}
                          onCheckedChange={() =>
                            toggleConsentOption(option.id)
                          }
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t(option.descriptionKey)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div>
              <h2 className="mb-4 text-xl font-bold">
                {t('cookieConsent.about.title')}
              </h2>
              <div className="space-y-4 text-sm">
                <p>{t('cookieConsent.about.description')}</p>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">
                    <strong>{t('cookieConsent.about.contact.title')}</strong>
                    <br />
                    {t('cookieConsent.about.contact.name')}
                    <br />
                    {t('cookieConsent.about.contact.email')}
                    <br />
                    {t('cookieConsent.about.contact.phone')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-4 border-t border-border p-6">
          {activeTab === 'details' ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('consent')}
                className="flex-1 rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
              >
                {t('cookieConsent.buttons.back')}
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t('cookieConsent.buttons.savePreferences')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className="flex-1 rounded-lg border border-primary px-6 py-3 font-medium text-primary transition-colors hover:bg-primary/10"
              >
                {t('cookieConsent.buttons.customize')}
              </button>
              <button
                type="button"
                onClick={handleAllowAll}
                className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t('cookieConsent.buttons.allowAll')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
