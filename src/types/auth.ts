export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: UserRole;
    username: string;
    phoneNumber: string;
    schoolCategory: string;
  }
  
  export interface LoginCredentials {
    username: string;
    password: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }
