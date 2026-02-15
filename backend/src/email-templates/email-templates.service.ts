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
 * Replaces {{key}} placeholders and escapes variable values for safe HTML output.
 */
function substituteVariables(
  content: string,
  variables: Record<string, string>,
  escapeHtml: boolean,
): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const safeValue = escapeHtml ? escapeHtmlForEmail(value) : value;
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

@Injectable()
export class EmailTemplatesService {
  private readonly templatesDir: string;
  private readonly cache = new Map<string, { subject: string; html: string; text?: string }>();

  constructor() {
    // Compiled output is in dist/src/email-templates; Nest copies assets to dist/email-templates/templates
    const isCompiled = __dirname.includes(path.sep + 'dist' + path.sep);
    this.templatesDir = isCompiled
      ? path.join(__dirname, '..', '..', 'email-templates', 'templates')
      : path.join(__dirname, 'templates');
  }

  /**
   * Renders an email template with the given language and variables.
   * Variables are substituted as {{key}} in both subject and body; values are HTML-escaped in body.
   */
  render(
    templateName: string,
    lang: EmailTemplateLang,
    variables: Record<string, string>,
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

    const subject = substituteVariables(raw.subject, variables, true);
    const html = substituteVariables(raw.html, variables, true);
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
    try {
      text = fs.readFileSync(txtPath, 'utf-8').trim();
    } catch {
      text = undefined;
    }

    return { subject, html, text };
  }
}
