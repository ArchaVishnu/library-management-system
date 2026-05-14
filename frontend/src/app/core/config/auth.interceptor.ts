import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AUTH_KEYS } from '../../shared/utils';
import { UsersService } from '../services/users.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const userService = inject(UsersService);
  
  const token = localStorage.getItem(AUTH_KEYS.TOKEN);
  let authReq = req;

  if (token) {
    authReq = req.clone({
      headers: userService.getAuthHeaders() 
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Cleanup and redirect
        userService.logoutUser(); // Preferred: handle cleanup in your service
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};