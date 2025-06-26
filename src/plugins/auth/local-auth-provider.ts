import type { 
  AuthProvider, 
  User, 
  AuthSession, 
  SignInCredentials, 
  SignUpCredentials,
  AuthConfig 
} from './types';

export class LocalAuthProvider implements AuthProvider {
  id = 'local';
  name = 'Local Authentication';
  
  private storageKey = 'course_framework_auth';
  private sessionKey = 'course_framework_session';

  constructor(private config: AuthConfig = {}) {}

  async signIn(credentials: SignInCredentials): Promise<AuthSession> {
    const users = this.getStoredUsers();
    const user = users.find(u => u.email === credentials.email);

    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, you'd hash and compare passwords
    // For demo purposes, we'll just check if password is not empty
    if (!credentials.password) {
      throw new Error('Invalid password');
    }

    const session = this.createSession(user);
    this.storeSession(session);
    
    return session;
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthSession> {
    const users = this.getStoredUsers();
    
    // Check if user already exists
    if (users.some(u => u.email === credentials.email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: credentials.email,
      name: credentials.name,
      role: 'student',
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);
    this.storeUsers(users);

    const session = this.createSession(newUser);
    this.storeSession(session);

    return session;
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(this.sessionKey);
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user || null;
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (!stored) return null;

      const session = JSON.parse(stored);
      
      // Check if session is expired
      if (new Date(session.expiresAt) <= new Date()) {
        localStorage.removeItem(this.sessionKey);
        return null;
      }

      return {
        ...session,
        expiresAt: new Date(session.expiresAt),
        user: {
          ...session.user,
          createdAt: new Date(session.user.createdAt),
          updatedAt: new Date(session.user.updatedAt)
        }
      };
    } catch (error) {
      localStorage.removeItem(this.sessionKey);
      return null;
    }
  }

  async refreshSession(): Promise<AuthSession | null> {
    const currentSession = await this.getSession();
    if (!currentSession) return null;

    // Create a new session with extended expiry
    const newSession = this.createSession(currentSession.user);
    this.storeSession(newSession);
    
    return newSession;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const users = this.getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date()
    };

    users[userIndex] = updatedUser;
    this.storeUsers(users);

    // Update session if it exists
    const session = await this.getSession();
    if (session && session.user.id === userId) {
      const newSession = { ...session, user: updatedUser };
      this.storeSession(newSession);
    }

    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    const users = this.getStoredUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    this.storeUsers(filteredUsers);

    // Clear session if it belongs to the deleted user
    const session = await this.getSession();
    if (session && session.user.id === userId) {
      await this.signOut();
    }
  }

  async resetPassword(email: string): Promise<void> {
    const users = this.getStoredUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, you'd send an email with a reset link
    console.log(`Password reset email sent to ${email}`);
    
    // For demo purposes, just log success
    alert(`Password reset email sent to ${email} (demo mode)`);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const users = this.getStoredUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, you'd hash the new password
    console.log(`Password updated for user ${userId}`);
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const users = this.getStoredUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, you'd send a verification email
    console.log(`Verification email sent to ${user.email}`);
    
    // For demo purposes, just log success
    alert(`Verification email sent to ${user.email} (demo mode)`);
  }

  async verifyEmail(token: string): Promise<void> {
    // In a real implementation, you'd validate the token and mark email as verified
    console.log(`Email verified with token: ${token}`);
    
    // For demo purposes, mark current user as verified
    const session = await this.getSession();
    if (session) {
      await this.updateUser(session.user.id, { isVerified: true });
    }
  }

  private createSession(user: User): AuthSession {
    return {
      user,
      accessToken: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  private storeSession(session: AuthSession): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  private getStoredUsers(): User[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      return JSON.parse(stored).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }));
    } catch (error) {
      return [];
    }
  }

  private storeUsers(users: User[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(users));
  }
}