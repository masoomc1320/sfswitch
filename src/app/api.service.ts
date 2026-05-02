import { Injectable } from '@angular/core';
import { ValidationRule } from './models';
import { AuthService } from './auth.service';
import { SalesforceService } from './salesforce.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private pending = new Map<string, boolean>();

  constructor(private auth: AuthService, private sf: SalesforceService) {}

  login(): Promise<void> {
    return this.auth.login();
  }

  async handleCallbackIfPresent(): Promise<string | null> {
    const res = await this.auth.handleRedirectCallback();
    if (!res) return null;
    if (res.ok) return null;
    return res.message;
  }

  async listValidationRules(): Promise<ValidationRule[]> {
    const rules = await this.sf.listAccountValidationRules();
    return rules.map((r) => {
      const desired = this.pending.get(r.id);
      const pending = desired !== undefined && desired !== r.active;
      return { ...r, pending, pendingActive: desired ?? null };
    });
  }

  async stageToggle(id: string, active: boolean): Promise<void> {
    this.pending.set(id, active);
  }

  async stageBulk(active: boolean): Promise<void> {
    const rules = await this.sf.listAccountValidationRules();
    rules.forEach((r) => this.pending.set(r.id, active));
  }

  async deploy(): Promise<void> {
    for (const [id, active] of this.pending.entries()) {
      await this.sf.updateValidationRuleActive(id, active);
    }
    this.pending.clear();
  }
}

