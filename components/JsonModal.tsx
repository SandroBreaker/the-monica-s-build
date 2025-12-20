/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { X, FileJson, Upload, Copy, Check } from 'lucide-react';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: string;
  isImport?: boolean;
  onImport?: (json: string) => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({ isOpen, onClose, data = '', isImport = false, onImport }) => {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
      if (isOpen) {
          setImportText('');
          setError('');
          setIsCopied(false);
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImportClick = () => {
      if (!importText.trim()) {
          setError('Por favor, cole o JSON primeiro.');
          return;
      }
      try {
          JSON.parse(importText); // Simple validation
          if (onImport) {
              onImport(importText);
              onClose();
          }
      } catch (e) {
          setError('Formato JSON inválido. Verifique o código.');
      }
  };

  const handleCopy = async () => {
      if (!data) return;
      try {
          await navigator.clipboard.writeText(data);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
          console.error('Failed to copy:', err);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md p-4 font-sans">
      <div className="bg-white rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl flex flex-col h-[70vh] border-4 border-black animate-in fade-in zoom-in duration-200 scale-95 sm:scale-100">
        
        <div className="flex items-center justify-between p-6 border-b-4 border-black bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border-2 border-black ${isImport ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                {isImport ? <Upload size={24} strokeWidth={2.5} /> : <FileJson size={24} strokeWidth={2.5} />}
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-800 uppercase">
                    {isImport ? 'Importar' : 'Copiar Modelo'}
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Formato JSON</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white border-2 border-black text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden bg-slate-50/50 flex flex-col relative">
          <textarea 
            readOnly={!isImport}
            value={isImport ? importText : data}
            onChange={isImport ? (e) => setImportText(e.target.value) : undefined}
            placeholder={isImport ? "Cole o código JSON dos voxels aqui..." : ""}
            className={`w-full h-full resize-none bg-white border-2 rounded-xl p-4 font-mono text-xs text-slate-600 focus:outline-none transition-all ${isImport ? 'border-emerald-200 focus:border-black' : 'border-slate-200 focus:border-black'}`}
          />
          
          {isImport && error && (
              <div className="absolute bottom-8 left-8 right-8 bg-rose-100 text-rose-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-rose-200 animate-in slide-in-from-bottom-2">
                  {error}
              </div>
          )}
        </div>

        <div className="p-6 border-t-4 border-black flex justify-end bg-white rounded-b-[1.7rem] gap-3">
          {isImport ? (
              <>
                <button 
                    onClick={onClose}
                    className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors border-2 border-transparent hover:border-slate-200"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleImportClick}
                    className="px-6 py-3 bg-emerald-500 text-white text-sm font-black rounded-xl hover:bg-emerald-400 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black active:shadow-none active:translate-x-1 active:translate-y-1"
                >
                    Importar
                </button>
              </>
          ) : (
              <>
                <button
                    onClick={handleCopy}
                    className={`
                        flex items-center gap-2 px-6 py-3 text-sm font-black rounded-xl transition-all border-2 border-black active:shadow-none active:translate-x-1 active:translate-y-1
                        ${isCopied 
                            ? 'bg-emerald-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                            : 'bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400'}
                    `}
                >
                    {isCopied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={2.5} />}
                    {isCopied ? 'Copiado!' : 'Copiar Tudo'}
                </button>
                <button 
                    onClick={onClose}
                    className="px-6 py-3 bg-slate-800 text-white text-sm font-black rounded-xl hover:bg-slate-900 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black active:shadow-none active:translate-x-1 active:translate-y-1"
                >
                    Fechar
                </button>
              </>
          )}
        </div>

      </div>
    </div>
  );
};