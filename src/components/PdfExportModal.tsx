import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CampaignHistory } from '../types';

interface PdfExportModalProps {
  isOpen: boolean;
  campaign: CampaignHistory | null;
  onClose: () => void;
  onConfirm: (config: { title: string, columns: string[] }) => void;
  availableColumns: string[];
}

export default function PdfExportModal({ isOpen, campaign, onClose, onConfirm, availableColumns }: PdfExportModalProps) {
  const [title, setTitle] = useState(campaign?.templateName || 'Relatório de Campanha');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(availableColumns);

  if (!isOpen || !campaign) return null;

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Configurar Exportação PDF</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Título do Relatório</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-3 uppercase">Selecione as colunas para o relatório</label>
            <div className="max-h-64 overflow-y-auto pr-2 -mr-2 space-y-2">
              {availableColumns.map(col => (
                <label key={col} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedColumns.includes(col)}
                    onChange={() => toggleColumn(col)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 font-medium">{col}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800">Cancelar</button>
          <button 
            onClick={() => onConfirm({ title, columns: selectedColumns })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20"
          >
            Confirmar Exportação
          </button>
        </div>
      </div>
    </div>
  );
}
