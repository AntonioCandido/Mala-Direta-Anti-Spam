import { CampaignStatus, CampaignHistory } from './types';

// Centralização das rotas da API interna do servidor
export const API_ROUTES = {
  TEST_SMTP: '/api/test-smtp',
  CHECK_DNS: '/api/check-dns',
  CAMPAIGN_START: '/api/campaign/start',
  CAMPAIGN_STATUS: '/api/campaign/status',
  CAMPAIGN_TOGGLE: '/api/campaign/toggle',
  CAMPAIGN_CANCEL: '/api/campaign/cancel',
  CAMPAIGN_RESET: '/api/campaign/reset',
  CAMPAIGN_HISTORY: '/api/campaign/history',
  CAMPAIGN_HISTORY_ENTRY: (id: string) => `/api/campaign/history/${id}`,
};

// Interface genérica para respostas da API, combinada com os campos do tipo T
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} & T;

// Tipagens estritas para respostas específicas da API
export interface SmtpTestResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface DnsCheckResponse {
  success: boolean;
  results: {
    domain: string;
    spf: { status: 'valid' | 'invalid' | 'missing'; record: string | null; message: string };
    dkim: { status: 'valid' | 'missing'; record: string | null; message: string };
    dmarc: { status: 'valid' | 'missing'; record: string | null; message: string };
    mx: { status: 'valid' | 'missing'; records: string[]; message: string };
  };
  error?: string;
}

export interface CampaignStartResponse {
  success: boolean;
  campaignId: string;
  status: CampaignStatus;
  error?: string;
}

export type CampaignStatusResponse = CampaignStatus;

export interface CampaignToggleResponse {
  success: boolean;
  status: 'running' | 'paused';
  error?: string;
}

export interface CampaignCancelResponse {
  success: boolean;
  message: string;
  finalState?: CampaignStatus;
  error?: string;
}

export interface CampaignResetResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface HistoryListResponse {
  success: boolean;
  history: CampaignHistory[];
  error?: string;
}

export interface HistoryDeleteResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Utilitário defensivo de chamada de API que valida res.ok e Content-Type.
 * Impede quebras de JSON.parse em respostas de erro que retornam HTML (como fallbacks do Vercel).
 */
export async function safeApiCall<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<Partial<T>>> {
  const workspaceId = localStorage.getItem('mala_direta_workspace') || 'default';
  
  // Normalização do caminho das rotas de backend do Vercel
  let targetUrl = url;
  if (targetUrl.startsWith('/api/') && !targetUrl.startsWith('/api/server/')) {
    targetUrl = targetUrl.replace('/api/', '/api/server/');
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('X-Workspace-Id')) {
    headers.set('X-Workspace-Id', workspaceId);
  }
  
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const updatedOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(targetUrl, updatedOptions);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Tratamento defensivo para erros do servidor (status fora da faixa 2xx)
    if (!response.ok) {
      let errorMessage = `Erro do servidor (Status ${response.status})`;
      
      if (isJson) {
        try {
          const errData = await response.json();
          errorMessage = errData.error || errData.message || errorMessage;
        } catch {
          // Fallback se falhar no parse
        }
      } else {
        try {
          const text = await response.text();
          if (text.includes('<html') || text.includes('<HTML')) {
            errorMessage = `O servidor retornou uma página de erro HTML (Status ${response.status}).`;
          } else if (text.trim()) {
            errorMessage = text.trim().slice(0, 180);
          }
        } catch {
          // Ignora se não puder ler o corpo do texto
        }
      }
      
      return {
        success: false,
        error: errorMessage
      } as any;
    }

    // Tratamento defensivo se a requisição deu 200 OK mas não retornou JSON
    if (!isJson) {
      try {
        const text = await response.text();
        if (text.includes('<html') || text.includes('<HTML')) {
          return {
            success: false,
            error: 'O servidor retornou uma página HTML em vez de um objeto JSON válido.'
          } as any;
        }
        return {
          success: false,
          error: `Resposta com formato inválido (não é JSON): ${text.trim().slice(0, 150)}`
        } as any;
      } catch {
        return {
          success: false,
          error: 'Resposta de sucesso recebida, mas o formato não é JSON e não pôde ser lido.'
        } as any;
      }
    }

    // Parse seguro do JSON
    try {
      const data = await response.json();
      return {
        success: data.success !== false,
        ...data,
        data: data
      } as any;
    } catch (e: any) {
      return {
        success: false,
        error: `Falha ao interpretar a resposta JSON do servidor: ${e.message}`
      } as any;
    }
  } catch (e: any) {
    return {
      success: false,
      error: `Erro de rede ou conexão com o servidor: ${e.message || 'Sem resposta'}`
    } as any;
  }
}

/**
 * Mantido para compatibilidade reversa opcional, encapsulando o safeApiCall
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const result = await safeApiCall<any>(url, options);
  
  // Constrói um objeto compatível com a API de Response do fetch para compatibilidade
  const mockResponse = new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' }
  });
  
  return mockResponse;
}
