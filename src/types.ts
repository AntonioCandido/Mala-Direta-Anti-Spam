export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromName: string;
  fromEmail: string;
  subject: string;
}

export interface AntiSpamConfig {
  minDelay: number; // in seconds
  maxDelay: number; // in seconds
  batchSize: number; // number of emails before a batch pause
  batchPauseTime: number; // pause time in minutes
}

export interface Recipient {
  id: string;
  email: string;
  [key: string]: any; // dynamic columns
}

export interface VariableMapping {
  placeholder: string; // e.g. "nome"
  columnName: string; // e.g. "Nome do Cliente"
}

export interface LogEntry {
  timestamp: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface CampaignStatus {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  total: number;
  sent: number;
  failed: number;
  currentEmail: string;
  estimatedTimeRemaining: number; // in seconds
  logs: LogEntry[];
  startTime: string | null;
  templateName?: string;
}

export interface CampaignHistory {
  id: string;
  date: string;
  subject: string;
  templateName: string;
  template: string;
  total: number;
  sent: number;
  failed: number;
  status: 'completed' | 'cancelled';
  recipients: Recipient[];
}
