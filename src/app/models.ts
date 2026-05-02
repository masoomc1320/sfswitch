export type ApiError = {
  message: string;
  details?: string;
  timestamp?: string;
};

export type ValidationRule = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  pending: boolean;
  pendingActive: boolean | null;
};

