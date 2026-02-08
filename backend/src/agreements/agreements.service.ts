import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const AGREEMENTS_DIR = 'agreements';
const TERMS_DIR = 'terms-of-service';
const PRIVACY_DIR = 'privacy-policy';

export interface CurrentVersions {
  termsVersion: string | null;
  privacyPolicyVersion: string | null;
}

@Injectable()
export class AgreementsService {
  /** Base path: backend/src/agreements when running from backend root. */
  private getBasePath(): string {
    const fromSrc = path.join(process.cwd(), 'src', AGREEMENTS_DIR);
    if (fs.existsSync(fromSrc)) return fromSrc;
    const fromDist = path.join(process.cwd(), 'dist', 'src', AGREEMENTS_DIR);
    if (fs.existsSync(fromDist)) return fromDist;
    return path.join(process.cwd(), 'src', AGREEMENTS_DIR);
  }

  /** Get latest version (filename without .md) from a subdir, or null if empty. */
  private getLatestVersion(subdir: string): string | null {
    const dir = path.join(this.getBasePath(), subdir);
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    if (files.length === 0) return null;
    const versions = files.map((f) => f.replace(/\.md$/, '')).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
      return b.localeCompare(a);
    });
    return versions[0] ?? null;
  }

  getCurrentVersions(): CurrentVersions {
    return {
      termsVersion: this.getLatestVersion(TERMS_DIR),
      privacyPolicyVersion: this.getLatestVersion(PRIVACY_DIR),
    };
  }

  getTermsContent(version: string): string {
    const filePath = path.join(this.getBasePath(), TERMS_DIR, `${version}.md`);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Terms of service version ${version} not found`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  getPrivacyPolicyContent(version: string): string {
    const filePath = path.join(this.getBasePath(), PRIVACY_DIR, `${version}.md`);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Privacy policy version ${version} not found`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  }
}
