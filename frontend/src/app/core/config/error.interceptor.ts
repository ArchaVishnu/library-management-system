import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { UsersService } from "../services/users.service";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(UsersService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logoutUser();
        
        // 2. Redirect to login with a query parameter to show a notification
        router.navigate(['/login'], { queryParams: { expired: 'true' } });
      }
      
      // Pass the error down to individual component handlers if needed
      return throwError(() => error);
    })
  );
};