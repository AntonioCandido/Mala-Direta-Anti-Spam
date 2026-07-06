import React, { useState } from 'react';
import { ShieldCheck, Zap, Watch, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';
import { AntiSpamConfig } from '../types';

interface AntiSpamConfigPanelProps {
  config: AntiSpamConfig;
  onChange: (updated: AntiSpamConfig) => void;
}

const SAFETY_PRESETS = {
  conservative: {
    name: 'Super Seguro (Conservador)',
    minDelay: 10,
    maxDelay: 25,
    batchSize: 30,
    batchPauseTime: 15,
    description: 'Recomendado para contas Gmail/Outlook novas ou sem histórico de envio aquecido. Minimiza ao máximo o risco de bloqueio.',
  },
  recommended: {
    name: 'Padrão Recomendado',
    minDelay: 3,
    maxDelay: 8,
    batchSize: 50,
    batchPauseTime: 10,
    description: 'Equilíbrio ideal entre velocidade de entrega e segurança contra filtros inteligentes de spam.',
  },
  fast: {
    name: 'Avançado (Rápido)',
    minDelay: 1,
    maxDelay: 3,
    batchSize: 100,
    batchPauseTime: 5,
    description: 'Para servidores SMTP dedicados ou relés empresariais com alta tolerância a disparos concorrentes.',
  }
};

export default function AntiSpamConfigPanel({ config, onChange }: AntiSpamConfigPanelProps) {
  const [activePreset, setActivePreset] = useState<keyof typeof SAFETY_PRESETS | 'custom'>('recommended');

  const applyPreset = (key: keyof typeof SAFETY_PRESETS) => {
    setActivePreset(key);
    onChange({
      minDelay: SAFETY_PRESETS[key].minDelay,
      maxDelay: SAFETY_PRESETS[key].maxDelay,
      batchSize: SAFETY_PRESETS[key].batchSize,
      batchPauseTime: SAFETY_PRESETS[key].batchPauseTime,
    });
  };

  const handleFieldChange = (field: keyof AntiSpamConfig, val: number) => {
    setActivePreset('custom');
    onChange({
      ...config,
      [field]: val
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6" id="anti-spam-config-panel">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Controles de Anti-Spam</h3>
            <p className="text-xs text-slate-500">Ajuste os atrasos e lotes de disparo para proteger a entregabilidade</p>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-3.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Perfil de Segurança Anti-Spam</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(SAFETY_PRESETS) as Array<keyof typeof SAFETY_PRESETS>).map((key) => (
            <button
              key={key}
              id={`safety-preset-${key}`}
              type="button"
              onClick={() => applyPreset(key)}
              className={`p-4 text-left rounded-2xl border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                activePreset === key
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-sm">{SAFETY_PRESETS[key].name}</span>
                {key === 'recommended' && (
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${activePreset === key ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'}`}>
                    Ideal
                  </span>
                )}
              </div>
              <p className={`text-[10px] leading-relaxed mt-1.5 ${activePreset === key ? 'text-indigo-100' : 'text-slate-500'}`}>{SAFETY_PRESETS[key].description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1.5">
        
        {/* Min Delay Slider/Input */}
        <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Watch className="h-4 w-4 text-indigo-500" />
              Atraso Mínimo (Mala Direta)
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{config.minDelay} segundos</span>
          </div>
          <input
            id="slider-min-delay"
            type="range"
            min="1"
            max="60"
            value={config.minDelay}
            onChange={(e) => handleFieldChange('minDelay', parseInt(e.target.value) || 1)}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 font-medium">Tempo mínimo de espera entre o envio de cada e-mail.</p>
        </div>

        {/* Max Delay Slider/Input */}
        <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-indigo-500" />
              Atraso Máximo (Aleatório)
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{config.maxDelay} segundos</span>
          </div>
          <input
            id="slider-max-delay"
            type="range"
            min="1"
            max="120"
            value={config.maxDelay}
            onChange={(e) => handleFieldChange('maxDelay', Math.max(config.minDelay, parseInt(e.target.value) || 1))}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 font-medium">Tempo máximo de espera. O sistema varia o delay entre o mínimo e o máximo.</p>
        </div>

        {/* Batch Size Selection */}
        <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-indigo-500" />
              Tamanho do Lote
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{config.batchSize} e-mails</span>
          </div>
          <input
            id="slider-batch-size"
            type="range"
            min="5"
            max="500"
            step="5"
            value={config.batchSize}
            onChange={(e) => handleFieldChange('batchSize', parseInt(e.target.value) || 5)}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 font-medium">O envio será interrompido para uma pausa maior ao atingir esse número de disparos.</p>
        </div>

        {/* Batch Pause Time Selection */}
        <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Watch className="h-4 w-4 text-indigo-500" />
              Tempo de Pausa do Lote
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{config.batchPauseTime} minutos</span>
          </div>
          <input
            id="slider-batch-pause"
            type="range"
            min="1"
            max="60"
            value={config.batchPauseTime}
            onChange={(e) => handleFieldChange('batchPauseTime', parseInt(e.target.value) || 1)}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 font-medium">Duração da pausa obrigatória do lote antes de retomar o próximo grupo.</p>
        </div>
      </div>

      {/* Explanatory text of spam filters */}
      <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/45 text-xs text-indigo-950 flex gap-3.5 leading-relaxed">
        <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Por que a variação dinâmica de delay é vital?</p>
          <p className="text-indigo-900 leading-relaxed">
            Filtros anti-spam de grandes provedores como Gmail, Yahoo e Outlook monitoram o comportamento de disparos. 
            Envios em massa idênticos com intervalos fixos (ex: 1 e-mail a cada exatos 2 segundos) acionam alarmes de automação robótica. 
            Ao definir uma <strong>variação de atraso dinâmico</strong> (ex: delay aleatório entre 3s e 8s), simulamos um envio com comportamento humano e orgânico, garantindo que suas mensagens parem na Caixa de Entrada e não no SPAM.
          </p>
        </div>
      </div>
    </div>
  );
}
