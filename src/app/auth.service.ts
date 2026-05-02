import { Inject, Injectable } from '@angular/core';
import { SF_CONFIG, SfConfig } from './sf-config';

type TokenResponse = {
  access_token: string;
  instance_url: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(@Inject(SF_CONFIG) private cfg: SfConfig) {}

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('sf_access_token') && !!sessionStorage.getItem('sf_instance_url');
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('sf_access_token');
  }

  getInstanceUrl(): string | null {
    return sessionStorage.getItem('sf_instance_url');
  }

  logout(): void {
    sessionStorage.removeItem('sf_access_token');
    sessionStorage.removeItem('sf_instance_url');
    sessionStorage.removeItem('sf_state');
    sessionStorage.removeItem('sf_pkce_verifier');
  }

  async login(): Promise<void> {
    const state = this.randomString();
    const verifier = this.randomString();
    const challenge = await this.sha256Base64Url(verifier);

    sessionStorage.setItem('sf_state', state);
    sessionStorage.setItem('sf_pkce_verifier', verifier);

    const url =
      this.trimSlash(this.cfg.authBaseUrl) +
      '/services/oauth2/authorize' +
      '?response_type=code' +
      `&client_id=${encodeURIComponent(this.cfg.clientId)}` +
      `&redirect_uri=${encodeURIComponent(this.cfg.redirectUri)}` +
      `&scope=${encodeURIComponent('api refresh_token')}` +
      `&state=${encodeURIComponent(state)}` +
      `&code_challenge=${encodeURIComponent(challenge)}` +
      '&code_challenge_method=S256';

    window.location.assign(url);
  }

  async handleRedirectCallback(): Promise<{ ok: true } | { ok: false; message: string } | null> {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const err = url.searchParams.get('error');
    const errDesc = url.searchParams.get('error_description');

    if (err) return { ok: false, message: `${err}${errDesc ? ': ' + errDesc : ''}` };
    if (!code && !state) return null;
    if (!code) return { ok: false, message: 'Missing authorization code' };

    const expectedState = sessionStorage.getItem('sf_state');
    const verifier = sessionStorage.getItem('sf_pkce_verifier');
    sessionStorage.removeItem('sf_state');
    sessionStorage.removeItem('sf_pkce_verifier');

    if (!expectedState || !state || expectedState !== state) return { ok: false, message: 'Invalid state' };
    if (!verifier) return { ok: false, message: 'Missing PKCE verifier' };

    try {
      const token = await this.exchangeCodeForToken(code, verifier);
      sessionStorage.setItem('sf_access_token', token.access_token);
      sessionStorage.setItem('sf_instance_url', token.instance_url);
      // clean URL (remove ?code=...)
      window.history.replaceState({}, document.title, url.origin + url.pathname);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, message: e?.message ?? 'Token exchange failed' };
    }
  }

  private async exchangeCodeForToken(code: string, verifier: string): Promise<TokenResponse> {
    const tokenUrl = this.trimSlash(this.cfg.authBaseUrl) + '/services/oauth2/token';

    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('client_id', this.cfg.clientId);
    body.set('client_secret', this.cfg.consumerSecret);
    body.set('redirect_uri', this.cfg.redirectUri);
    body.set('code', code);
    body.set('code_verifier', verifier);

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(text || `Token request failed (${res.status})`);
    }

    if (!res.ok) {
      throw new Error(json?.error_description || json?.error || `Token request failed (${res.status})`);
    }

    return json as TokenResponse;
  }

  private randomString(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return this.base64Url(bytes);
  }

  private async sha256Base64Url(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64Url(new Uint8Array(digest));
  }

  private base64Url(bytes: Uint8Array): string {
    const bin = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    const b64 = btoa(bin);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private trimSlash(s: string): string {
    return s.endsWith('/') ? s.slice(0, -1) : s;
  }
}

