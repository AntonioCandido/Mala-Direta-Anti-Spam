import React, { useState, useEffect } from 'react';
import {
  Mail,
  Table,
  ShieldAlert,
  Send,
  Sliders,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Menu,
  X,
  FileText,
  BadgeAlert,
  History as HistoryIcon
} from 'lucide-react';
import SmtpConfigPanel from './components/SmtpConfigPanel';
import ImportDataPanel from './components/ImportDataPanel';
import TemplateEditorPanel from './components/TemplateEditorPanel';
import AntiSpamConfigPanel from './components/AntiSpamConfigPanel';
import QueuePanel from './components/QueuePanel';
import HistoryPanel from './components/HistoryPanel';
import { SmtpConfig, AntiSpamConfig, Recipient, VariableMapping, CampaignHistory } from './types';

// App component entry point

export default function App() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => {
    return localStorage.getItem('mala_direta_workspace');
  });

  const [workspaceList, setWorkspaceList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mala_direta_workspaces_list');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'recipients' | 'smtp' | 'template' | 'antispam' | 'history'>('recipients');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Unified Workspace-scoped State
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<VariableMapping[]>([]);
  
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: '', pass: '' },
    fromName: '',
    fromEmail: '',
    subject: '',
  });

  const [antiSpamConfig, setAntiSpamConfig] = useState<AntiSpamConfig>({
    minDelay: 3,
    maxDelay: 8,
    batchSize: 50,
    batchPauseTime: 10,
  });

  const [template, setTemplate] = useState<string>('');

  // Dynamically load states whenever the user switches Workspace
  useEffect(() => {
    if (!workspaceId) return;

    let loadedRecs: Recipient[] = [];
    const savedRecipients = localStorage.getItem(`mala_direta_recipients_${workspaceId}`);
    if (savedRecipients) {
      try {
        loadedRecs = JSON.parse(savedRecipients);
        setRecipients(loadedRecs);
      } catch (e) {
        setRecipients([]);
      }
    } else {
      setRecipients([]);
    }

    const savedCols = localStorage.getItem(`mala_direta_columns_${workspaceId}`);
    if (savedCols) {
      try {
        const cols = JSON.parse(savedCols);
        if (cols && cols.length > 0) {
          setColumns(cols);
        } else if (loadedRecs.length > 0) {
          // Reconstruct from recipients keys as fallback
          const keys = new Set<string>();
          loadedRecs.forEach((rec: any) => {
            Object.keys(rec).forEach(k => {
              if (k !== 'id' && k !== 'email') keys.add(k);
            });
          });
          const hasEmailKey = loadedRecs.some((r: any) => 'email' in r);
          const colList = Array.from(keys);
          if (hasEmailKey) {
            colList.unshift('email');
          }
          setColumns(colList);
        } else {
          setColumns([]);
        }
      } catch (e) {
        setColumns([]);
      }
    } else if (loadedRecs.length > 0) {
      // Reconstruct from recipients keys as fallback
      const keys = new Set<string>();
      loadedRecs.forEach((rec: any) => {
        Object.keys(rec).forEach(k => {
          if (k !== 'id' && k !== 'email') keys.add(k);
        });
      });
      const hasEmailKey = loadedRecs.some((r: any) => 'email' in r);
      const colList = Array.from(keys);
      if (hasEmailKey) {
        colList.unshift('email');
      }
      setColumns(colList);
    } else {
      setColumns([]);
    }

    const savedMappings = localStorage.getItem(`mala_direta_mappings_${workspaceId}`);
    if (savedMappings) {
      try {
        setMappings(JSON.parse(savedMappings));
      } catch (e) {
        setMappings([]);
      }
    } else {
      setMappings([]);
    }

    const savedAntiSpam = localStorage.getItem(`mala_direta_antispam_${workspaceId}`);
    if (savedAntiSpam) {
      try {
        setAntiSpamConfig(JSON.parse(savedAntiSpam));
      } catch (e) {
        setAntiSpamConfig({
          minDelay: 3,
          maxDelay: 8,
          batchSize: 50,
          batchPauseTime: 10,
        });
      }
    } else {
      setAntiSpamConfig({
        minDelay: 3,
        maxDelay: 8,
        batchSize: 50,
        batchPauseTime: 10,
      });
    }

    const savedTemplate = localStorage.getItem(`mala_direta_template_${workspaceId}`);
    if (savedTemplate) {
      setTemplate(savedTemplate);
    } else {
      setTemplate(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f7; color: #51545e; margin: 0; padding: 15px; }
    .email-container { max-width: 570px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e8e8f1; border-radius: 8px; overflow: hidden; }
    .email-header { background-color: #3b82f6; color: #ffffff; text-align: center; padding: 25px; }
    .email-body { padding: 30px; line-height: 1.6; }
    .email-footer { background-color: #f4f4f7; padding: 20px; text-align: center; font-size: 12px; color: #a8aaaf; }
    .button { display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1 style="margin: 0; font-size: 22px;">Inovação ao Seu Alcance</h1>
    </div>
    <div class="email-body">
      <p style="font-size: 16px; margin-top: 0;">Prezado(a) <strong>{{nome}}</strong>,</p>
      <p>Esperamos que este e-mail lhe encontre bem na empresa <strong>{{empresa}}</strong>.</p>
      <p>Gostaríamos de lhe convidar para conferir nossos novos serviços personalizados de entregabilidade de e-mail e infraestrutura cloud resiliente.</p>
      <div style="text-align: center;">
        <a href="https://exemplo.com" class="button">Conhecer Soluções</a>
      </div>
      <p>Qualquer dúvida, nossa equipe está inteiramente à sua disposição.</p>
      <p>Atenciosamente,<br>Equipe de Vendas</p>
    </div>
    <div class="email-footer">
      Esta mensagem foi enviada de forma personalizada para {{email}}.<br>
      © 2026 Plataforma Enterprise S.A.
    </div>
  </div>
</body>
</html>`);
    }
  }, [workspaceId]);

  // Sync state changes to workspace-scoped local storage keys
  useEffect(() => {
    if (workspaceId && recipients.length > 0) {
      localStorage.setItem(`mala_direta_recipients_${workspaceId}`, JSON.stringify(recipients));
    }
  }, [recipients, workspaceId]);

  useEffect(() => {
    if (workspaceId && columns.length > 0) {
      localStorage.setItem(`mala_direta_columns_${workspaceId}`, JSON.stringify(columns));
    }
  }, [columns, workspaceId]);

  useEffect(() => {
    if (workspaceId && mappings.length > 0) {
      localStorage.setItem(`mala_direta_mappings_${workspaceId}`, JSON.stringify(mappings));
    }
  }, [mappings, workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      localStorage.setItem(`mala_direta_antispam_${workspaceId}`, JSON.stringify(antiSpamConfig));
    }
  }, [antiSpamConfig, workspaceId]);

  useEffect(() => {
    if (workspaceId && template) {
      localStorage.setItem(`mala_direta_template_${workspaceId}`, template);
    }
  }, [template, workspaceId]);

  const handleJoinWorkspace = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    
    localStorage.setItem('mala_direta_workspace', cleanName);
    
    const updatedList = Array.from(new Set([...workspaceList, cleanName]));
    setWorkspaceList(updatedList);
    localStorage.setItem('mala_direta_workspaces_list', JSON.stringify(updatedList));
    
    setWorkspaceId(cleanName);
  };

  const handleLeaveWorkspace = () => {
    localStorage.removeItem('mala_direta_workspace');
    setWorkspaceId(null);
  };

  const handleRemoveWorkspaceFromHistory = (nameToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedList = workspaceList.filter(name => name !== nameToRemove);
    setWorkspaceList(updatedList);
    localStorage.setItem('mala_direta_workspaces_list', JSON.stringify(updatedList));
  };

  const handleDataLoaded = (loadedRecipients: Recipient[], loadedCols: string[]) => {
    setRecipients(loadedRecipients);
    setColumns(loadedCols);
  };

  const handleClearData = () => {
    setRecipients([]);
    setColumns([]);
    setMappings([]);
    if (workspaceId) {
      localStorage.removeItem(`mala_direta_recipients_${workspaceId}`);
      localStorage.removeItem(`mala_direta_columns_${workspaceId}`);
      localStorage.removeItem(`mala_direta_mappings_${workspaceId}`);
    }
  };

  const handleResetApp = () => {
    setRecipients([]);
    setColumns([]);
    setMappings([]);
    if (workspaceId) {
      localStorage.removeItem(`mala_direta_recipients_${workspaceId}`);
      localStorage.removeItem(`mala_direta_columns_${workspaceId}`);
      localStorage.removeItem(`mala_direta_mappings_${workspaceId}`);
    }
  };

  const handleRestoreCampaign = (campaign: CampaignHistory) => {
    // Restore recipients
    setRecipients(campaign.recipients || []);
    
    // Extract columns
    if (campaign.recipients && campaign.recipients.length > 0) {
      const keys = new Set<string>();
      campaign.recipients.forEach((rec: any) => {
        Object.keys(rec).forEach(k => {
          if (k !== 'id') keys.add(k);
        });
      });
      setColumns(Array.from(keys));
    } else {
      setColumns([]);
    }

    // Restore subject
    setSmtpConfig(prev => ({
      ...prev,
      subject: campaign.subject || ''
    }));

    // Restore template HTML
    setTemplate(campaign.template || '');

    // Inferred mappings
    const inferredMappings: VariableMapping[] = [];
    if (campaign.recipients && campaign.recipients.length > 0) {
      const firstRec = campaign.recipients[0];
      const hasEmailKey = Object.keys(firstRec).includes('email');
      
      if (hasEmailKey) {
        inferredMappings.push({ placeholder: 'email', columnName: 'email' });
      }
      
      Object.keys(firstRec).forEach(k => {
        if (k !== 'id' && k !== 'email') {
          inferredMappings.push({ placeholder: k, columnName: k });
        }
      });
    }
    setMappings(inferredMappings);

    // Switch to dashboard tab
    setActiveTab('dashboard');
  };

  // Helper check status
  const isSheetConfigured = recipients.length > 0 && mappings.some(m => m.placeholder === 'email' && m.columnName !== '');
  const isSmtpConfigured = smtpConfig.host !== '' && smtpConfig.auth.user !== '' && smtpConfig.auth.pass !== '';
  const isTemplateConfigured = template.trim() !== '';

  const navigationItems = [
    { id: 'recipients', label: '1. Destinatários', icon: Table, status: isSheetConfigured },
    { id: 'smtp', label: '2. Remetente & SMTP', icon: Mail, status: isSmtpConfigured },
    { id: 'template', label: '3. Modelo HTML', icon: FileText, status: isTemplateConfigured },
    { id: 'antispam', label: '4. Filtros Anti-Spam', icon: Sliders, status: true },
    { id: 'dashboard', label: '5. Painel de Disparo', icon: Send, status: isSheetConfigured && isSmtpConfigured && isTemplateConfigured },
    { id: 'history', label: '6. Histórico', icon: HistoryIcon, status: true }
  ];

  // If no active workspace is selected, show the gorgeous gateway portal
  if (!workspaceId) {
    return (
      <div className="min-h-screen bg-slate-50/70 flex flex-col items-center justify-center p-6 text-slate-800 font-sans" id="workspace-login-container">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600" />
          
          <div className="flex flex-col items-center gap-3.5 text-center mb-8">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100/60 rounded-2xl flex items-center justify-center text-indigo-600 font-extrabold text-xl shadow-xs shadow-indigo-100/20">
              MD
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mala Direta Anti-Spam</h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Selecione ou crie um workspace para começar de forma isolada
              </p>
            </div>
          </div>

          {/* Existing workspaces history */}
          {workspaceList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Workspaces Recentes</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {workspaceList.map((ws) => (
                  <div
                    key={ws}
                    onClick={() => handleJoinWorkspace(ws)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 rounded-2xl cursor-pointer transition text-left text-sm group"
                  >
                    <span className="font-semibold text-slate-700 group-hover:text-indigo-900">{ws}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide">Entrar</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveWorkspaceFromHistory(ws, e)}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition"
                        title="Remover do histórico"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create/Access workspace */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('workspaceName') as string;
              handleJoinWorkspace(name);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="workspaceName" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Acessar outro Workspace
              </label>
              <input
                type="text"
                name="workspaceName"
                id="workspaceName"
                required
                placeholder="Digite o nome do workspace..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-slate-900 placeholder:text-slate-400 transition"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 px-4 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Acessar Workspace</span>
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Cada workspace possui histórico de campanhas, listas de contatos, modelos de e-mail e configurações de SMTP completamente isoladas de outros usuários.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col font-sans text-slate-800" id="main-app-container">
      
      {/* Mobile Top Navigation bar (Visible on Mobile only) */}
      <header className="bg-white text-slate-800 border-b border-slate-200/80 sticky top-0 z-50 px-4 py-3 shadow-xs lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100/60 text-indigo-600 rounded-xl font-bold text-sm shadow-xs">
              MD
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900">Mala Direta Base44</h1>
              <p className="text-[9px] text-indigo-600 font-mono font-bold">ARQUITETO ENTERPRISE</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Workspace switcher on Mobile */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <span className="text-[10px] text-slate-600 font-semibold truncate max-w-[80px]" title={workspaceId}>
                {workspaceId}
              </span>
              <button 
                onClick={handleLeaveWorkspace}
                className="text-[9px] text-indigo-600 hover:text-indigo-800 font-bold ml-1 hover:underline cursor-pointer"
              >
                Trocar
              </button>
            </div>

            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 hover:bg-slate-50 rounded-xl transition text-slate-600"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white text-slate-700 border-b border-slate-200/80 p-4 space-y-1 shadow-md">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-btn-${item.id}`}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-indigo-50 border border-indigo-100/60 text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.status && (
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-indigo-600' : 'bg-emerald-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Primary Layout Container (Bento Framed) */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
        
        {/* Navigation Sidebar (Desktop - High-Tech Compact Bento column) */}
        <aside className="hidden lg:flex w-24 flex-col items-center py-8 px-2 bg-white text-slate-800 rounded-3xl border border-slate-200 shadow-xs justify-between shrink-0 h-[calc(100vh-3rem)] sticky top-6">
          <div className="w-full flex flex-col items-center gap-8">
            {/* Logo */}
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100/60 rounded-2xl flex items-center justify-center text-indigo-600 font-extrabold text-lg shadow-sm shadow-indigo-100/20">
              MD
            </div>
            
            {/* Navigation Menu */}
            <nav className="w-full flex flex-col gap-3">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as any);
                    }}
                    className={`w-full flex flex-col items-center justify-center p-3 rounded-2xl transition-all relative group ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/60 font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    title={item.label}
                  >
                    <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    <span className="text-[9px] text-center font-medium leading-tight max-w-[80px] truncate-3-lines">
                      {item.label.split('. ')[1]}
                    </span>
                    {item.status && (
                      <span className={`absolute top-2.5 right-2.5 h-2 w-2 rounded-full ${isActive ? 'bg-indigo-600' : 'bg-emerald-500'}`} />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Info */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">v1.2</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Sistema Online" />
          </div>
        </aside>

        {/* Main Content Area (Bento Structured) */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          
          {/* Main Dashboard Header Card (As a Bento box) */}
          <header className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  Mala Direta Anti-Spam
                </h1>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                  Enterprise Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Dispare campanhas de e-mail personalizadas com conformidade anti-spam e delay randômico dinâmico.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Workspace Indicator & Switcher on Desktop */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-2xl shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                <span className="text-xs text-slate-500 font-medium">Workspace:</span>
                <span className="text-xs font-bold text-slate-900 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg max-w-[120px] truncate" title={workspaceId}>
                  {workspaceId}
                </span>
                <button 
                  onClick={handleLeaveWorkspace}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold ml-1 cursor-pointer hover:underline"
                >
                  Trocar
                </button>
              </div>

              {/* Overall Configuration Progress bar checklist */}
              <div className="flex items-center gap-4 text-xs font-semibold bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60 self-start md:self-auto shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${isSheetConfigured ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`} />
                  <span className={isSheetConfigured ? 'text-slate-700' : 'text-slate-400'}>Planilha</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${isSmtpConfigured ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`} />
                  <span className={isSmtpConfigured ? 'text-slate-700' : 'text-slate-400'}>SMTP</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${isTemplateConfigured ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`} />
                  <span className={isTemplateConfigured ? 'text-slate-700' : 'text-slate-400'}>Template</span>
                </div>
              </div>
            </div>
          </header>

          {/* Active Tab Screen Area */}
          <div className="flex-1">
            {/* recipients tab */}
            {activeTab === 'recipients' && (
              <ImportDataPanel
                recipients={recipients}
                columns={columns}
                mappings={mappings}
                onDataLoaded={handleDataLoaded}
                onRecipientsChanged={setRecipients}
                onMappingsChanged={setMappings}
                onClear={handleClearData}
              />
            )}

            {/* smtp tab */}
            {activeTab === 'smtp' && (
              <SmtpConfigPanel
                config={smtpConfig}
                onChange={setSmtpConfig}
                workspaceId={workspaceId}
              />
            )}

            {/* template tab */}
            {activeTab === 'template' && (
              <TemplateEditorPanel
                template={template}
                onTemplateChanged={setTemplate}
                mappings={mappings}
                recipients={recipients}
              />
            )}

            {/* antispam tab */}
            {activeTab === 'antispam' && (
              <AntiSpamConfigPanel
                config={antiSpamConfig}
                onChange={setAntiSpamConfig}
              />
            )}

            {/* dashboard queue tab */}
            {activeTab === 'dashboard' && (
              <QueuePanel
                recipients={recipients}
                smtpConfig={smtpConfig}
                template={template}
                antiSpamConfig={antiSpamConfig}
                mappings={mappings}
                onResetApp={handleResetApp}
              />
            )}

            {/* history tab */}
            {activeTab === 'history' && (
              <HistoryPanel
                onRestore={handleRestoreCampaign}
              />
            )}
          </div>

        </main>
      </div>

      {/* Footer copyright */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200 py-4 px-4 text-center text-[11px] text-slate-400 mt-auto">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 Mala Direta Enterprise. Desenvolvido com foco em entregabilidade e conformidade anti-spam.</span>
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-500" /> Prof. Antônio Cândido
          </span>
        </div>
      </footer>
    </div>
  );
}
