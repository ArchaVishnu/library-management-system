import { FormControl } from "@angular/forms";

export type UserRole = 'user' | 'admin';
export type UserClass = 'A' | 'B' | 'C' | 'D';
export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface UserData {
  email: string;
  password: string;
  role: UserRole;
  userClass: UserClass;
}
export interface LoginDetails {
  email: string;
  password: string;
}

export interface LoginFormBuilder {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
}