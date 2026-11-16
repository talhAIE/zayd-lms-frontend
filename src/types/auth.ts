export type UserRole = 'student' | 'teacher' | 'admin' | 'zayd_super_admin' | 'zayd_school_admin' | 'nafs_super_admin' | 'nafs_school_admin';

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
