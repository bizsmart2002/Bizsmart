import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AgentResponse {
  answer: string;
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class AssistantService {
  constructor(private http: HttpClient) {}

  ask(question: string) {
    return this.http.post<AgentResponse>(`${environment.apiUrl}/agent/ask`, { question });
  }

  restockRecommendations() {
    return this.http.get<any[]>(`${environment.apiUrl}/ai/restock-recommendations`);
  }
}
