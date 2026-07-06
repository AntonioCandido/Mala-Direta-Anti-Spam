import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Calendar, 
  Mail, 
  FileText, 
  CheckCircle, 
  XCircle, 
  User, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CampaignHistory, Recipient } from '../types';
import PdfExportModal from './PdfExportModal';
import HistoryDashboard from './HistoryDashboard';
import { safeApiCall, API_ROUTES, HistoryListResponse, HistoryDeleteResponse } from '../api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

interface HistoryPanelProps {
  onRestore: (campaign: CampaignHistory) => void;
}

export default function HistoryPanel({ onRestore }: HistoryPanelProps) {
  const [history, setHistory] = useState<CampaignHistory[]>(() => {
    try {
      const cached = localStorage.getItem('mala_direta_campaign_history_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [pdfExportModalState, setPdfExportModalState] = useState<{isOpen: boolean, campaign: CampaignHistory | null}>({isOpen: false, campaign: null});
  
  // Search and filters for recipients inside the expanded details view
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [recipientPage, setRecipientPage] = useState(0);
  const pageSize = 8;

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    
    const result = await safeApiCall<HistoryListResponse>(API_ROUTES.CAMPAIGN_HISTORY);
    
    if (result.success && result.history) {
      setHistory(result.history);
      try {
        localStorage.setItem('mala_direta_campaign_history_cache', JSON.stringify(result.history));
      } catch (err) {
        console.error('Erro ao cachear histórico no localStorage:', err);
      }
    } else {
      setError(result.error || 'Erro ao carregar o histórico de envios.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir este registro do histórico?')) return;
    
    const result = await safeApiCall<HistoryDeleteResponse>(API_ROUTES.CAMPAIGN_HISTORY_ENTRY(id), {
      method: 'DELETE'
    });
    
    if (result.success) {
      setHistory(prev => {
        const updated = prev.filter(item => item.id !== id);
        try {
          localStorage.setItem('mala_direta_campaign_history_cache', JSON.stringify(updated));
        } catch (err) {
          console.error(err);
        }
        return updated;
      });
      if (expandedCampaignId === id) {
        setExpandedCampaignId(null);
      }
    } else {
      alert(result.error || 'Erro ao excluir o registro.');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('ATENÇÃO: Deseja realmente apagar TODO o histórico de campanhas? Esta ação não pode ser desfeita.')) return;
    
    const result = await safeApiCall<HistoryDeleteResponse>(API_ROUTES.CAMPAIGN_HISTORY, {
      method: 'DELETE'
    });
    
    if (result.success) {
      setHistory([]);
      try {
        localStorage.removeItem('mala_direta_campaign_history_cache');
      } catch (err) {
        console.error(err);
      }
      setExpandedCampaignId(null);
    } else {
      alert(result.error || 'Erro ao limpar histórico.');
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedCampaignId === id) {
      setExpandedCampaignId(null);
    } else {
      setExpandedCampaignId(id);
      setRecipientSearch('');
      setRecipientFilter('all');
      setRecipientPage(0);
    }
  };

  // Helper to format date nicely
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Find the currently expanded campaign
  const expandedCampaign = history.find(item => item.id === expandedCampaignId);

  // Computa os dados das campanhas salvas no localStorage/cache para o mini-gráfico de barras
  const minichartData = React.useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-8) // Mostrar no máximo as últimas 8 campanhas para preservar a nitidez e legibilidade
      .map(item => {
        const d = new Date(item.date);
        const dayStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const labelStr = item.templateName 
          ? (item.templateName.length > 12 ? item.templateName.slice(0, 10) + '...' : item.templateName)
          : 'Sem Nome';
        return {
          name: `${dayStr} ${labelStr}`,
          fullName: item.templateName || 'Modelo Geral',
          Sucesso: item.sent || 0,
          Falha: item.failed || 0,
          Total: item.total || 0
        };
      });
  }, [history]);

  // Filter recipients in details view
  const getFilteredRecipients = () => {
    if (!expandedCampaign) return [];
    
    return (expandedCampaign.recipients || []).filter(rec => {
      const emailMatch = rec.email ? rec.email.toLowerCase().includes(recipientSearch.toLowerCase()) : false;
      const otherFieldsMatch = Object.entries(rec).some(([key, val]) => {
        if (key === 'id' || key === 'email') return false;
        return String(val).toLowerCase().includes(recipientSearch.toLowerCase());
      });
      
      const textMatches = emailMatch || otherFieldsMatch;
      
      if (!textMatches) return false;
      
      // Email format simple check for success/fail filter mockup if needed
      // (Wait, since we don't save per-recipient status dynamically, let's filter by valid email / general filter,
      // or check if there's any status. A simple validation format match can tell if it would have been failed/skipped)
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rec.email || '');
      if (recipientFilter === 'success') {
        return isValid;
      }
      if (recipientFilter === 'failed') {
        return !isValid;
      }
      return true;
    });
  };

  const filteredRecipients = getFilteredRecipients();
  const recipientPageCount = Math.ceil(filteredRecipients.length / pageSize);
  const displayedRecipients = filteredRecipients.slice(recipientPage * pageSize, (recipientPage + 1) * pageSize);

  // Dynamic columns for expanded recipients table
  const getRecipientColumns = (recipients: Recipient[]) => {
    if (!recipients || recipients.length === 0) return ['email'];
    const keys = new Set<string>();
    recipients.forEach(rec => {
      Object.keys(rec).forEach(k => {
        if (k !== 'id') keys.add(k);
      });
    });
    // Ensure email is first
    const list = Array.from(keys).filter(k => k !== 'email');
    return ['email', ...list];
  };

  const generatePDF = (campaign: CampaignHistory, config: { title: string, columns: string[] }) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(config.title, 14, 18);
    doc.setFontSize(10);
    doc.text(campaign.templateName, 14, 25);

    // Summary Box
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('Resumo da Campanha', 14, 40);
    doc.setDrawColor(200, 200, 200);
    doc.rect(14, 43, 182, 25);
    doc.setFontSize(10);
    doc.text(`Data: ${formatDate(campaign.date)}`, 20, 50);
    doc.text(`Total de Destinatários: ${campaign.total}`, 20, 56);
    doc.text(`Envios com Sucesso: ${campaign.sent}`, 110, 50);
    doc.text(`Envios com Falha: ${campaign.failed}`, 110, 56);
    doc.text(`Status Final: ${campaign.status === 'completed' ? 'Concluído' : 'Cancelado'}`, 20, 62);

    const columns = config.columns;
    
    const tableData = (campaign.recipients || []).map(rec => {
        return columns.map(col => String(rec[col] ?? ''));
    });

    autoTable(doc, {
        head: [columns.map(c => c.toUpperCase())],
        body: tableData,
        startY: 75,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak', halign: 'left' },
        columnStyles: columns.reduce((acc, _, idx) => {
            acc[idx] = { cellWidth: idx === 0 ? 60 : 40 };
            return acc;
        }, {} as any),
        didDrawPage: function(data) {
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text('Gerado via Sistema de Mala Direta Anti-Spam', 14, doc.internal.pageSize.height - 10);
        }
    });

    doc.save(`Relatorio_${campaign.templateName.replace(/\s+/g, '_')}_${campaign.id.slice(0,8)}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6 animate-fade-in" id="history-panel">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/30">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Histórico de Envios</h3>
            <p className="text-xs text-slate-500">Consulte campanhas passadas, templates, listas e resultados</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchHistory}
            className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer text-slate-600 hover:text-indigo-600"
            title="Atualizar histórico"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>

          {history.length > 0 && (
            <button
              id="clear-all-history-btn"
              type="button"
              onClick={handleClearAll}
              className="px-3.5 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar Tudo
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex gap-3 leading-relaxed">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Carregando histórico do servidor...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 px-6 bg-slate-50/50 rounded-2xl border border-slate-200/60 space-y-5">
          <div className="h-14 w-14 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <History className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">Sem Campanhas Registradas</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Você ainda não concluiu ou cancelou nenhuma campanha de disparo de e-mails nesta máquina. Inicie um envio em massa na aba do Painel de Disparo para ver o registro aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pequeno Gráfico de Barras - Taxa de Sucesso vs Falha (localStorage/Cache) */}
          <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="space-y-1 md:max-w-xs w-full text-center md:text-left">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100/65">
                LocalStorage Cache
              </span>
              <h4 className="text-xs font-extrabold text-slate-800">Desempenho Recente</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Taxa de sucesso versus falha das campanhas passadas armazenadas localmente. Passe o mouse sobre as barras para ver detalhes rápidos.
              </p>
            </div>
            
            <div className="w-full md:flex-1 h-28 min-w-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={minichartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  barGap={3}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={8}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={8}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip 
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2 rounded-lg shadow-lg border border-slate-800 text-[10px] space-y-1">
                            <p className="font-bold border-b border-slate-800 pb-1">{data.fullName}</p>
                            <p className="text-emerald-400 font-medium">✔ Sucesso: {data.Sucesso}</p>
                            <p className="text-rose-400 font-medium">✘ Falha: {data.Falha}</p>
                            <p className="text-slate-400 font-semibold border-t border-slate-800 pt-1">Total: {data.Total}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Sucesso" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={15} />
                  <Bar dataKey="Falha" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-700">
                    <th className="p-4 whitespace-nowrap">Data do Envio</th>
                    <th className="p-4 whitespace-nowrap">Nome da Campanha</th>
                    <th className="p-4 whitespace-nowrap">Assunto</th>
                    <th className="p-4 whitespace-nowrap text-center">Status final</th>
                    <th className="p-4 whitespace-nowrap text-center">Destinatários</th>
                    <th className="p-4 whitespace-nowrap text-center">Sucesso / Falha</th>
                    <th className="p-4 whitespace-nowrap text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item) => {
                    const isExpanded = expandedCampaignId === item.id;
                    const successRate = item.total > 0 ? Math.round((item.sent / item.total) * 100) : 0;
                    
                    return (
                      <React.Fragment key={item.id}>
                        <tr 
                          onClick={() => toggleExpand(item.id)}
                          className={`hover:bg-slate-50/50 transition cursor-pointer select-none ${isExpanded ? 'bg-indigo-50/15' : ''}`}
                        >
                          <td className="p-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {formatDate(item.date)}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-900 whitespace-nowrap max-w-[150px] truncate" title={item.templateName}>
                            {item.templateName}
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-600 max-w-[180px] truncate" title={item.subject}>
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {item.subject}
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                            }`}>
                              {item.status === 'completed' ? 'Concluído' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="p-4 text-center text-xs font-bold text-slate-700 whitespace-nowrap">
                            {item.total}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1 text-[11px] font-bold">
                                <span className="text-emerald-600">{item.sent}</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-rose-600">{item.failed}</span>
                              </div>
                              <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden border border-slate-200/30">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full" 
                                  style={{ width: `${successRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleExpand(item.id)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  isExpanded 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                                title={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                              >
                                {isExpanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => onRestore(item)}
                                className="p-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer"
                                title="Reutilizar dados desta campanha"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer"
                                title="Excluir do histórico"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Collapsible details row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="bg-slate-50/40 p-6 border-t border-slate-100">
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                
                                {/* Left column: Template snippet preview */}
                                <div className="lg:col-span-4 space-y-3.5">
                                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="h-4 w-4 text-indigo-500" />
                                    Modelo Utilizado
                                  </h4>
                                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-slate-600 block">Assunto da campanha:</span>
                                    </div>
                                    <div className="bg-slate-50 px-3 py-2 border border-slate-100 rounded-lg text-xs font-semibold text-slate-800 break-all leading-relaxed">
                                      {item.subject}
                                    </div>
                                    
                                    <div className="border-t border-slate-100 pt-3">
                                      <span className="text-xs font-bold text-slate-600 block mb-2">Visualização HTML Completa:</span>
                                      <div className="border border-slate-150 rounded-xl overflow-hidden h-60 bg-slate-50">
                                        <iframe
                                          srcDoc={item.template}
                                          title={`preview-${item.id}`}
                                          className="w-full h-full border-0 bg-white"
                                          sandbox="allow-same-origin"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right column: Recipients list saved in this campaign */}
                                <div className="lg:col-span-8 space-y-3.5">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                      <User className="h-4 w-4 text-indigo-500" />
                                      Destinatários Importados ({item.recipients?.length || 0})
                                    </h4>
                                    
                                    {/* Sub-filtering */}
                                    <div className="flex items-center gap-2">
                                      <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        <input
                                          type="text"
                                          placeholder="Filtrar nesta lista..."
                                          value={recipientSearch}
                                          onChange={(e) => {
                                            setRecipientSearch(e.target.value);
                                            setRecipientPage(0);
                                          }}
                                          className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 w-36 sm:w-48 font-medium text-slate-700"
                                        />
                                      </div>
                                      
                                      <select
                                        value={recipientFilter}
                                        onChange={(e) => {
                                          setRecipientFilter(e.target.value as any);
                                          setRecipientPage(0);
                                        }}
                                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none cursor-pointer font-bold text-slate-600"
                                      >
                                        <option value="all">Todos</option>
                                        <option value="success">Válidos</option>
                                        <option value="failed">Inválidos / Vazios</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <div className="overflow-x-auto max-h-[295px] overflow-y-auto">
                                      <table className="w-full text-left border-collapse">
                                        <thead>
                                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-600">
                                            <th className="p-2 whitespace-nowrap">Status Previsto</th>
                                            {getRecipientColumns(item.recipients).map((col, colIdx) => (
                                              <th key={colIdx} className="p-2 whitespace-nowrap border-l border-slate-200/40">{col}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {displayedRecipients.length === 0 ? (
                                            <tr>
                                              <td colSpan={10} className="p-8 text-center text-xs text-slate-400 font-medium">
                                                Nenhum destinatário corresponde aos filtros de busca.
                                              </td>
                                            </tr>
                                          ) : (
                                            displayedRecipients.map((rec, recIdx) => {
                                              const rEmail = rec.email || '';
                                              const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rEmail);
                                              return (
                                                <tr key={recIdx} className="hover:bg-slate-50/20 text-[11px]">
                                                  <td className="p-2 whitespace-nowrap">
                                                    {isEmailValid ? (
                                                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-[9px] font-bold border border-emerald-100/65">
                                                        Válido
                                                      </span>
                                                    ) : (
                                                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 px-2 py-0.5 rounded-full text-[9px] font-bold border border-rose-100/65">
                                                        Inválido
                                                      </span>
                                                    )}
                                                  </td>
                                                  {getRecipientColumns(item.recipients).map((col, colIdx) => (
                                                    <td key={colIdx} className="p-2 whitespace-nowrap text-slate-600 font-medium border-l border-slate-100/30">
                                                      {String(rec[col] ?? '')}
                                                    </td>
                                                  ))}
                                                </tr>
                                              );
                                            })
                                          )}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* Pagination inside details */}
                                    {recipientPageCount > 1 && (
                                      <div className="bg-slate-50/50 px-3 py-2 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-500">
                                        <span className="font-semibold text-slate-500">Pág <b>{recipientPage + 1}</b> de <b>{recipientPageCount}</b> ({filteredRecipients.length} no total)</span>
                                        <div className="flex gap-1.5">
                                          <button
                                            type="button"
                                            disabled={recipientPage === 0}
                                            onClick={() => setRecipientPage(p => p - 1)}
                                            className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg font-bold transition shadow-sm cursor-pointer text-slate-600"
                                          >
                                            Anterior
                                          </button>
                                          <button
                                            type="button"
                                            disabled={recipientPage === recipientPageCount - 1}
                                            onClick={() => setRecipientPage(p => p + 1)}
                                            className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg font-bold transition shadow-sm cursor-pointer text-slate-600"
                                          >
                                            Próxima
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Quick Reuse Alert */}
                                  <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <FileText className="h-5 w-5" />
                                      </div>
                                      <p className="text-xs font-medium text-slate-600 leading-relaxed max-w-sm">
                                        Use estes dados para retomar esta campanha ou gere um relatório PDF profissional para seus registros.
                                      </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setPdfExportModalState({isOpen: true, campaign: item})}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer border border-slate-200"
                                      >
                                        <FileDown className="h-3.5 w-3.5" />
                                        Exportar PDF
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onRestore(item)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                                      >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Carregar Campanha
                                      </button>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <HistoryDashboard history={history} />
        </div>
      )}
      <PdfExportModal 
        isOpen={pdfExportModalState.isOpen}
        campaign={pdfExportModalState.campaign}
        onClose={() => setPdfExportModalState({isOpen: false, campaign: null})}
        onConfirm={(config) => {
          if (pdfExportModalState.campaign) {
            generatePDF(pdfExportModalState.campaign, config);
            setPdfExportModalState({isOpen: false, campaign: null});
          }
        }}
        availableColumns={pdfExportModalState.campaign ? getRecipientColumns(pdfExportModalState.campaign.recipients) : []}
      />
    </div>
  );
}
