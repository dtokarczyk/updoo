import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export type EmailTemplateLang = 'pl' | 'en';

export interface RenderedEmail {
  subject: string;
  html: string;
  text?: string;
}

const SUPPORTED_LANGS: EmailTemplateLang[] = ['pl', 'en'];

/**
 * Replaces {{key}} placeholders. When escapeHtml is true and key is not in rawKeys, values are HTML-escaped.
 */
function substituteVariables(
  content: string,
  variables: Record<string, string>,
  escapeHtml: boolean,
  rawKeys: Set<string> = new Set(),
): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const safeValue =
      escapeHtml && !rawKeys.has(key) ? escapeHtmlForEmail(value) : value;
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, safeValue);
  }
  return result;
}

function escapeHtmlForEmail(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TEMPLATES_SUBDIR = 'templates';

@Injectable()
export class EmailTemplatesService {
  private readonly templatesDir: string;
  private readonly cache = new Map<
    string,
    { subject: string; html: string; text?: string }
  >();

  constructor() {
    this.templatesDir = this.resolveTemplatesDir();
  }

  /**
   * Resolves templates directory for both dev (src/) and prod (dist/).
   * Nest copies assets to dist/email-templates/templates (not under dist/src/).
   * When compiled, we try that path first so header/footer and all templates are found.
   */
  private resolveTemplatesDir(): string {
    const isCompiled = __dirname.includes(path.sep + 'dist' + path.sep);
    if (isCompiled) {
      const distWhereNestCopies = path.join(
        __dirname,
        '..',
        '..',
        'email-templates',
        TEMPLATES_SUBDIR,
      );
      const hasHeader = fs.existsSync(
        path.join(distWhereNestCopies, 'header.en.html'),
      );
      const hasSubject = fs.existsSync(
        path.join(distWhereNestCopies, 'forgot-password.pl.subject.txt'),
      );
      if (hasHeader && hasSubject) return distWhereNestCopies;
    }
    return path.join(__dirname, TEMPLATES_SUBDIR);
  }

  /**
   * Renders an email template with the given language and variables.
   * Variables are substituted as {{key}} in both subject and body; values are HTML-escaped in body.
   * Pass rawKeys to insert pre-rendered HTML for listed variable names without escaping.
   */
  render(
    templateName: string,
    lang: EmailTemplateLang,
    variables: Record<string, string>,
    rawKeys: string[] = [],
  ): RenderedEmail {
    if (!SUPPORTED_LANGS.includes(lang)) {
      throw new Error(`Unsupported template lang: ${lang}`);
    }

    const cacheKey = `${templateName}.${lang}`;
    let raw = this.cache.get(cacheKey);
    if (!raw) {
      raw = this.loadTemplate(templateName, lang);
      this.cache.set(cacheKey, raw);
    }

    const rawSet = new Set(rawKeys);
    const subject = substituteVariables(raw.subject, variables, true);
    const html = substituteVariables(raw.html, variables, true, rawSet);
    const text = raw.text
      ? substituteVariables(raw.text, variables, false)
      : undefined;

    return { subject, html, text };
  }

  private loadTemplate(
    templateName: string,
    lang: EmailTemplateLang,
  ): { subject: string; html: string; text?: string } {
    const safeName = templateName.replace(/[^a-z0-9-]/gi, '');
    const subjectPath = path.join(
      this.templatesDir,
      `${safeName}.${lang}.subject.txt`,
    );
    const htmlPath = path.join(this.templatesDir, `${safeName}.${lang}.html`);
    const txtPath = path.join(this.templatesDir, `${safeName}.${lang}.txt`);

    let subject: string;
    let html: string;
    let text: string | undefined;

    try {
      subject = fs.readFileSync(subjectPath, 'utf-8').trim();
    } catch {
      throw new Error(`Email template subject not found: ${subjectPath}`);
    }
    try {
      html = fs.readFileSync(htmlPath, 'utf-8');
    } catch {
      throw new Error(`Email template html not found: ${htmlPath}`);
    }
    const headerHtml = this.loadPartialHtml('header', lang);
    const footerHtml = this.loadPartialHtml('footer', lang);
    if (headerHtml || footerHtml) {
      html = headerHtml + html.trim() + footerHtml;
    }
    try {
      text = fs.readFileSync(txtPath, 'utf-8').trim();
    } catch {
      text = undefined;
    }

    return { subject, html, text };
  }

  /**
   * Loads a partial HTML fragment (e.g. header, footer) by name and lang.
   * Returns empty string if file does not exist.
   */
  private loadPartialHtml(
    partialName: string,
    lang: EmailTemplateLang,
  ): string {
    const safeName = partialName.replace(/[^a-z0-9-]/gi, '');
    const htmlPath = path.join(this.templatesDir, `${safeName}.${lang}.html`);
    try {
      return fs.readFileSync(htmlPath, 'utf-8');
    } catch {
      return '';
    }
  }
}
