import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trash2, StopCircle, RefreshCw, AlertTriangle, CheckCircle, Clock, Download, Terminal, UserCheck, Send } from 'lucide-react';
import { SmtpConfig, AntiSpamConfig, Recipient, VariableMapping, CampaignStatus, LogEntry } from '../types';
import { safeApiCall, API_ROUTES, CampaignStartResponse, CampaignToggleResponse, CampaignCancelResponse, CampaignResetResponse } from '../api';

interface QueuePanelProps {
  recipients: Recipient[];
  smtpConfig: SmtpConfig;
  template: string;
  antiSpamConfig: AntiSpamConfig;
  mappings: VariableMapping[];
  onResetApp: () => void;
}

export default function QueuePanel({
  recipients,
  smtpConfig,
  template,
  antiSpamConfig,
  mappings,
  onResetApp
}: QueuePanelProps) {
  const [status, setStatus] = useState<CampaignStatus>({
    id: '',
    status: 'idle',
    total: 0,
    sent: 0,
    failed: 0,
    currentEmail: '',
    estimatedTimeRemaining: 0,
    logs: [],
    startTime: null
  });

  const [pollingActive, setPollingActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [campaignName, setCampaignName] = useState('Campanha - ' + new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [activeTab, setActiveTab] = useState<'status' | 'logs'>('status');

  const logsEndRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // Poll status endpoint safely without creating infinite request loops
  const fetchStatus = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const result = await safeApiCall<CampaignStatus>(API_ROUTES.CAMPAIGN_STATUS);
      if (result.success && result.data) {
        const data = result.data;
        setStatus(data);
        
        // Disable polling if finished, cancelled or idle
        if (data.status === 'completed' || data.status === 'cancelled' || data.status === 'idle') {
          setPollingActive(false);
        } else {
          setPollingActive(true);
        }
      } else {
        if (result.error && !result.error.toLowerCase().includes('rate exceeded')) {
          console.error('Erro ao buscar status da fila:', result.error);
        }
      }
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Poll periodically
  useEffect(() => {
    fetchStatus(); // initial fetch
    
    // Poll every 2.5 seconds cleanly
    const interval = setInterval(() => {
      fetchStatus();
    }, 2500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Auto scroll logs console to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status.logs]);

  // Trigger start
  const handleStart = async () => {
    setErrorMessage('');
    
    // Validations
    if (recipients.length === 0) {
      setErrorMessage('Nenhum destinatário carregado. Importe uma planilha primeiro.');
      return;
    }
    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      setErrorMessage('Configuração SMTP incompleta. Verifique o painel Remetente e SMTP.');
      return;
    }
    const hasEmailMap = mappings.some(m => m.placeholder === 'email' && m.columnName !== '');
    if (!hasEmailMap) {
      setErrorMessage('A tag "email" precisa estar associada a uma coluna válida na aba Importação.');
      return;
    }
    if (!template.trim()) {
      setErrorMessage('O modelo de e-mail está vazio.');
      return;
    }

    try {
      const result = await safeApiCall<CampaignStartResponse>(API_ROUTES.CAMPAIGN_START, {
        method: 'POST',
        body: JSON.stringify({
          recipients,
          smtpConfig,
          template,
          antiSpamConfig,
          mappings,
          templateName: campaignName
        })
      });

      if (result.success && result.status) {
        setStatus(result.status);
        setPollingActive(true);
        setActiveTab('status');
      } else {
        setErrorMessage(result.error || 'Falha ao iniciar campanha.');
      }
    } catch (err: any) {
      setErrorMessage('Erro ao comunicar com o servidor: ' + (err.message || ''));
    }
  };

  // Trigger pause/resume
  const handleTogglePause = async () => {
    const result = await safeApiCall<CampaignToggleResponse>(API_ROUTES.CAMPAIGN_TOGGLE, { method: 'POST' });
    if (result.success) {
      fetchStatus();
    } else {
      setErrorMessage(result.error || 'Falha ao pausar/retomar a campanha.');
    }
  };

  // Trigger cancel
  const handleCancel = async () => {
    if (!window.confirm('Tem certeza de que deseja parar e cancelar o envio atual definitivamente?')) {
      return;
    }
    const result = await safeApiCall<CampaignCancelResponse>(API_ROUTES.CAMPAIGN_CANCEL, { method: 'POST' });
    if (result.success) {
      fetchStatus();
    } else {
      setErrorMessage(result.error || 'Falha ao cancelar a campanha.');
    }
  };

  // Reset queue state
  const handleReset = async () => {
    const result = await safeApiCall<CampaignResetResponse>(API_ROUTES.CAMPAIGN_RESET, { method: 'POST' });
    if (result.success) {
      setStatus({
        id: '',
        status: 'idle',
        total: 0,
        sent: 0,
        failed: 0,
        currentEmail: '',
        estimatedTimeRemaining: 0,
        logs: [],
        startTime: null
      });
      setPollingActive(false);
      onResetApp();
    } else {
      setErrorMessage(result.error || 'Falha ao resetar o estado da campanha.');
    }
  };

  const formatRemainingTime = (secs: number) => {
    if (secs <= 0) return 'Concluído';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };

  // Export logs to download as TXT file
  const exportLogs = () => {
    if (status.logs.length === 0) return;
    const logText = status.logs
      .map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mala-direta-logs-${new Date().toISOString().substring(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const processedCount = status.sent + status.failed;
  const progressPercent = status.total > 0 ? Math.round((processedCount / status.total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6" id="queue-panel">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/30">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Painel de Disparo e Fila</h3>
            <p className="text-xs text-slate-500">Inicie, monitore ou controle o envio em massa em tempo real</p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div id="queue-error-alert" className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex gap-3 leading-relaxed">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Campaign status indicator */}
      {status.status === 'idle' ? (
        <div className="text-center py-12 px-6 bg-slate-50/50 rounded-2xl border border-slate-200/60 space-y-5">
          <div className="h-14 w-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Play className="h-6 w-6 ml-1" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">Tudo Pronto para o Envio</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Certifique-se de carregar sua planilha, configurar os controles anti-spam, digitar o assunto e testar a conexão SMTP.
            </p>
          </div>

          <div className="max-w-sm mx-auto text-left space-y-1 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <label htmlFor="campaign-name-input" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Nome da Campanha
            </label>
            <input
              id="campaign-name-input"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-semibold text-slate-700"
              placeholder="Ex: Campanha de Lançamento"
            />
          </div>

          <button
            id="start-campaign-btn"
            type="button"
            onClick={handleStart}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition flex items-center gap-2 mx-auto cursor-pointer"
          >
            <Play className="h-4 w-4" />
            Iniciar Envio em Massa
          </button>
        </div>
      ) : (
        /* Running or Finished Panel dashboard */
        <div className="space-y-6">
          {/* Dashboard Status Pill Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
              <span
                id="queue-status-badge"
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  status.status === 'running'
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : status.status === 'paused'
                    ? 'bg-amber-500 text-white'
                    : status.status === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {status.status === 'running' && 'Enviando...'}
                {status.status === 'paused' && 'Pausado'}
                {status.status === 'completed' && 'Concluído'}
                {status.status === 'cancelled' && 'Cancelado'}
              </span>
            </div>

            {/* Controls Row */}
            <div className="flex gap-2">
              {(status.status === 'running' || status.status === 'paused') && (
                <>
                  <button
                    id="queue-toggle-pause-btn"
                    type="button"
                    onClick={handleTogglePause}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border ${
                      status.status === 'paused'
                        ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800'
                    }`}
                  >
                    {status.status === 'paused' ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    {status.status === 'paused' ? 'Retomar' : 'Pausar'}
                  </button>
                  <button
                    id="queue-cancel-btn"
                    type="button"
                    onClick={handleCancel}
                    className="px-3.5 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    Parar
                  </button>
                </>
              )}
              {(status.status === 'completed' || status.status === 'cancelled') && (
                <button
                  id="queue-reset-btn"
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Nova Campanha / Reiniciar
                </button>
              )}
            </div>
          </div>

          {/* Progress bar container */}
          <div className="bg-slate-50/50 p-5 border border-slate-200/60 rounded-2xl space-y-3 shadow-inner">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Progresso de Envio</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">{progressPercent}% ({processedCount} de {status.total})</span>
            </div>
            
            <div className="w-full bg-slate-200/75 h-2.5 rounded-full overflow-hidden">
              <div
                id="queue-progress-bar"
                style={{ width: `${progressPercent}%` }}
                className={`h-full rounded-full transition-all duration-350 ${
                  status.status === 'running'
                    ? 'bg-indigo-600'
                    : status.status === 'paused'
                    ? 'bg-amber-500'
                    : status.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
              />
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1.5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Sucesso</span>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">{status.sent}</p>
              <span className="text-[10px] text-slate-400 font-medium block">E-mails entregues</span>
            </div>
            
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1.5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Falha</span>
              <p className="text-2xl font-black text-rose-600 tracking-tight">{status.failed}</p>
              <span className="text-[10px] text-slate-400 font-medium block">Falharam ou pulados</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1.5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Falta Enviar</span>
              <p className="text-2xl font-black text-slate-700 tracking-tight">{status.total - processedCount}</p>
              <span className="text-[10px] text-slate-400 font-medium block">Restantes na fila</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1.5 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tempo Estimado</span>
              <p className="text-sm font-bold text-indigo-800 py-0.5 flex items-center justify-center gap-1 font-mono">
                <Clock className="h-4 w-4 shrink-0 text-indigo-500" />
                {formatRemainingTime(status.estimatedTimeRemaining)}
              </p>
              <span className="text-[10px] text-slate-400 font-medium block">Incluso pausas e delays</span>
            </div>
          </div>

          {/* Active Status Row */}
          {status.status === 'running' && status.currentEmail && (
            <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-indigo-950 gap-2">
              <span className="flex items-center gap-2 font-bold text-slate-700">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                Processando destinatário ativo:
              </span>
              <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-indigo-100 text-indigo-800 font-semibold text-[11px] break-all self-start sm:self-auto shadow-sm">{status.currentEmail}</span>
            </div>
          )}
        </div>
      )}

      {/* Logs Console Box */}
      {status.logs.length > 0 && (
        <div className="space-y-3.5 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Terminal className="h-4.5 w-4.5 text-indigo-600" />
              Logs Visuais do Processamento
            </span>
            <button
              id="export-logs-btn"
              type="button"
              onClick={exportLogs}
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-200 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar Logs (.txt)
            </button>
          </div>

          <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl font-mono text-[11px] h-60 overflow-y-auto space-y-2 border border-slate-800 shadow-inner scrollbar-thin">
            {status.logs.map((log, idx) => (
              <div key={idx} className="flex gap-2 items-start leading-relaxed">
                <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-400 font-medium'
                      : log.type === 'error'
                      ? 'text-rose-400 font-semibold'
                      : 'text-indigo-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
