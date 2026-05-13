import { HttpClient } from '@angular/common/http';
import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { tap, Observable } from 'rxjs';
import { AuthResponse } from '../models/auth-response';
import { UserData, LoginDetails } from '../models/user';
import { APP_ENVIRONMENT } from '../tokens/env.tokens';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly env = inject(APP_ENVIRONMENT);
  private readonly baseUrl = this.env.apiBaseUrl;

  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  // State Management via readonly Signal exposure
  private readonly _tokenSignal = signal<string | null>(this.getInitialToken());
  public readonly token = this._tokenSignal.asReadonly();

  /**
   * Registers a new account profile
   */
  public registerUser(data: UserData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, data)
      .pipe(tap((res) => this.saveToken(res?.accessToken)));
  }

  /**
   * Validates credentials and initializes sessions
   */
  public loginUser(data: LoginDetails): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, data)
      .pipe(tap((res) => this.saveToken(res?.accessToken)));
  }

  /**
   * Cleans current workspace sessions cleanly
   */
  public logoutUser(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('lms_token');
    }
    this._tokenSignal.set(null);
  }

  /**
   * Safely loads token values on initialization under browser context
   */
  private getInitialToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('lms_token');
    }
    return null;
  }

  /**
   * Persists authentication data strictly matching type structures
   */
  private saveToken(token: string | undefined | null): void {
    if (!token) {
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lms_token', token);
    }
    this._tokenSignal.set(token);
  }
}
