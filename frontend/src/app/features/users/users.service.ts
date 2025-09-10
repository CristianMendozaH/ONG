import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'tech' | 'user';
  active: boolean;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = `${environment.apiUrl}/users`;
  constructor(private http: HttpClient) {}
  list(): Observable<User[]> { return this.http.get<User[]>(this.base); }
}
