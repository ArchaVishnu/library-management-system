export type UserRole = 'user' | 'librarian' | 'admin';
export type UserClass = 'A' | 'B' | 'C' | 'D';
export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
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