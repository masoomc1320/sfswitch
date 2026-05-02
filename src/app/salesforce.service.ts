import { Inject, Injectable } from '@angular/core';
import { SF_CONFIG, SfConfig } from './sf-config';
import { AuthService } from './auth.service';
import { ValidationRule } from './models';

type ToolingQueryResult<T> = {
  records: T[];
};

@Injectable({ providedIn: 'root' })
export class SalesforceService {
  constructor(
    @Inject(SF_CONFIG) private cfg: SfConfig,
    private auth: AuthService
  ) {}

  async listAccountValidationRules(): Promise<ValidationRule[]> {
    const instanceUrl = this.requireInstanceUrl();
    const accessToken = this.requireToken();
    const apiBase = `${instanceUrl}/services/data/v${this.cfg.apiVersion}`;

    const entityDef = await this.toolingQuery<{ DurableId: string }>(
      apiBase,
      accessToken,
      "SELECT DurableId FROM EntityDefinition WHERE QualifiedApiName = 'Account' LIMIT 1"
    );
    const durableId = entityDef.records?.[0]?.DurableId;
    if (!durableId) throw new Error('Account EntityDefinition not found');

    const rules = await this.toolingQuery<{
      Id: string;
      ValidationName: string;
      Description: string | null;
      Active: boolean;
    }>(
      apiBase,
      accessToken,
      `SELECT Id, ValidationName, Description, Active FROM ValidationRule WHERE EntityDefinitionId = '${durableId}' ORDER BY ValidationName`
    );

    return (rules.records || []).map((r) => ({
      id: r.Id,
      name: r.ValidationName,
      description: r.Description || '',
      active: !!r.Active,
      pending: false,
      pendingActive: null,
    }));
  }

  async updateValidationRuleActive(id: string, active: boolean): Promise<void> {
    const instanceUrl = this.requireInstanceUrl();
    const accessToken = this.requireToken();
    const apiBase = `${instanceUrl}/services/data/v${this.cfg.apiVersion}`;

    const url = `${apiBase}/tooling/sobjects/ValidationRule/${encodeURIComponent(id)}`;
    await this.request(url, accessToken, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Active: active }),
    });
  }

  private async toolingQuery<T>(apiBase: string, token: string, soql: string): Promise<ToolingQueryResult<T>> {
    const url = `${apiBase}/tooling/query?q=${encodeURIComponent(soql)}`;
    return await this.request(url, token);
  }

  private async request(url: string, token: string, init: RequestInit = {}): Promise<any> {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });

    if (res.status === 401) {
      this.auth.logout();
      throw new Error('Session expired. Please login again.');
    }

    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `Request failed (${res.status})`);
    }
    return text ? JSON.parse(text) : null;
  }

  private requireToken(): string {
    const t = this.auth.getAccessToken();
    if (!t) throw new Error('Not logged in');
    return t;
  }

  private requireInstanceUrl(): string {
    const u = this.auth.getInstanceUrl();
    if (!u) throw new Error('Not logged in');
    return u;
  }
}

