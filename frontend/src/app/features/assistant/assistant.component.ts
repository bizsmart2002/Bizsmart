import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AssistantService } from './assistant.service';

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
}

const SUGGESTIONS = [
  '¿Qué productos debería reabastecer?',
  '¿Cuáles son las tendencias de ventas?',
  '¿Cómo está el inventario?',
];

// HU12/HU13: recomendaciones y agente inteligente (simulado por reglas
// sobre datos reales, según lo acordado - no inventa cifras).
@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="page-container">
      <h1>Asistente de negocio</h1>
      <p class="hint">Responde con base en datos reales del negocio (sin inventar cifras).</p>

      <div class="chips">
        @for (s of suggestions; track s) {
          <mat-chip (click)="ask(s)">{{ s }}</mat-chip>
        }
      </div>

      <mat-card class="chat-card">
        <mat-card-content class="chat-body">
          @for (m of messages(); track $index) {
            <div class="message" [class.user]="m.role === 'user'">
              <span class="bubble">{{ m.text }}</span>
            </div>
          }
          @if (loading()) {
            <div class="message"><span class="bubble">Pensando…</span></div>
          }
        </mat-card-content>
        <div class="input-row">
          <mat-form-field appearance="outline" class="grow">
            <input matInput [(ngModel)]="question" placeholder="Escribe tu pregunta..." (keyup.enter)="ask()" />
          </mat-form-field>
          <button mat-icon-button color="primary" (click)="ask()"><mat-icon>send</mat-icon></button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .hint { color: rgba(0,0,0,0.6); }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .chat-card { display: flex; flex-direction: column; height: 60vh; }
    .chat-body { flex: 1; overflow-y: auto; padding: 8px; }
    .message { display: flex; margin: 8px 0; }
    .message.user { justify-content: flex-end; }
    .bubble { background: #eee; padding: 8px 12px; border-radius: 12px; max-width: 70%; }
    .message.user .bubble { background: #3f51b5; color: white; }
    .input-row { display: flex; align-items: center; gap: 8px; padding: 8px; }
    .grow { flex: 1; margin-bottom: -1.25em; }
  `],
})
export class AssistantComponent {
  suggestions = SUGGESTIONS;
  question = '';
  messages = signal<ChatMessage[]>([]);
  loading = signal(false);

  constructor(private readonly service: AssistantService) {}

  ask(preset?: string): void {
    const text = (preset ?? this.question).trim();
    if (!text) return;

    this.messages.update((m) => [...m, { role: 'user', text }]);
    this.question = '';
    this.loading.set(true);

    this.service.ask(text).subscribe({
      next: (res) => {
        this.messages.update((m) => [...m, { role: 'agent', text: res.answer }]);
        this.loading.set(false);
      },
      error: () => {
        this.messages.update((m) => [...m, { role: 'agent', text: 'No pude procesar tu pregunta en este momento.' }]);
        this.loading.set(false);
      },
    });
  }
}
