import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UsersService } from '../services/users.service';
import { UserRole } from '../models/user.model';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userService = inject(UsersService);

  // 1. Read directly from your central, single source of truth signals
  const token = userService.tokenSignal();
  const user = userService.userSignal();

  // 2. Core Authentication Check
  if (!token || !user) {
    // Save the intended URL so you can redirect them back after successful login
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // 3. Extract expected roles from route configuration data array
  const expectedRoles = route.data['expectedRoles'] as UserRole[];

  // If no explicit restrictions are set on the route, allow access
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  // 4. Extract and check the role from the central user state signal
  const userRole = user.role as UserRole;
  if (expectedRoles.includes(userRole)) {
    return true;
  }

  // 5. Explicitly handle authorization failure (Access Denied / 403)
  router.navigate(['/403']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(UsersService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/books']);
  return false;
};