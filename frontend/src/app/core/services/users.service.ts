import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Injectable,
  signal,
  inject,
  computed,
  NgZone,
  effect,
} from '@angular/core';
import { tap, Observable, of, fromEvent, filter } from 'rxjs';
import { AuthResponse } from '../models/auth-response';
import { APP_ENVIRONMENT } from '../tokens/env.tokens';
import { UserData, LoginDetails, User } from '../models/user.model';
import { AUTH_KEYS } from '../../shared/utils/index';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly env = inject(APP_ENVIRONMENT);
  private readonly baseUrl = this.env.apiBaseUrl;

  public tokenSignal = signal<string | null>(
    localStorage.getItem(AUTH_KEYS.TOKEN),
  );
  public userSignal = signal<User | null>(this.getStoredUser());

  public isLoggedIn = computed(() => {
    const token = this.tokenSignal();
    if (!token) return false;
    return !this.isTokenExpired(token);
  });

  public isAdmin = computed(() => this.userSignal()?.role === 'admin');
  public getAuthHeaders(): HttpHeaders {
    const token = this.tokenSignal();
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  
  constructor(
    private http: HttpClient,
    private zone: NgZone,
  ) {
    effect(() => {
      const token = this.tokenSignal();
      const user = this.userSignal();

      // Whenever either signal changes, this block executes automatically
      if (token && user) {
        localStorage.setItem(AUTH_KEYS.TOKEN, token);
        localStorage.setItem(AUTH_KEYS.INFO, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_KEYS.TOKEN);
        localStorage.removeItem(AUTH_KEYS.INFO);
      }
    });

    this.listenToOtherTabs();
  }

  public registerUser(data: UserData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, data)
      .pipe(tap((res) => this.saveSession(res.accessToken, res.user)));
  }

  public loginUser(data: LoginDetails): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, data)
      .pipe(tap((res) => this.saveSession(res.accessToken, res.user)));
  }
  

  public logoutUser(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  public initializeAuth(): Observable<any> {
    const token = this.tokenSignal();

    if (!token || this.isTokenExpired(token)) {
      this.logoutUser(); // Clean sweep if token died while browser was closed
    }

    return of(null);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true; // Malformed token

      // Decode the payload base64 chunk natively
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
      );
      console.log(parts[1], payload);

      if (!payload.exp) return false; // Token does not expire

      const expirationDate = payload.exp * 1000; // Convert seconds to milliseconds
      return Date.now() >= expirationDate; // True if current time has passed expiration
    } catch {
      return true; // Consider invalid on processing crash
    }
  }

  private listenToOtherTabs(): void {
    fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        filter(
          (event) =>
            event.key === AUTH_KEYS.TOKEN || event.key === AUTH_KEYS.INFO,
        ),
      )
      .subscribe(() => {
        this.zone.run(() => {
          const token = localStorage.getItem(AUTH_KEYS.TOKEN);
          const userStr = localStorage.getItem(AUTH_KEYS.INFO);

          if (!token) {
            this.logoutUser();
          } else if (userStr) {
            this.tokenSignal.set(token);
            this.userSignal.set(JSON.parse(userStr));
          }
        });
      });
  }

  private saveSession(token: string, user: User): void {
    if (token) {
      this.tokenSignal.set(token);
      this.userSignal.set(user);
    }
  }
  
  private getStoredUser(): User | null {
    const user = localStorage.getItem(AUTH_KEYS.INFO);
    return user ? JSON.parse(user) : null;
  }
}
