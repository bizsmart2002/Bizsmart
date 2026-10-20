import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
  role: { id: number; name: string };
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  findAll() {
    return this.http.get<AppUser[]>(`${environment.apiUrl}/users`);
  }

  create(payload: { name: string; email: string; password: string; roleName: string }) {
    return this.http.post<AppUser>(`${environment.apiUrl}/users`, payload);
  }

  updateRole(id: number, roleName: string) {
    return this.http.patch<AppUser>(`${environment.apiUrl}/users/${id}`, { roleName });
  }

  deactivate(id: number) {
    return this.http.patch(`${environment.apiUrl}/users/${id}/deactivate`, {});
  }
}
