import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';
import { ApiError, ValidationRule } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  rules: ValidationRule[] = [];
  loading = false;
  error: ApiError | null = null;
  authError: string | null = null;

  search = '';

  constructor(private api: ApiService) {
    this.init();
  }

  private async init(): Promise<void> {
    const authError = await this.api.handleCallbackIfPresent();
    if (authError) this.authError = authError;
    await this.refresh();
  }

  get pendingCount(): number {
    return this.rules.filter((r) => r.pending).length;
  }

  get filteredRules(): ValidationRule[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.rules;
    return this.rules.filter((r) => (r.name + ' ' + r.description).toLowerCase().includes(q));
  }

  async refresh(): Promise<void> {
    this.error = null;
    this.loading = true;
    try {
      const list = await this.api.listValidationRules();
      this.rules = list;
    } catch (e: any) {
      this.error = this.normalizeError(e);
    } finally {
      this.loading = false;
    }
  }

  login(): void {
    void this.api.login();
  }

  async toggle(rule: ValidationRule, desired: boolean): Promise<void> {
    this.error = null;
    const prev = this.rules;
    this.rules = prev.map((r) => (r.id === rule.id ? { ...r, pendingActive: desired, pending: desired !== r.active } : r));
    try {
      await this.api.stageToggle(rule.id, desired);
    } catch (e: any) {
      this.rules = prev;
      this.error = this.normalizeError(e);
    }
  }

  async bulkStage(active: boolean): Promise<void> {
    this.error = null;
    this.loading = true;
    try {
      await this.api.stageBulk(active);
      await this.refresh();
    } catch (e: any) {
      this.error = this.normalizeError(e);
    } finally {
      this.loading = false;
    }
  }

  async deploy(): Promise<void> {
    this.error = null;
    this.loading = true;
    try {
      await this.api.deploy();
      await this.refresh();
    } catch (e: any) {
      this.error = this.normalizeError(e);
    } finally {
      this.loading = false;
    }
  }

  private normalizeError(e: any): ApiError {
    const err = e?.error;
    if (err?.message) return err as ApiError;
    return { message: 'Request failed', details: e?.message ?? String(e) };
  }
}

