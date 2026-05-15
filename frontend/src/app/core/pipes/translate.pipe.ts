import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  // pure: false so Angular re-evaluates the pipe whenever
  // activeLocale signal changes at runtime (language switcher)
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private svc = inject(TranslateService);

  // params is optional — supports {{ 'key' | translate: { name: 'Arjun' } }}
  transform(key: string, params?: Record<string, string>): string {
    return this.svc.get(key, params);
  }
}