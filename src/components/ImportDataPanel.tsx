import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, ArrowRight, Table, Check, RefreshCw, Trash2, Plus, Eye, X, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Recipient, VariableMapping } from '../types';

interface ImportDataPanelProps {
  recipients: Recipient[];
  columns: string[];
  mappings: VariableMapping[];
  onDataLoaded: (recipients: Recipient[], columns: string[]) => void;
  onRecipientsChanged?: (recipients: Recipient[]) => void;
  onMappingsChanged: (mappings: VariableMapping[]) => void;
  onClear: () => void;
}

export default function ImportDataPanel({
  recipients,
  columns,
  mappings,
  onDataLoaded,
  onRecipientsChanged,
  onMappingsChanged,
  onClear
}: ImportDataPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [error, setError] = useState('');
  const [previewPage, setPreviewPage] = useState(0);
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [newColumn, setNewColumn] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'invalid'>('all');

  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalFilter, setModalFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [modalPage, setModalPage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError('');
    setFileName(file.name);
    
    // Format file size
    const sizeInKb = file.size / 1024;
    setFileSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb.toFixed(0)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Falha ao ler dados do arquivo');
        
        const workbook = XLSX.read(data, { type: 'array', codepage: 1252 });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('A planilha selecionada não possui nenhuma aba (sheet).');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to json array of objects
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];
        
        if (json.length === 0) {
          throw new Error('A planilha está vazia!');
        }

        // Get headers/columns
        const allCols = Object.keys(json[0]);
        
        // Ensure there is at least an email column
        const emailColCandidates = ['email', 'e-mail', 'mail', 'destinatario', 'contato', 'recipient'];
        let matchedEmailCol = '';
        
        for (const col of allCols) {
          const normCol = col.toLowerCase().trim();
          if (emailColCandidates.some(c => normCol === c || normCol.includes(c))) {
            matchedEmailCol = col;
            break;
          }
        }

        // Parse recipients format
        const parsedRecipients: Recipient[] = json.map((row, index) => {
          const rec: Recipient = {
            id: `row_${index}_${Date.now()}`,
            email: matchedEmailCol ? String(row[matchedEmailCol]).trim() : '',
          };
          
          // Inject other values
          allCols.forEach((col) => {
            rec[col] = row[col];
          });
          
          return rec;
        });

        onDataLoaded(parsedRecipients, allCols);

        // Pre-configure initial mappings
        const initialMappings: VariableMapping[] = [];
        
        // Try to map default "email"
        if (matchedEmailCol) {
          initialMappings.push({ placeholder: 'email', columnName: matchedEmailCol });
        }

        // Try to map default "nome" / name
        const nameCol = allCols.find(c => {
          const l = c.toLowerCase();
          return l === 'nome' || l === 'name' || l.includes('nome_') || l.includes('name_') || l.includes('completo');
        });
        if (nameCol) {
          initialMappings.push({ placeholder: 'nome', columnName: nameCol });
        }

        // Try to map default "empresa" / company
        const companyCol = allCols.find(c => {
          const l = c.toLowerCase();
          return l === 'empresa' || l === 'company' || l === 'firma' || l.includes('empresa');
        });
        if (companyCol) {
          initialMappings.push({ placeholder: 'empresa', columnName: companyCol });
        }

        onMappingsChanged(initialMappings);
        setPreviewPage(0);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Falha ao ler planilha. Certifique-se de que é um formato válido .xlsx ou .csv.');
        onClear();
      }
    };

    reader.onerror = () => {
      setError('Erro de leitura do arquivo.');
      onClear();
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Manage variable mappings
  const addMapping = () => {
    if (!newPlaceholder || !newColumn) return;
    const cleanPlaceholder = newPlaceholder.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    
    if (!cleanPlaceholder) return;
    if (mappings.some(m => m.placeholder === cleanPlaceholder)) {
      alert('Esta variável já está mapeada!');
      return;
    }

    const updated = [...mappings, { placeholder: cleanPlaceholder, columnName: newColumn }];
    onMappingsChanged(updated);
    setNewPlaceholder('');
    setNewColumn('');
  };

  const removeMapping = (index: number) => {
    const updated = [...mappings];
    updated.splice(index, 1);
    onMappingsChanged(updated);
  };

  const updateMappingColumn = (index: number, colName: string) => {
    const updated = [...mappings];
    updated[index].columnName = colName;
    onMappingsChanged(updated);
  };

  const handleEmailChange = (recipientId: string, colName: string, newValue: string) => {
    const updatedRecipients = recipients.map(rec => {
      if (rec.id === recipientId) {
        // Also update both the dynamic column value and the root email property if the column is mapped to 'email'
        const isEmailColumn = colName === emailColumnName;
        return {
          ...rec,
          [colName]: newValue,
          ...(isEmailColumn ? { email: newValue.trim() } : {})
        };
      }
      return rec;
    });
    if (onRecipientsChanged) {
      onRecipientsChanged(updatedRecipients);
    }
  };

  const emailMapping = mappings.find(m => m.placeholder === 'email');
  const emailColumnName = emailMapping ? emailMapping.columnName : '';

  const getRecipientEmail = (rec: Recipient) => {
    if (emailColumnName && rec[emailColumnName] !== undefined) {
      return String(rec[emailColumnName] ?? '').trim();
    }
    return String(rec.email ?? '').trim();
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const getMappedPlaceholder = (colName: string) => {
    const found = mappings.find(m => m.columnName === colName);
    return found ? found.placeholder : null;
  };

  const filteredRecipients = recipients.filter(rec => {
    const email = getRecipientEmail(rec);
    const isValid = emailRegex.test(email);
    if (filterType === 'valid') return isValid;
    if (filterType === 'invalid') return !isValid;
    return true;
  });

  const pageSize = 5;
  const pageCount = Math.ceil(filteredRecipients.length / pageSize);
  
  // Safeguard page indexing when switching filters
  const actualPreviewPage = Math.min(previewPage, Math.max(0, pageCount - 1));
  const displayedRecipients = filteredRecipients.slice(actualPreviewPage * pageSize, (actualPreviewPage + 1) * pageSize);

  // Modal recipients filtering, searching, and pagination
  const modalFilteredRecipients = recipients.filter(rec => {
    const email = getRecipientEmail(rec);
    const isValid = emailRegex.test(email);
    
    // Filter by type
    if (modalFilter === 'valid' && !isValid) return false;
    if (modalFilter === 'invalid' && isValid) return false;
    
    // Filter by search term
    if (modalSearch.trim()) {
      const term = modalSearch.toLowerCase().trim();
      return columns.some(col => {
        const val = String(rec[col] ?? '').toLowerCase();
        return val.includes(term);
      });
    }
    
    return true;
  });

  const modalPageSize = 10;
  const modalPageCount = Math.ceil(modalFilteredRecipients.length / modalPageSize);
  const actualModalPage = Math.min(modalPage, Math.max(0, modalPageCount - 1));
  const modalDisplayedRecipients = modalFilteredRecipients.slice(actualModalPage * modalPageSize, (actualModalPage + 1) * modalPageSize);

  // Match columns to list
  const availableColumnsForMapping = columns.filter(col => col !== '');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6 animate-fade-in" id="import-data-panel">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/30">
            <Table className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Importação de Destinatários</h3>
            <p className="text-xs text-slate-500">Envie sua planilha Excel (.xlsx, .xls) ou CSV e mapeie os campos</p>
          </div>
        </div>
        {recipients.length > 0 && (
          <button
            id="clear-loaded-data"
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpar Planilha
          </button>
        )}
      </div>

      {/* Upload Zone */}
      {recipients.length === 0 ? (
        <div className="space-y-5">
          <div
            id="drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50/60 scale-[0.99] shadow-inner shadow-indigo-100/10'
                : 'border-slate-250 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="p-4 bg-white rounded-full shadow-md border border-slate-100 text-indigo-600">
              <Upload className="h-6 w-6 animate-bounce" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">Arraste e solte sua planilha aqui</p>
              <p className="text-xs text-slate-400 mt-1">Formatos suportados: .xlsx, .xls ou .csv</p>
            </div>
            <button
              id="select-file-btn"
              type="button"
              className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 transition cursor-pointer"
            >
              Selecionar Arquivo
            </button>
          </div>

          {error && (
            <div id="upload-error-alert" className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex gap-3 text-xs leading-relaxed">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Erro ao importar</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* Guidelines info */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-3.5 leading-relaxed">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Como formatar sua planilha:</h4>
            <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside">
              <li>Adicione uma coluna contendo os endereços de e-mail (ex: <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono font-medium">email</code>, <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono font-medium">E-mail</code>).</li>
              <li>A primeira linha da planilha deve conter os cabeçalhos de cada coluna.</li>
              <li>Crie colunas adicionais para as informações variáveis (ex: <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono font-medium">Nome</code>, <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono font-medium">Empresa</code>, <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono font-medium">Cidade</code>).</li>
              <li>Você poderá mapear esses cabeçalhos como tags no editor (ex: <code className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">{"{{nome}}"}</code>).</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Statistics Banner */}
          <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">{fileName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tamanho: <span className="font-semibold text-slate-600">{fileSize}</span> &bull; Total: <span className="font-bold text-indigo-700">{recipients.length} destinatários</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                id="view-recipients-modal-trigger"
                onClick={() => {
                  setModalSearch('');
                  setModalFilter('all');
                  setModalPage(0);
                  setShowRecipientsModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" /> Visualizar Destinatários
              </button>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-bold">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Planilha Carregada
              </span>
            </div>
          </div>

          {/* Real-time Email Validation Assistant */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
            recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length > 0 
              ? 'bg-amber-50/50 border-amber-200/80 text-amber-900 shadow-sm shadow-amber-50/10 animate-pulse' 
              : 'bg-emerald-50/40 border-emerald-200/50 text-emerald-900'
          }`}>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length > 0 ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Relatório de Validação em Tempo Real
                </h4>
              </div>
              
              {recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length > 0 ? (
                <p className="text-xs text-slate-600 leading-relaxed">
                  Encontramos <strong className="text-amber-700 font-bold">{recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length} de {recipients.length}</strong> destinatários com formatos de e-mail inválidos ou vazios. Eles podem falhar ao enviar ou gerar rejeições (bounce).
                </p>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">
                  Excelente! Todos os <strong className="text-emerald-700 font-bold">{recipients.length}</strong> destinatários possuem endereços de e-mail com formatos sintáticos válidos.
                </p>
              )}
            </div>

            {recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length > 0 && (
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  id="filter-invalid-emails"
                  onClick={() => {
                    setFilterType('invalid');
                    setPreviewPage(0);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'invalid'
                      ? 'bg-amber-600 border-amber-600 text-white shadow-sm shadow-amber-600/10'
                      : 'bg-white border-slate-200 hover:border-amber-300 text-slate-700 hover:bg-amber-50/50'
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Filtrar Inválidos
                </button>
                <button
                  type="button"
                  id="remove-invalid-emails"
                  onClick={() => {
                    const cleanRecipients = recipients.filter(rec => {
                      const email = getRecipientEmail(rec);
                      return emailRegex.test(email);
                    });
                    onDataLoaded(cleanRecipients, columns);
                    setPreviewPage(0);
                    setFilterType('all');
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover {recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length} Inválidos
                </button>
              </div>
            )}
          </div>

          {/* Column Mapping Section */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Mapeamento de Variáveis Dinâmicas</h4>
              <p className="text-xs text-slate-500 mt-1">
                Associe as tags que usará no corpo do e-mail com as colunas da planilha. A coluna com o e-mail do destinatário deve estar mapeada obrigatoriamente para a tag <code className="bg-slate-150 px-1 py-0.5 rounded text-indigo-700 font-semibold font-mono">email</code>.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 bg-slate-50 p-3.5 text-xs font-bold text-slate-700">
                <div className="col-span-5">Código da Tag (no Editor)</div>
                <div className="col-span-5">Coluna Correspondente (Planilha)</div>
                <div className="col-span-2 text-right">Ação</div>
              </div>

              {/* Mappings Rows */}
              {mappings.map((mapping, idx) => {
                const isEmailPlaceholder = mapping.placeholder === 'email';
                return (
                  <div key={idx} className="grid grid-cols-12 gap-4 items-center p-3.5 text-sm text-slate-700 bg-white hover:bg-slate-50/40">
                    <div className="col-span-5 flex items-center gap-2 font-mono text-xs">
                      <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-bold">
                        {"{{"}{mapping.placeholder}{"}}"}
                      </span>
                      {isEmailPlaceholder && <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-bold">Obrigatório</span>}
                    </div>
                    
                    <div className="col-span-5">
                      <select
                        id={`map-select-${mapping.placeholder}`}
                        value={mapping.columnName}
                        onChange={(e) => updateMappingColumn(idx, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none cursor-pointer font-medium"
                      >
                        <option value="">-- Selecione uma coluna --</option>
                        {availableColumnsForMapping.map((col, cIdx) => (
                          <option key={cIdx} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 text-right">
                      {!isEmailPlaceholder && (
                        <button
                          id={`remove-map-btn-${idx}`}
                          type="button"
                          onClick={() => removeMapping(idx)}
                          className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Remover Mapeamento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add New Custom Mapping Form */}
              <div className="bg-slate-50/50 p-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">{"{{"}</span>
                    <input
                      id="new-placeholder-input"
                      type="text"
                      placeholder="tag_personalizada"
                      value={newPlaceholder}
                      onChange={(e) => setNewPlaceholder(e.target.value)}
                      className="w-full pl-7 pr-7 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">{"}}"}</span>
                  </div>
                </div>

                <div className="col-span-5">
                  <select
                    id="new-placeholder-column-select"
                    value={newColumn}
                    onChange={(e) => setNewColumn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="">-- Selecione a coluna --</option>
                    {availableColumnsForMapping.map((col, cIdx) => (
                      <option key={cIdx} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 text-right">
                  <button
                    id="add-mapping-btn"
                    type="button"
                    onClick={addMapping}
                    disabled={!newPlaceholder || !newColumn}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 ml-auto shadow-sm hover:shadow-md transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Criar
                  </button>
                </div>
              </div>
            </div>
            {/* Warning if email column not mapped */}
            {!mappings.some(m => m.placeholder === 'email') && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex gap-3 items-center leading-relaxed">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Atenção:</strong> Você precisa mapear qual coluna contém os e-mails para podermos realizar o envio.</span>
              </div>
            )}
          </div>

          {/* Loaded Recipients Preview Table */}
          <div className="space-y-3.5 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Table className="h-4.5 w-4.5 text-indigo-500" />
                Visualização de Dados ({filteredRecipients.length} de {recipients.length} linhas)
              </h4>
              
              {/* Pill Filter Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 self-start sm:self-auto text-xs font-semibold">
                <button
                  type="button"
                  id="filter-all-btn"
                  onClick={() => { setFilterType('all'); setPreviewPage(0); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todos ({recipients.length})
                </button>
                <button
                  type="button"
                  id="filter-valid-btn"
                  onClick={() => { setFilterType('valid'); setPreviewPage(0); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === 'valid'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Válidos ({recipients.length - recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length})
                </button>
                <button
                  type="button"
                  id="filter-invalid-btn-toggle"
                  onClick={() => { setFilterType('invalid'); setPreviewPage(0); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === 'invalid'
                      ? 'bg-white text-rose-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Inválidos ({recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length})
                </button>
              </div>
            </div>
            
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-700">
                      <th className="p-3.5 whitespace-nowrap align-middle">Status</th>
                      {columns.map((col, idx) => {
                        const placeholder = getMappedPlaceholder(col);
                        const isEmailCol = col === emailColumnName;
                        return (
                          <th 
                            key={idx} 
                            className={`p-3.5 whitespace-nowrap font-bold text-slate-700 border-l border-slate-200/60 transition-colors duration-200 align-middle ${
                              isEmailCol 
                                ? 'bg-indigo-50/40 text-indigo-950' 
                                : placeholder 
                                ? 'bg-slate-100/50 text-slate-900' 
                                : ''
                            }`}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-xs tracking-tight">{col}</span>
                              {placeholder && (
                                <span 
                                  className={`inline-flex items-center self-start text-[9px] font-mono px-2 py-0.5 rounded-md font-bold border transition ${
                                    isEmailCol 
                                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                      : 'bg-slate-200 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {"{{"}{placeholder}{"}}"}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {displayedRecipients.map((rec, rIdx) => {
                      const emailVal = getRecipientEmail(rec);
                      const isEmailValid = emailRegex.test(emailVal);
                      return (
                        <tr 
                          key={rec.id || rIdx} 
                          className={`transition ${
                            isEmailValid 
                              ? 'hover:bg-slate-50/30' 
                              : 'bg-rose-50/20 hover:bg-rose-50/35 text-rose-900 border-l-4 border-l-rose-500'
                          }`}
                        >
                          <td className="p-3.5 whitespace-nowrap align-middle">
                            {isEmailValid ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200/60">
                                <Check className="h-2.5 w-2.5 text-emerald-600" /> Válido
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-200/60 animate-pulse">
                                <AlertTriangle className="h-2.5 w-2.5 text-rose-600" /> Inválido / Vazio
                              </span>
                            )}
                          </td>
                          {columns.map((col, cIdx) => {
                            const placeholder = getMappedPlaceholder(col);
                            const isEmailCol = col === emailColumnName;
                            const isCellInvalid = isEmailCol && !isEmailValid;
                            return (
                              <td 
                                key={cIdx} 
                                className={`p-2.5 whitespace-nowrap font-medium border-l border-slate-100/40 align-middle ${
                                  isCellInvalid 
                                    ? 'bg-rose-100/10' 
                                    : isEmailCol 
                                    ? 'bg-indigo-50/15' 
                                    : placeholder
                                    ? 'bg-slate-50/40'
                                    : ''
                                }`}
                              >
                                {isEmailCol ? (
                                  <div className="flex items-center gap-1.5 min-w-[200px]">
                                    <input
                                      type="text"
                                      value={String(rec[col] ?? '')}
                                      onChange={(e) => handleEmailChange(rec.id, col, e.target.value)}
                                      className={`w-full px-2.5 py-1 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-4 transition ${
                                        isCellInvalid
                                          ? 'bg-rose-50 border-rose-300 text-rose-800 focus:border-rose-500 focus:ring-rose-500/15'
                                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500/15'
                                      }`}
                                      placeholder="Digite o e-mail..."
                                    />
                                  </div>
                                ) : (
                                  <span className={`px-2 font-medium ${isCellInvalid ? 'text-rose-700 font-bold' : placeholder ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                                    {String(rec[col] ?? '')}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              {pageCount > 1 && (
                <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Página <b>{actualPreviewPage + 1}</b> de <b>{pageCount}</b></span>
                  <div className="flex gap-2">
                    <button
                      id="preview-prev-btn"
                      type="button"
                      disabled={actualPreviewPage === 0}
                      onClick={() => setPreviewPage(actualPreviewPage - 1)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white border border-slate-200 rounded-xl text-slate-600 font-bold transition shadow-sm cursor-pointer"
                    >
                      Anterior
                    </button>
                    <button
                      id="preview-next-btn"
                      type="button"
                      disabled={actualPreviewPage === pageCount - 1}
                      onClick={() => setPreviewPage(actualPreviewPage + 1)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white border border-slate-200 rounded-xl text-slate-600 font-bold transition shadow-sm cursor-pointer"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visualizar Destinatários Modal */}
      {showRecipientsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="recipients-modal-backdrop">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up" id="recipients-modal-container">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/30">
                  <Table className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Lista Completa de Destinatários</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fileName} &bull; Mostrando {modalFilteredRecipients.length} de {recipients.length} destinatários
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecipientsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Toolbar Filters & Search */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por email, nome, empresa..."
                  value={modalSearch}
                  onChange={(e) => {
                    setModalSearch(e.target.value);
                    setModalPage(0);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                />
                {modalSearch && (
                  <button
                    type="button"
                    onClick={() => { setModalSearch(''); setModalPage(0); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Status Pills */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => { setModalFilter('all'); setModalPage(0); }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    modalFilter === 'all'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todos ({recipients.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setModalFilter('valid'); setModalPage(0); }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    modalFilter === 'valid'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Válidos ({recipients.length - recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length})
                </button>
                <button
                  type="button"
                  onClick={() => { setModalFilter('invalid'); setModalPage(0); }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    modalFilter === 'invalid'
                      ? 'bg-white text-rose-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Inválidos ({recipients.filter(rec => !emailRegex.test(getRecipientEmail(rec))).length})
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto">
              {modalFilteredRecipients.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 z-10">
                    <tr>
                      <th className="p-3.5 whitespace-nowrap bg-slate-50 align-middle">Status de Envio</th>
                      {columns.map((col, idx) => {
                        const placeholder = getMappedPlaceholder(col);
                        const isEmailCol = col === emailColumnName;
                        return (
                          <th 
                            key={idx} 
                            className={`p-3.5 whitespace-nowrap bg-slate-50 font-bold text-slate-700 border-l border-slate-200/60 align-middle ${
                              isEmailCol 
                                ? 'bg-indigo-50/40 text-indigo-950' 
                                : placeholder 
                                ? 'bg-slate-100/50 text-slate-900' 
                                : ''
                            }`}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-xs tracking-tight">{col}</span>
                              {placeholder && (
                                <span 
                                  className={`inline-flex items-center self-start text-[9px] font-mono px-2 py-0.5 rounded-md font-bold border transition ${
                                    isEmailCol 
                                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                      : 'bg-slate-200 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {"{{"}{placeholder}{"}}"}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {modalDisplayedRecipients.map((rec, rIdx) => {
                      const emailVal = getRecipientEmail(rec);
                      const isEmailValid = emailRegex.test(emailVal);
                      return (
                        <tr 
                          key={rec.id || rIdx} 
                          className={`transition ${
                            isEmailValid 
                              ? 'hover:bg-slate-50/30' 
                              : 'bg-rose-50/25 hover:bg-rose-50/40 text-rose-900 border-l-4 border-l-rose-500'
                          }`}
                        >
                          <td className="p-3.5 whitespace-nowrap align-middle">
                            {isEmailValid ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200/60">
                                <Check className="h-2.5 w-2.5 text-emerald-600" /> Pronto
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-200/60">
                                <AlertTriangle className="h-2.5 w-2.5 text-rose-600" /> Email Inválido
                              </span>
                            )}
                          </td>
                          {columns.map((col, cIdx) => {
                            const placeholder = getMappedPlaceholder(col);
                            const isEmailCol = col === emailColumnName;
                            const isCellInvalid = isEmailCol && !isEmailValid;
                            return (
                              <td 
                                key={cIdx} 
                                className={`p-2.5 whitespace-nowrap font-medium border-l border-slate-100/40 align-middle ${
                                  isCellInvalid 
                                    ? 'bg-rose-100/10' 
                                    : isEmailCol 
                                    ? 'bg-indigo-50/15' 
                                    : placeholder
                                    ? 'bg-slate-50/40'
                                    : ''
                                }`}
                              >
                                {isEmailCol ? (
                                  <div className="flex items-center gap-1.5 min-w-[200px]">
                                    <input
                                      type="text"
                                      value={String(rec[col] ?? '')}
                                      onChange={(e) => handleEmailChange(rec.id, col, e.target.value)}
                                      className={`w-full px-2.5 py-1 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-4 transition ${
                                        isCellInvalid
                                          ? 'bg-rose-50 border-rose-300 text-rose-800 focus:border-rose-500 focus:ring-rose-500/15'
                                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500/15'
                                      }`}
                                      placeholder="Digite o e-mail..."
                                    />
                                  </div>
                                ) : (
                                  <span className={`px-2 font-medium ${isCellInvalid ? 'text-rose-700 font-bold' : placeholder ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                                    {String(rec[col] ?? '')}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                  <Table className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">Nenhum destinatário encontrado</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tente ajustar seus filtros ou termos de pesquisa.</p>
                </div>
              )}
            </div>

            {/* Pagination / Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-600">
                Mostrando <b>{modalFilteredRecipients.length > 0 ? actualModalPage * modalPageSize + 1 : 0}</b>-<b>{Math.min((actualModalPage + 1) * modalPageSize, modalFilteredRecipients.length)}</b> de <b>{modalFilteredRecipients.length}</b> contatos filtrados
              </span>
              
              {modalPageCount > 1 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actualModalPage === 0}
                    onClick={() => setModalPage(actualModalPage - 1)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white border border-slate-200 rounded-xl text-slate-600 font-bold transition shadow-sm cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={actualModalPage === modalPageCount - 1}
                    onClick={() => setModalPage(actualModalPage + 1)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white border border-slate-200 rounded-xl text-slate-600 font-bold transition shadow-sm cursor-pointer"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
