// Authentication plugin types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: 'student' | 'instructor' | 'admin';
  isVerified?: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthConfig {
  // Provider-specific configuration
  [key: string]: any;
}

export interface AuthProvider {
  id: string;
  name: string;
  
  // Core auth methods
  signIn(credentials: SignInCredentials): Promise<AuthSession>;
  signUp(credentials: SignUpCredentials): Promise<AuthSession>;
  signOut(): Promise<void>;
  
  // Session management
  getCurrentUser(): Promise<User | null>;
  getSession(): Promise<AuthSession | null>;
  refreshSession(): Promise<AuthSession | null>;
  
  // User management
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  
  // Password management
  resetPassword(email: string): Promise<void>;
  updatePassword(userId: string, newPassword: string): Promise<void>;
  
  // Verification
  sendVerificationEmail(userId: string): Promise<void>;
  verifyEmail(token: string): Promise<void>;
  
  // OAuth providers (optional)
  signInWithProvider?(provider: 'google' | 'github' | 'discord'): Promise<AuthSession>;
}

export interface AuthEvents {
  'user:signedIn': { user: User };
  'user:signedOut': { userId: string };
  'user:signedUp': { user: User };
  'user:updated': { user: User };
  'user:deleted': { userId: string };
  'session:refreshed': { session: AuthSession };
  'session:expired': { userId: string };
}