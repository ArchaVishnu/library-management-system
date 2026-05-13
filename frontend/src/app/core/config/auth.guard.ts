import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UsersService } from '../services/users.service';
import { UserRole } from '../models/user.model';

export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UsersService);
  const router = inject(Router);

  const token = userService.tokenSignal();

  // 1. Core Authentication Check
  if (!token) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // 2. Extract expected roles from route configuration data array
  const expectedRoles = route.data['expectedRoles'] as UserRole[];
  
  // If no explicit restrictions are set on the route, allow access
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  // 3. Decode token or extract cached role from state
  const userRole = localStorage.getItem('user_role') as UserRole;

  if (expectedRoles.includes(userRole)) {
    return true;
  }

  // If user role doesn't match the route requirements, block and redirect
  router.navigate(['/dashboard']);
  return false;
};