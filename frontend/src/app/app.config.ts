import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { APP_ENVIRONMENT } from './core/tokens/env.tokens';
import { environment } from '../environments/environment.development';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UsersService } from './core/services/users.service';
import { errorInterceptor } from './core/config/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([errorInterceptor]), // Ensures 401s intercept background expiry
    ),
    provideAppInitializer(() => {
      const userService = inject(UsersService);

      return firstValueFrom(userService.initializeAuth());
    }),
    { provide: APP_ENVIRONMENT, useValue: environment },
  ],
};
