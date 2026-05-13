import { InjectionToken } from '@angular/core';
import { AppEnvironment } from '../models/env.model';

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
