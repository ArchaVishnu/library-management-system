import { HttpClient } from '@angular/common/http';
import { Injectable, signal, inject } from '@angular/core';
import { tap, Observable } from 'rxjs';
import { AuthResponse } from '../models/auth-response';
import { APP_ENVIRONMENT } from '../tokens/env.tokens';
import { UserData, LoginDetails, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly env = inject(APP_ENVIRONMENT);
  private readonly baseUrl = this.env.apiBaseUrl;

  private readonly http = inject(HttpClient);

  public tokenSignal = signal<string | null>(localStorage.getItem('lms_token'));

  public registerUser(data:UserData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data).pipe(
      tap(res => this.saveSession(res.accessToken, res.user.role))
    );
  }

  public loginUser(data:LoginDetails): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data).pipe(
      tap(res => this.saveSession(res.accessToken, res.user.role))
    );
  }

  public logoutUser(): void {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('user_role');
    this.tokenSignal.set(null);
  }

  private saveSession(token: string, role: UserRole): void {
    if (token) {
      localStorage.setItem('lms_token', token);
      localStorage.setItem('user_role', role);
      this.tokenSignal.set(token);
    }
  }

  
}
