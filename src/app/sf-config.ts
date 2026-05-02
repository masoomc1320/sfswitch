import { InjectionToken } from '@angular/core';

export type SfConfig = {
  clientId: string;
  consumerSecret: string;
  redirectUri: string;
  authBaseUrl: string; 
  apiVersion: string;
};

export const SF_CONFIG = new InjectionToken<SfConfig>('SF_CONFIG');

