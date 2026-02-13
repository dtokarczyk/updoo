import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

/** Same deterministic blurred rate placeholder as frontend (rate-helpers.ts). */
function getBlurredRatePlaceholder(
  jobId: string,
  billingType: string,
  currency: string,
): string {
  let hash = 0;
  for (let i = 0; i < jobId.length; i++)
    hash = (hash * 31 + jobId.charCodeAt(i)) >>> 0;
  const isHourly = billingType === 'HOURLY';
  const min = isHourly ? 50 : 1000;
  const max = isHourly ? 250 : 12000;
  const value = min + (hash % (max - min + 1));
  const formatted = value.toLocaleString('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return billingType === 'HOURLY'
    ? `${formatted} ${currency}/h`
    : `${formatted} ${currency}`;
}

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: 'Junior',
  MID: 'Mid',
  SENIOR: 'Senior',
};

const BILLING_LABELS: Record<string, string> = {
  HOURLY: 'Godzinowo',
  FIXED: 'Ryczałt',
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  ONE_TIME: 'Jednorazowy',
  CONTINUOUS: 'Ciągły',
};

/** Minimal 64x64 SVG icons (Lucide-style) as data URI - white stroke on transparent. */
const ICON_CLOCK =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  ).toString('base64');
const ICON_SETTINGS =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"><path d="M14 17H5"/><path d="M19 7h-9"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>',
  ).toString('base64');
const ICON_CALENDAR =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  ).toString('base64');
const ICON_BRIEFCASE =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  ).toString('base64');

export interface JobOgPayload {
  id: string;
  title: string;
  experienceLevel: string;
  billingType: string;
  currency: string;
  projectType: string;
}

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const FONT_FAMILY = 'Satoshi';
const FONT_DOMAIN = 'Satoshi Black'; // Used for "Więcej ogłoszeń na Hoplo.pl" (Kroku Black not in assets)

@Injectable()
export class OgImageService {
  private logoSvgDataUri: string | null = null;
  private fonts: { name: string; data: Buffer; weight: number; style: string }[] =
    [];

  private async loadFonts(): Promise<
    { name: string; data: Buffer; weight: number; style: string }[]
  > {
    if (this.fonts.length > 0) return this.fonts;
    const candidates = [
      path.join(process.cwd(), 'assets', 'Satoshi_Complete', 'Fonts', 'WEB', 'fonts'),
      path.join(__dirname, '..', '..', 'assets', 'Satoshi_Complete', 'Fonts', 'WEB', 'fonts'),
    ];
    for (const assetsDir of candidates) {
      try {
        const [regular, bold, black] = await Promise.all([
          fs.readFile(path.join(assetsDir, 'Satoshi-Regular.woff')),
          fs.readFile(path.join(assetsDir, 'Satoshi-Bold.woff')),
          fs.readFile(path.join(assetsDir, 'Satoshi-Black.woff')),
        ]);
        this.fonts = [
          { name: FONT_FAMILY, data: regular, weight: 400 as const, style: 'normal' as const },
          { name: FONT_FAMILY, data: bold, weight: 700 as const, style: 'normal' as const },
          { name: FONT_DOMAIN, data: black, weight: 900 as const, style: 'normal' as const },
        ];
        return this.fonts;
      } catch {
        continue;
      }
    }
    this.fonts = [];
    return this.fonts;
  }

  private async getLogoDataUri(): Promise<string> {
    if (this.logoSvgDataUri) return this.logoSvgDataUri;
    const assetPath = path.join(process.cwd(), 'assets', 'Hoplo.svg');
    try {
      const buf = await fs.readFile(assetPath);
      this.logoSvgDataUri =
        'data:image/svg+xml;base64,' + buf.toString('base64');
      return this.logoSvgDataUri;
    } catch {
      this.logoSvgDataUri = '';
      return this.logoSvgDataUri;
    }
  }

  async generateJobOgImage(job: JobOgPayload): Promise<Buffer> {
    const fonts = await this.loadFonts();

    const experienceLabel =
      EXPERIENCE_LABELS[job.experienceLevel] ?? job.experienceLevel;
    const rateBlurred = getBlurredRatePlaceholder(
      job.id,
      job.billingType,
      job.currency,
    );
    const billingLabel = BILLING_LABELS[job.billingType] ?? job.billingType;
    const projectTypeLabel =
      PROJECT_TYPE_LABELS[job.projectType] ?? job.projectType;
    // Title: max 2 lines (≈72 chars at 58px + width ~1100px), ellipsis if longer
    const maxTitleChars = 75;
    const title =
      job.title.length > maxTitleChars
        ? job.title.slice(0, maxTitleChars - 3).trim() + '...'
        : job.title;

    // Title 20% larger: 48×1.2≈58
    const titleFontSize = 58;

    // Satori tree: title + grid first; bottom row = logo left, button right.
    const tree = {
      type: 'div',
      props: {
        style: {
          width: OG_WIDTH,
          height: OG_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          padding: 34,
          fontFamily: FONT_FAMILY,
          borderWidth: 10,
          borderColor: '#22c55e',
          borderStyle: 'solid',
          boxSizing: 'border-box',
        },
        children: [
          // Title (max 2 lines, bold)
          {
            type: 'div',
            props: {
              style: {
                fontSize: titleFontSize,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                maxWidth: OG_WIDTH - 68,
                maxHeight: Math.ceil(titleFontSize * 1.2 * 2),
                overflow: 'hidden',
              },
              children: title,
            },
          },
          // Grid 2x2: full width rows, fonts 100% larger
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: 32,
                marginTop: 40,
                flex: 1,
                width: '100%',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 48,
                      width: '100%',
                    },
                    children: [
                      cell(
                        ICON_CLOCK,
                        'Poziom doświadczenia',
                        experienceLabel,
                        false,
                      ),
                      cell(
                        ICON_SETTINGS,
                        'Stawka',
                        rateBlurred,
                        true,
                      ),
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 48,
                      width: '100%',
                    },
                    children: [
                      cell(
                        ICON_CALENDAR,
                        'Typ rozliczenia',
                        billingLabel,
                        false,
                      ),
                      cell(
                        ICON_BRIEFCASE,
                        'Typ projektu',
                        projectTypeLabel,
                        false,
                      ),
                    ],
                  },
                },
              ],
            },
          },
          // Bottom row: www.Hoplo.pl left (aligned to bottom), button right (10% smaller)
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                width: '100%',
                marginTop: 'auto',
                paddingTop: 24,
              },
              children: [
                // Więcej ogłoszeń na Hoplo.pl (Satoshi Black)
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 48,
                      fontWeight: 900,
                      color: '#f8fafc',
                      fontFamily: FONT_DOMAIN,
                    },
                    children: 'Więcej ogłoszeń na Hoplo.pl',
                  },
                },
                // Button bottom-right (10% smaller)
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#22c55e',
                      color: '#fff',
                      fontSize: 38,
                      fontWeight: 700,
                      paddingLeft: 64,
                      paddingRight: 64,
                      paddingTop: 27,
                      paddingBottom: 27,
                      borderRadius: 11,
                      fontFamily: FONT_FAMILY,
                    },
                    children: 'Zobacz',
                  },
                },
              ],
            },
          },
        ],
      },
    };

    // Satori requires at least one font when rendering text.
    if (fonts.length === 0) {
      throw new Error(
        'Satoshi font not found. Ensure assets/Satoshi_Complete/Fonts/WEB/fonts/ exists.',
      );
    }
    const svg = await satori(tree as never, {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts: fonts as { name: string; data: Buffer; weight: 400 | 700 | 900; style: 'normal' }[],
    });

    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    return Buffer.from(pngBuffer);
  }
}

/** One cell: full width (flex 1), icon 15% smaller, text 10% smaller (29/40). */
function cell(
  iconSrc: string,
  label: string,
  value: string,
  isRate: boolean,
): { type: string; props: Record<string, unknown> } {
  const iconBoxSize = 82;   // 96×0.85
  const iconImgSize = 48;   // 56×0.85
  const labelFontSize = 29; // 32×0.9
  const valueFontSize = 40; // 44×0.9
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        flex: 1,
        minWidth: 0,
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width: iconBoxSize,
              height: iconBoxSize,
              borderRadius: 14,
              backgroundColor: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            },
            children: {
              type: 'img',
              props: {
                src: iconSrc,
                width: iconImgSize,
                height: iconImgSize,
                style: { display: 'block' },
              },
            },
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: labelFontSize,
                    color: '#94a3b8',
                    fontFamily: FONT_FAMILY,
                  },
                  children: label,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: valueFontSize,
                    fontWeight: 700,
                    color: isRate ? '#22c55e' : '#f8fafc',
                    fontFamily: FONT_FAMILY,
                  },
                  children: value,
                },
              },
            ],
          },
        },
      ],
    },
  };
}
