import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Percent, 
  Mail,
  CalendarRange
} from 'lucide-react';
import { CampaignHistory } from '../types';

interface HistoryDashboardProps {
  history: CampaignHistory[];
}

type ViewType = 'campaign' | 'daily';

export default function HistoryDashboard({ history }: HistoryDashboardProps) {
  const [viewType, setViewType] = useState<ViewType>('campaign');

  // Compute overall global stats
  const stats = useMemo(() => {
    let totalEmails = 0;
    let totalSent = 0;
    let totalFailed = 0;
    
    history.forEach(item => {
      totalEmails += item.total || 0;
      totalSent += item.sent || 0;
      totalFailed += item.failed || 0;
    });

    const successRate = totalEmails > 0 ? Math.round((totalSent / totalEmails) * 100) : 0;

    return {
      totalCampaigns: history.length,
      totalEmails,
      totalSent,
      totalFailed,
      successRate
    };
  }, [history]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    if (viewType === 'campaign') {
      // Show each campaign individually, oldest to newest (over time)
      return [...history]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => {
          const d = new Date(item.date);
          const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          return {
            name: item.templateName || 'Sem Nome',
            shortName: item.templateName 
              ? (item.templateName.length > 12 ? item.templateName.slice(0, 10) + '...' : item.templateName)
              : 'Sem Nome',
            date: dateStr,
            fullDate: d.toLocaleString('pt-BR'),
            Sucesso: item.sent,
            Falha: item.failed,
            Total: item.total,
            subject: item.subject
          };
        });
    } else {
      // Group and aggregate campaigns by calendar day
      const dailyMap: { [key: string]: { Sucesso: number; Falha: number; Total: number; date: string; fullDate: string } } = {};
      
      [...history]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(item => {
          const d = new Date(item.date);
          const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
          const fullDateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          
          if (!dailyMap[dateStr]) {
            dailyMap[dateStr] = {
              Sucesso: 0,
              Falha: 0,
              Total: 0,
              date: dateStr,
              fullDate: fullDateStr
            };
          }
          
          dailyMap[dateStr].Sucesso += item.sent;
          dailyMap[dateStr].Falha += item.failed;
          dailyMap[dateStr].Total += item.total;
        });

      return Object.values(dailyMap);
    }
  }, [history, viewType]);

  // Custom tooltips for nice styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = data.Total || (data.Sucesso + data.Falha);
      const successPct = total > 0 ? Math.round((data.Sucesso / total) * 100) : 0;
      
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-2 max-w-[240px]">
          <div className="border-b border-slate-800 pb-1.5">
            <p className="font-bold text-slate-200">{viewType === 'campaign' ? data.name : `Dia ${data.fullDate}`}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{data.fullDate || data.date}</p>
          </div>
          {viewType === 'campaign' && data.subject && (
            <p className="text-[10px] text-slate-300 italic truncate max-w-full">
              Assunto: "{data.subject}"
            </p>
          )}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between gap-6">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Sucesso:
              </span>
              <span className="font-bold font-mono">{data.Sucesso}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-rose-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Falha:
              </span>
              <span className="font-bold font-mono">{data.Falha}</span>
            </div>
            <div className="flex justify-between gap-6 border-t border-slate-800 pt-1 text-[11px]">
              <span className="text-slate-300 font-bold">Total Tentativas:</span>
              <span className="font-extrabold font-mono text-indigo-400">{total}</span>
            </div>
            <div className="flex justify-between gap-6 text-[10px] text-slate-400">
              <span>Taxa de Sucesso:</span>
              <span className="font-bold font-mono text-emerald-400">{successPct}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-8 border border-slate-200 rounded-2xl bg-slate-50/40 p-5 md:p-6 space-y-6" id="history-dashboard">
      
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shadow-sm">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">Métricas & Desempenho Visual</h4>
            <p className="text-xs text-slate-500">Análise de eficiência dos disparos e taxas de entrega</p>
          </div>
        </div>

        {/* View togglers */}
        <div className="inline-flex bg-slate-100 border border-slate-200 p-0.5 rounded-xl self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewType('campaign')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              viewType === 'campaign'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Por Campanha
          </button>
          <button
            type="button"
            onClick={() => setViewType('daily')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              viewType === 'daily'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            Por Dia
          </button>
        </div>
      </div>

      {/* Grid of aggregated indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Campaigns/Attempts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Volumetria Total</span>
            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h5 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{stats.totalEmails}</h5>
            <p className="text-[10px] text-slate-500 font-medium">E-mails tentados em {stats.totalCampaigns} campanhas</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Taxa de Entrega</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <h5 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{stats.successRate}%</h5>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <TrendingUp className="h-2.5 w-2.5" /> Eficiente
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Média ponderada de sucesso</p>
          </div>
        </div>

        {/* Total Success */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sucessos</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h5 className="text-xl font-extrabold text-emerald-600 font-mono tracking-tight">{stats.totalSent}</h5>
            <p className="text-[10px] text-slate-500 font-medium">Disparos enviados com êxito</p>
          </div>
        </div>

        {/* Total Failed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Falhas</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h5 className="text-xl font-extrabold text-rose-600 font-mono tracking-tight">{stats.totalFailed}</h5>
            <p className="text-[10px] text-slate-500 font-medium">Disparos recusados / inválidos</p>
          </div>
        </div>

      </div>

      {/* Main Chart Card */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h5 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          Análise de Status (Sucesso vs Falha)
        </h5>
        
        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 font-medium text-xs">
            Nenhum dado disponível para renderizar o gráfico.
          </div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey={viewType === 'campaign' ? 'shortName' : 'date'} 
                  stroke="#94a3b8" 
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>}
                />
                <Bar 
                  dataKey="Sucesso" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={45} 
                />
                <Bar 
                  dataKey="Falha" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={45} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
