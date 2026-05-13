import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  private readonly baseUrl = 'http://localhost:3000';
  private tokenSignal = signal<string | null>(
    localStorage.getItem('lms_token'),
  );

  /**
   * Header Builder with Reactive Token Resolution
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenSignal();
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}
