import React, { useState, useEffect } from 'react';
import { Mail, Shield, CheckCircle, AlertTriangle, Play, HelpCircle, Eye, EyeOff, Laptop, Sparkles, Zap, Check, Globe, RefreshCw, Search } from 'lucide-react';
import { SmtpConfig } from '../types';
import { apiFetch } from '../api';

interface SmtpConfigPanelProps {
  config: SmtpConfig;
  onChange: (updated: SmtpConfig) => void;
  workspaceId?: string;
}

const PRESETS = {
  gmail: {
    name: 'Gmail / Google Workspace',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    note: 'Requer criar uma "Senha de App" nas configurações de segurança do Google. Senhas de login comuns não funcionarão.',
  },
  outlook: {
    name: 'Outlook / Office 365',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    note: 'Verifique se o envio SMTP autenticado está ativo no painel de administração e use Senha de App caso tenha MFA.',
  },
  custom: {
    name: 'Servidor Personalizado',
    host: '',
    port: 587,
    secure: false,
    note: 'Insira as configurações personalizadas do seu servidor SMTP.',
  }
};

const DOMAIN_SMTPS_MAP: Record<string, { host: string; port: number; secure: boolean; preset: 'gmail' | 'outlook' | 'custom' }> = {
  'gmail.com': { host: 'smtp.gmail.com', port: 465, secure: true, preset: 'gmail' },
  'googlemail.com': { host: 'smtp.gmail.com', port: 465, secure: true, preset: 'gmail' },
  'outlook.com': { host: 'smtp.office365.com', port: 587, secure: false, preset: 'outlook' },
  'hotmail.com': { host: 'smtp.office365.com', port: 587, secure: false, preset: 'outlook' },
  'live.com': { host: 'smtp.office365.com', port: 587, secure: false, preset: 'outlook' },
  'msn.com': { host: 'smtp.office365.com', port: 587, secure: false, preset: 'outlook' },
  'office365.com': { host: 'smtp.office365.com', port: 587, secure: false, preset: 'outlook' },
  'yahoo.com': { host: 'smtp.mail.yahoo.com', port: 465, secure: true, preset: 'custom' },
  'yahoo.com.br': { host: 'smtp.mail.yahoo.com', port: 465, secure: true, preset: 'custom' },
  'icloud.com': { host: 'smtp.mail.me.com', port: 587, secure: false, preset: 'custom' },
  'me.com': { host: 'smtp.mail.me.com', port: 587, secure: false, preset: 'custom' },
  'mac.com': { host: 'smtp.mail.me.com', port: 587, secure: false, preset: 'custom' },
  'zoho.com': { host: 'smtp.zoho.com', port: 465, secure: true, preset: 'custom' },
  'zoho.com.br': { host: 'smtp.zoho.com', port: 465, secure: true, preset: 'custom' },
  'uol.com.br': { host: 'smtps.uol.com.br', port: 587, secure: false, preset: 'custom' },
  'bol.com.br': { host: 'smtps.uol.com.br', port: 587, secure: false, preset: 'custom' },
  'globo.com': { host: 'smtps.globo.com', port: 465, secure: true, preset: 'custom' },
  'globomail.com': { host: 'smtps.globo.com', port: 465, secure: true, preset: 'custom' },
  'ig.com.br': { host: 'smtp.ig.com.br', port: 587, secure: false, preset: 'custom' },
  'terra.com.br': { host: 'smtp.terra.com.br', port: 587, secure: false, preset: 'custom' },
  'locaweb.com.br': { host: 'smtp.locaweb.com.br', port: 587, secure: false, preset: 'custom' },
  'kinghost.com.br': { host: 'smtp.kinghost.net', port: 587, secure: false, preset: 'custom' },
  'estacio.br': { host: 'smtp.office365.com', port: 587, secure: false, preset: 'outlook' },
};

export default function SmtpConfigPanel({ config, onChange, workspaceId }: SmtpConfigPanelProps) {
  const [preset, setPreset] = useState<keyof typeof PRESETS>('gmail');
  const [showPassword, setShowPassword] = useState(false);
  const [deviceEmail, setDeviceEmail] = useState('');
  const [discoveryStatus, setDiscoveryStatus] = useState<{
    state: 'idle' | 'success' | 'info' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });
  const [testStatus, setTestStatus] = useState<{
    state: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });
  const [saveLocal, setSaveLocal] = useState(false);

  const [dnsSelector, setDnsSelector] = useState('default');
  const [dnsStatus, setDnsStatus] = useState<{
    state: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    results: {
      domain: string;
      spf: { status: 'valid' | 'invalid' | 'missing'; record: string | null; message: string };
      dkim: { status: 'valid' | 'missing'; record: string | null; message: string };
      dmarc: { status: 'valid' | 'missing'; record: string | null; message: string };
      mx: { status: 'valid' | 'missing'; records: string[]; message: string };
    } | null;
  }>({ state: 'idle', message: '', results: null });

  const storageKey = workspaceId ? `mala_direta_smtp_${workspaceId}` : 'mala_direta_smtp';

  // Load from localStorage on mount or workspace change (with security warning)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const decoded = JSON.parse(atob(saved));
        onChange(decoded);
        setSaveLocal(true);
      } catch (e) {
        console.error('Falha ao descriptografar credenciais SMTP salvas localmente.');
      }
    } else {
      setSaveLocal(false);
    }
  }, [workspaceId]);

  const applyPreset = (key: keyof typeof PRESETS) => {
    setPreset(key);
    if (key !== 'custom') {
      onChange({
        ...config,
        host: PRESETS[key].host,
        port: PRESETS[key].port,
        secure: PRESETS[key].secure,
      });
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    const keys = field.split('.');
    if (keys.length === 2) {
      onChange({
        ...config,
        [keys[0]]: {
          ...(config[keys[0] as keyof SmtpConfig] as any),
          [keys[1]]: value
        }
      });
    } else {
      onChange({
        ...config,
        [field]: value
      });
    }
  };

  // Toggle storage in localStorage (Base64)
  const toggleSaveLocal = (checked: boolean) => {
    setSaveLocal(checked);
    if (checked) {
      const encoded = btoa(JSON.stringify(config));
      localStorage.setItem(storageKey, encoded);
    } else {
      localStorage.removeItem(storageKey);
    }
  };

  // Update saved local storage whenever config changes
  useEffect(() => {
    if (saveLocal) {
      const encoded = btoa(JSON.stringify(config));
      localStorage.setItem(storageKey, encoded);
    }
  }, [config, saveLocal, storageKey]);

  const testConnection = async () => {
    if (!config.host || !config.port || !config.auth.user || !config.auth.pass) {
      setTestStatus({
        state: 'error',
        message: 'Preencha Host, Porta, Usuário e Senha para realizar o teste.'
      });
      return;
    }

    setTestStatus({ state: 'loading', message: 'Testando conexão e enviando e-mail de teste...' });
    try {
      const res = await apiFetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig: config }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus({
          state: 'success',
          message: data.message || 'Conexão estabelecida e e-mail de teste enviado com sucesso!'
        });
      } else {
        setTestStatus({
          state: 'error',
          message: data.error || 'Falha de autenticação ou erro no envio do e-mail de teste.'
        });
      }
    } catch (e: any) {
      setTestStatus({
        state: 'error',
        message: 'Erro ao conectar à API interna do servidor: ' + (e.message || '')
      });
    }
  };

  const checkDnsRecords = async () => {
    const senderEmail = config.fromEmail || config.auth.user;
    if (!senderEmail || !senderEmail.includes('@')) {
      setDnsStatus({
        state: 'error',
        message: 'Por favor, insira um "E-mail de Remetente" ou "Usuário SMTP" válido contendo "@" para identificarmos seu domínio para o diagnóstico.',
        results: null
      });
      return;
    }

    setDnsStatus({ state: 'loading', message: 'Consultando registros de DNS (MX, SPF, DKIM, DMARC) no servidor...', results: null });
    try {
      const res = await apiFetch('/api/check-dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: senderEmail, selector: dnsSelector }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDnsStatus({
          state: 'success',
          message: 'Diagnóstico de DNS concluído com sucesso!',
          results: data.results
        });
      } else {
        setDnsStatus({
          state: 'error',
          message: data.error || 'Falha ao processar a consulta de DNS no servidor.',
          results: null
        });
      }
    } catch (e: any) {
      setDnsStatus({
        state: 'error',
        message: 'Erro ao comunicar com o servidor: ' + (e.message || ''),
        results: null
      });
    }
  };

  const handleAutoDiscovery = () => {
    const trimmed = deviceEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setDiscoveryStatus({
        state: 'error',
        message: 'Por favor, insira um endereço de e-mail de dispositivo válido (ex: seu-nome@gmail.com).'
      });
      return;
    }

    const parts = trimmed.split('@');
    const localPart = parts[0];
    const domain = parts[1];

    // Capitalize localPart for sender name suggestion
    const cleanName = localPart
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const mapping = DOMAIN_SMTPS_MAP[domain];
    
    if (mapping) {
      setPreset(mapping.preset);
      onChange({
        ...config,
        host: mapping.host,
        port: mapping.port,
        secure: mapping.secure,
        fromEmail: trimmed,
        fromName: config.fromName || cleanName,
        auth: {
          ...config.auth,
          user: trimmed
        }
      });
      setDiscoveryStatus({
        state: 'success',
        message: `Configurações para "${domain}" detectadas com sucesso! Host, Porta, Segurança e Usuário preenchidos.`
      });
    } else {
      // Inferred custom domain guess
      setPreset('custom');
      const guessedHost = `smtp.${domain}`;
      onChange({
        ...config,
        host: guessedHost,
        port: 587,
        secure: false,
        fromEmail: trimmed,
        fromName: config.fromName || cleanName,
        auth: {
          ...config.auth,
          user: trimmed
        }
      });
      setDiscoveryStatus({
        state: 'info',
        message: `Domínio customizado. Sugerimos o host "${guessedHost}" (Porta 587). Confirme se seu provedor utiliza esta configuração.`
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6" id="smtp-config-panel">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/30">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Remetente e SMTP</h3>
            <p className="text-xs text-slate-500">Defina o remetente e configure o servidor de disparo</p>
          </div>
        </div>
      </div>

      {/* Device Email Auto-Discovery Assistant */}
      <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100/70 rounded-2xl space-y-3.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100/70 text-indigo-700 rounded-lg">
            <Sparkles className="h-4 w-4" />
          </div>
          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950">
            Assistente Inteligente: Configurar por E-mail do Dispositivo
          </h4>
        </div>
        
        <p className="text-xs text-slate-500 leading-relaxed">
          Devido às restrições de segurança do navegador (sandbox), sites não conseguem ler as senhas do seu cliente de e-mail local (Outlook/Mail). No entanto, digite seu e-mail do dispositivo abaixo para <strong>auto-detectar</strong> o servidor SMTP, portas e protocolos instantaneamente:
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <input
              id="device-email-autodiscover-input"
              type="email"
              value={deviceEmail}
              onChange={(e) => setDeviceEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAutoDiscovery();
                }
              }}
              placeholder="Ex: seu-email@dominio.com"
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium text-slate-700 shadow-sm"
            />
          </div>
          <button
            id="btn-trigger-autodiscover"
            type="button"
            onClick={handleAutoDiscovery}
            className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95"
          >
            <Zap className="h-3.5 w-3.5" />
            Configurar SMTP
          </button>
        </div>

        {discoveryStatus.state !== 'idle' && (
          <div
            id="autodiscover-status-message"
            className={`p-3 rounded-xl text-xs flex gap-2.5 items-center ${
              discoveryStatus.state === 'success'
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                : discoveryStatus.state === 'info'
                ? 'bg-blue-50 border border-blue-100 text-blue-800'
                : 'bg-rose-50 border border-rose-100 text-rose-800'
            }`}
          >
            {discoveryStatus.state === 'success' && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
            {discoveryStatus.state === 'info' && <HelpCircle className="h-4 w-4 text-blue-600 shrink-0" />}
            {discoveryStatus.state === 'error' && <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />}
            <span className="leading-relaxed font-semibold">{discoveryStatus.message}</span>
          </div>
        )}
      </div>

      {/* Preset Selectors */}
      <div className="grid grid-cols-3 gap-2.5">
        {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
          <button
            key={key}
            id={`preset-btn-${key}`}
            type="button"
            onClick={() => applyPreset(key)}
            className={`px-3 py-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
              preset === key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {PRESETS[key].name.split('/')[0]}
          </button>
        ))}
      </div>

      {/* Preset Help Info */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex gap-3 text-xs text-slate-600 leading-relaxed">
        <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
        <p>{PRESETS[preset].note}</p>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Nome de Origem</label>
          <input
            id="smtp-from-name"
            type="text"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/55 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition"
            placeholder="Ex: Comercial Empresa"
            value={config.fromName}
            onChange={(e) => handleFieldChange('fromName', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">E-mail do Remetente (opcional)</label>
          <input
            id="smtp-from-email"
            type="email"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/55 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition"
            placeholder="Ex: contato@empresa.com"
            value={config.fromEmail}
            onChange={(e) => handleFieldChange('fromEmail', e.target.value)}
          />
          <p className="text-[10px] text-slate-400">Se deixado em branco, será usado o usuário do SMTP.</p>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-700">Assunto Padrão da Campanha</label>
          <input
            id="smtp-subject"
            type="text"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/55 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition"
            placeholder="Ex: Olá {{nome}}, confira nossa oferta!"
            value={config.subject}
            onChange={(e) => handleFieldChange('subject', e.target.value)}
          />
          <p className="text-[10px] text-slate-400 font-medium">Suporta placeholders dinâmicos como <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">{"{{nome}}"}</code>.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Servidor SMTP (Host)</label>
          <input
            id="smtp-host"
            type="text"
            disabled={preset !== 'custom'}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/55 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="smtp.exemplo.com"
            value={config.host}
            onChange={(e) => handleFieldChange('host', e.target.value)}
          />
          {config.host.toLowerCase().trim() === 'smtp.estacio.br' && (
            <div className="mt-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                Dica Automática: "smtp.estacio.br" não existe.
              </p>
              <p className="leading-relaxed text-amber-800">
                O domínio <strong className="font-semibold">estacio.br</strong> utiliza a infraestrutura de e-mail do <strong className="font-semibold">Microsoft Office 365</strong>. O host correto é <strong className="font-semibold">smtp.office365.com</strong> (Porta 587, STARTTLS).
              </p>
              <button
                type="button"
                onClick={() => {
                  setPreset('outlook');
                  onChange({
                    ...config,
                    host: 'smtp.office365.com',
                    port: 587,
                    secure: false
                  });
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-[10px] cursor-pointer inline-flex items-center gap-1"
              >
                Corrigir para smtp.office365.com (Office 365)
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Porta</label>
            <input
              id="smtp-port"
              type="number"
              disabled={preset !== 'custom'}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/55 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="587"
              value={config.port}
              onChange={(e) => handleFieldChange('port', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="flex items-end pb-2 pl-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-semibold select-none">
              <input
                id="smtp-secure"
                type="checkbox"
                disabled={preset !== 'custom'}
                checked={config.secure}
                onChange={(e) => handleFieldChange('secure', e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              Conexão Segura (SSL)
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Usuário SMTP / Login</label>
          <input
            id="smtp-user"
            type="text"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/55 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition"
            placeholder="usuario@dominio.com"
            value={config.auth.user}
            onChange={(e) => handleFieldChange('auth.user', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Senha SMTP</label>
          <div className="relative">
            <input
              id="smtp-pass"
              type={showPassword ? 'text' : 'password'}
              className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50/55 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition"
              placeholder="••••••••••••••"
              value={config.auth.pass}
              onChange={(e) => handleFieldChange('auth.pass', e.target.value)}
            />
            <button
              id="toggle-pass-visibility"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Local Save Security Warning & Option */}
      <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50/40 flex flex-col gap-2">
        <div className="flex gap-2.5 text-xs text-yellow-800 leading-relaxed">
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Aviso de Segurança de Credenciais</p>
            <p className="mt-0.5 text-yellow-700 leading-relaxed">
              Para maior segurança, as credenciais são mantidas apenas em memória de sessão por padrão. 
              Ao marcar a opção abaixo, elas serão salvas no cache local do seu próprio navegador (localStorage) criptografadas em base64. 
              Nunca compartilhe seus dados SMTP com terceiros.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-xs text-yellow-900 font-bold self-start mt-1">
          <input
            id="smtp-save-local-check"
            type="checkbox"
            checked={saveLocal}
            onChange={(e) => toggleSaveLocal(e.target.checked)}
            className="rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
          />
          Lembrar minhas credenciais SMTP de forma persistente neste navegador
        </label>
      </div>

      {/* Connection Test Action */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <button
          id="btn-test-smtp"
          type="button"
          onClick={testConnection}
          disabled={testStatus.state === 'loading'}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer ${
            testStatus.state === 'loading'
              ? 'bg-slate-100 text-slate-400 cursor-wait'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
          }`}
        >
          {testStatus.state === 'loading' ? (
            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Shield className="h-3.5 w-3.5" />
          )}
          Testar Conexão & Enviar E-mail de Teste
        </button>

        {testStatus.state !== 'idle' && (
          <div
            id="test-smtp-result-alert"
            className={`p-3 rounded-xl text-xs flex flex-col md:flex-row gap-2.5 w-full sm:w-auto items-start md:items-center ${
              testStatus.state === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : testStatus.state === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            <div className="flex gap-2.5 items-center">
              {testStatus.state === 'success' && <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />}
              {testStatus.state === 'error' && <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />}
              <span className="leading-relaxed font-semibold">{testStatus.message}</span>
            </div>
            {testStatus.state === 'error' && config.host.toLowerCase().trim() === 'smtp.estacio.br' && (
              <button
                type="button"
                onClick={() => {
                  setPreset('outlook');
                  onChange({
                    ...config,
                    host: 'smtp.office365.com',
                    port: 587,
                    secure: false
                  });
                  setTestStatus({ state: 'idle', message: '' });
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-[10px] cursor-pointer"
              >
                Corrigir para smtp.office365.com
              </button>
            )}
          </div>
        )}
      </div>

      <hr className="border-slate-200/80 my-4" />

      {/* DNS Diagnostics SPF and DKIM Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Globe className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Painel de Diagnóstico DNS (Evitar Filtro de Spam)
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Verifique a configuração de registros de entregabilidade do domínio do remetente para evitar que seus e-mails sejam direcionados para a aba de Lixo Eletrônico ou Spam.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start sm:self-auto shrink-0">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seletor DKIM</label>
              <input
                id="dkim-selector-input"
                type="text"
                placeholder="Ex: default"
                value={dnsSelector}
                onChange={(e) => setDnsSelector(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none w-32 font-mono font-medium"
              />
            </div>
            <button
              id="btn-run-dns-diagnostics"
              type="button"
              onClick={checkDnsRecords}
              disabled={dnsStatus.state === 'loading'}
              className="px-4 py-2.5 mt-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm shadow-slate-950/10 active:scale-95"
            >
              {dnsStatus.state === 'loading' ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              Analisar Entregabilidade
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {dnsStatus.state === 'error' && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2.5 font-semibold">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{dnsStatus.message}</span>
          </div>
        )}

        {dnsStatus.state === 'loading' && (
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 text-indigo-800 text-xs rounded-xl flex items-center gap-2.5 font-semibold">
            <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin shrink-0" />
            <span>{dnsStatus.message}</span>
          </div>
        )}

        {/* Results Grid */}
        {dnsStatus.state === 'success' && dnsStatus.results && (
          <div className="space-y-4 pt-1">
            <div className="p-3 bg-indigo-50 border border-indigo-100/70 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 text-indigo-950">
              <span className="font-medium text-slate-700">
                Domínio Analisado: <strong className="text-indigo-900 font-bold font-mono text-xs">{dnsStatus.results.domain}</strong>
              </span>
              <span className="text-[10px] bg-indigo-100/70 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Verificação Ativa
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* SPF Record Diagnostics */}
              <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">Registro SPF</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    dnsStatus.results.spf.status === 'valid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : dnsStatus.results.spf.status === 'invalid'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      dnsStatus.results.spf.status === 'valid'
                        ? 'bg-emerald-500 animate-pulse'
                        : dnsStatus.results.spf.status === 'invalid'
                        ? 'bg-rose-500 animate-pulse'
                        : 'bg-amber-500'
                    }`} />
                    {dnsStatus.results.spf.status === 'valid' && 'Configurado'}
                    {dnsStatus.results.spf.status === 'invalid' && 'Incorreto'}
                    {dnsStatus.results.spf.status === 'missing' && 'Ausente'}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {dnsStatus.results.spf.message}
                </p>

                {dnsStatus.results.spf.record && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono text-[10px] text-slate-700 break-all select-all font-medium">
                    {dnsStatus.results.spf.record}
                  </div>
                )}

                {dnsStatus.results.spf.status !== 'valid' && (
                  <div className="p-2.5 bg-amber-50/50 border border-amber-100 text-[11px] text-slate-600 rounded-lg">
                    <p className="font-bold text-slate-900 mb-0.5">💡 Como corrigir:</p>
                    {dnsStatus.results.spf.status === 'missing' ? (
                      <span>Crie um registro do tipo <strong>TXT</strong> no DNS da sua hospedagem com o nome vazio ou "@" e o valor: <code className="bg-white px-1 py-0.5 rounded border border-amber-200 font-mono text-[10px] text-indigo-700 select-all font-bold">v=spf1 include:_spf.exemplo.com ~all</code> (substituindo pelo include correto do seu provedor de e-mail).</span>
                    ) : (
                      <span>Você possui mais de um registro SPF publicado. Para corrigir, una os dois em um único registro TXT, por exemplo: <code className="bg-white px-1 py-0.5 rounded border border-amber-200 font-mono text-[10px] text-indigo-700 font-bold">v=spf1 include:_spf.google.com include:outroprovedor.com ~all</code> e apague os registros duplicados antigos.</span>
                    )}
                  </div>
                )}
              </div>

              {/* DKIM Record Diagnostics */}
              <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">Registro DKIM</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    dnsStatus.results.dkim.status === 'valid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      dnsStatus.results.dkim.status === 'valid'
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-500'
                    }`} />
                    {dnsStatus.results.dkim.status === 'valid' ? 'Configurado' : 'Ausente'}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {dnsStatus.results.dkim.message}
                </p>

                {dnsStatus.results.dkim.record && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono text-[10px] text-slate-700 break-all select-all font-medium">
                    {dnsStatus.results.dkim.record}
                  </div>
                )}

                {dnsStatus.results.dkim.status !== 'valid' && (
                  <div className="p-2.5 bg-amber-50/50 border border-amber-100 text-[11px] text-slate-600 rounded-lg">
                    <p className="font-bold text-slate-900 mb-0.5">💡 Como corrigir:</p>
                    <span>O registro DKIM consiste em uma chave criptográfica pública do tipo <strong>TXT</strong>. Ative o DKIM no painel do seu provedor de e-mail (Ex: Google Admin, Zoho Mail, cPanel), copie o nome gerado (geralmente com o seletor "google" ou "default") e adicione como registro TXT no seu DNS.</span>
                  </div>
                )}
              </div>

              {/* DMARC Record Diagnostics */}
              <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">Registro DMARC</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    dnsStatus.results.dmarc.status === 'valid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      dnsStatus.results.dmarc.status === 'valid'
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-500'
                    }`} />
                    {dnsStatus.results.dmarc.status === 'valid' ? 'Configurado' : 'Ausente'}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {dnsStatus.results.dmarc.message}
                </p>

                {dnsStatus.results.dmarc.record && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono text-[10px] text-slate-700 break-all select-all font-medium">
                    {dnsStatus.results.dmarc.record}
                  </div>
                )}

                {dnsStatus.results.dmarc.status !== 'valid' && (
                  <div className="p-2.5 bg-amber-50/50 border border-amber-100 text-[11px] text-slate-600 rounded-lg">
                    <p className="font-bold text-slate-900 mb-0.5">💡 Como corrigir:</p>
                    <span>Crie um registro do tipo <strong>TXT</strong> no seu DNS com o nome <code className="bg-white px-1 border rounded text-indigo-700 font-mono font-bold">_dmarc</code> e o valor: <code className="bg-white px-1 border rounded text-indigo-700 font-mono select-all font-bold">v=DMARC1; p=none;</code> para iniciar o monitoramento de spams com segurança.</span>
                  </div>
                )}
              </div>

              {/* MX Record Diagnostics */}
              <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">Registros MX (Entrada)</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    dnsStatus.results.mx.status === 'valid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      dnsStatus.results.mx.status === 'valid'
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-rose-500 animate-pulse'
                    }`} />
                    {dnsStatus.results.mx.status === 'valid' ? 'Ativos' : 'Inativos'}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {dnsStatus.results.mx.message}
                </p>

                {dnsStatus.results.mx.records.length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono text-[10px] text-slate-700 space-y-1 font-medium">
                    {dnsStatus.results.mx.records.map((rec, idx) => (
                      <div key={idx}>• {rec}</div>
                    ))}
                  </div>
                )}

                {dnsStatus.results.mx.status !== 'valid' && (
                  <div className="p-2.5 bg-amber-50/50 border border-amber-100 text-[11px] text-slate-600 rounded-lg">
                    <p className="font-bold text-slate-900 mb-0.5">⚠️ Importante:</p>
                    <span>Se você planeja receber respostas das suas campanhas de marketing, certifique-se de que o domínio possui registros MX configurados apontando para os servidores do seu provedor de e-mails.</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
