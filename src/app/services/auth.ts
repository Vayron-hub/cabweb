import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  lastConnection?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private users: User[] = [
    { id: 1, username: 'admin', role: 'admin', lastConnection: '2025-07-21 09:30' },
    { id: 2, username: 'Alejandro', role: 'user', lastConnection: '2025-07-21 14:22' },
    { id: 3, username: 'Montoya', role: 'user', lastConnection: '2025-07-21 11:37' },
    { id: 4, username: 'Vayron', role: 'user', lastConnection: '2025-07-21 10:54' }
  ];

  constructor() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(username: string, password: string): boolean {
    const user = this.users.find(u => u.username === username);
    if (user && password === '123456') { 
      const loggedUser = { ...user, lastConnection: new Date().toLocaleString() };
      localStorage.setItem('currentUser', JSON.stringify(loggedUser));
      this.currentUserSubject.next(loggedUser);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  getAllUsers(): User[] {
    return this.users;
  }
}
