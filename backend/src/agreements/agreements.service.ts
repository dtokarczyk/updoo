import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AGREEMENTS_DIR, TERMS_DIR, PRIVACY_DIR } from './constants';
import type { CurrentVersions } from './types';

export type { CurrentVersions } from './types';

@Injectable()
export class AgreementsService {
  /** Base path: directory containing terms-of-service/ and privacy-policy/. Works from dist/ (with copied .md assets) or from src/. */
  private getBasePath(): string {
    // 1) Same dir as this file has terms-of-service/ (e.g. dist/src/agreements or legacy dist/agreements)
    const sameDir = path.join(__dirname, TERMS_DIR);
    if (fs.existsSync(sameDir)) return __dirname;
    // 2) Nest copies assets to dist/agreements/ - when __dirname is dist/src/agreements, dist/agreements is sibling of dist/src
    const distAgreements = path.join(__dirname, '..', '..', AGREEMENTS_DIR);
    if (fs.existsSync(path.join(distAgreements, TERMS_DIR)))
      return distAgreements;
    // 3) Source tree: backend/src/agreements (when __dirname is dist/src/agreements)
    const fromSrc = path.join(__dirname, '..', '..', 'src', AGREEMENTS_DIR);
    if (fs.existsSync(path.join(fromSrc, TERMS_DIR))) return fromSrc;
    // 4) CWD-based (e.g. running from backend/ or monorepo root)
    const fromCwd = path.join(process.cwd(), 'src', AGREEMENTS_DIR);
    if (fs.existsSync(path.join(fromCwd, TERMS_DIR))) return fromCwd;
    const fromCwdBackend = path.join(
      process.cwd(),
      'backend',
      'src',
      AGREEMENTS_DIR,
    );
    if (fs.existsSync(path.join(fromCwdBackend, TERMS_DIR)))
      return fromCwdBackend;
    return fromSrc;
  }

  /** Get latest version (filename without .md) from a subdir, or null if empty. */
  private getLatestVersion(subdir: string): string | null {
    const dir = path.join(this.getBasePath(), subdir);
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    if (files.length === 0) return null;
    const versions = files
      .map((f) => f.replace(/\.md$/, ''))
      .sort((a, b) => {
        const na = parseInt(a, 10);
        const nb = parseInt(b, 10);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
        return b.localeCompare(a);
      });
    return versions[0] ?? null;
  }

  /** Used internally by guard and auth (register/accept). Not exposed to API. */
  getCurrentVersions(): CurrentVersions {
    return {
      termsVersion: this.getLatestVersion(TERMS_DIR),
      privacyPolicyVersion: this.getLatestVersion(PRIVACY_DIR),
    };
  }

  /** Current terms of service markdown for display. Returns empty string if no file. */
  getCurrentTermsContent(): string {
    const version = this.getLatestVersion(TERMS_DIR);
    if (version == null) return '';
    const filePath = path.join(this.getBasePath(), TERMS_DIR, `${version}.md`);
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf-8');
  }

  /** Current privacy policy markdown for display. Returns empty string if no file. */
  getCurrentPrivacyPolicyContent(): string {
    const version = this.getLatestVersion(PRIVACY_DIR);
    if (version == null) return '';
    const filePath = path.join(
      this.getBasePath(),
      PRIVACY_DIR,
      `${version}.md`,
    );
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf-8');
  }
}
