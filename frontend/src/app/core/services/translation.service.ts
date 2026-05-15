import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslateService {

  // Active locale's key→value map (already has defaults baked in from script)
  private translations = signal<Record<string, string>>({});

  // en_us is always kept as the safety net for keys missing in other locales
  private fallback = signal<Record<string, string>>({});

  readonly activeLocale = signal<string>('en_us');
  readonly isLoaded = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  // Called once via APP_INITIALIZER in app.config.ts
  async loadLocale(locale: string): Promise<void> {
    this.isLoaded.set(false);

    // Always load en_us as fallback first (only once)
    if (!Object.keys(this.fallback()).length) {
      try {
        const fb = await firstValueFrom(
          this.http.get<Record<string, string>>('/assets/i18n/en_us.json')
        );
        this.fallback.set(fb);
      } catch {
        console.error('[i18n] Failed to load en_us.json — translations unavailable.');
        this.isLoaded.set(true);
        return;
      }
    }

    if (locale === 'en_us') {
      // en_us json already loaded as fallback — reuse it
      this.translations.set(this.fallback());
    } else {
      try {
        const t = await firstValueFrom(
          this.http.get<Record<string, string>>(`/assets/i18n/${locale}.json`)
        );
        // Each locale JSON already has defaults baked in by the script,
        // but we still spread fallback first in case new keys were added
        // to en_us after the last extract-i18n run
        this.translations.set({ ...this.fallback(), ...t });
      } catch {
        console.warn(`[i18n] Locale "${locale}" not found. Falling back to en_us.`);
        this.translations.set(this.fallback());
      }
    }

    this.activeLocale.set(locale);
    this.isLoaded.set(true);
  }

  // Switch locale at runtime (e.g. language picker in UI)
  switchLocale(locale: string): Promise<void> {
    return this.loadLocale(locale);
  }

  // Resolve a key — used by TranslatePipe and directly in TS
  // Supports {{param}} interpolation: get('msg', { name: 'Arjun' })
  get(key: string, params?: Record<string, string>): string {
    let value =
      this.translations()[key] ?? // active locale (default already baked in)
      this.fallback()[key] ??     // en_us safety net
      key;                        // last resort: return the key itself so UI never breaks

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replaceAll(`{{${k}}}`, v);
      }
    }

    return value;
  }
}