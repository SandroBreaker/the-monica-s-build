/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, Wand2, Hammer } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  mode: 'create' | 'morph';
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, mode, onClose, onSubmit }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await onSubmit(prompt);
      setPrompt('');
      onClose();
    } catch (err) {
      console.error(err);
      setError('A mágica falhou! Tente de novo.');
    } finally {
      setIsLoading(false);
    }
  };

  const isCreate = mode === 'create';
  // Changed from fuchsia to sky/blue
  const themeColor = isCreate ? 'sky' : 'amber';
  const themeBg = isCreate ? 'bg-sky-500' : 'bg-amber-500';
  const themeHover = isCreate ? 'hover:bg-sky-600' : 'hover:bg-amber-600';
  const themeLight = isCreate ? 'bg-sky-100' : 'bg-amber-100';
  const themeText = isCreate ? 'text-sky-600' : 'text-amber-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans">
      <div className={`bg-white rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col border-4 border-black ${isCreate ? 'border-black' : 'border-black'} animate-in fade-in zoom-in duration-200 scale-95 sm:scale-100 overflow-hidden`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b-4 border-black ${isCreate ? 'bg-sky-50' : 'bg-amber-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border-2 border-black ${themeLight} ${themeText}`}>
                {isCreate ? <Wand2 size={24} strokeWidth={2.5} /> : <Hammer size={24} strokeWidth={2.5} />}
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-900 uppercase">
                    {isCreate ? 'Novo Modelo' : 'Transformar'}
                </h2>
                <p className={`text-xs font-bold uppercase tracking-wide ${isCreate ? 'text-sky-500' : 'text-amber-500'}`}>
                    POWERED BY GEMINI 3
                </p>
            </div>
          </div>
          <button 
            onClick={!isLoading ? onClose : undefined}
            className="p-2 rounded-xl bg-white border-2 border-black text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-white">
          <p className="text-slate-800 font-bold mb-4">
            {isCreate 
                ? "O que vamos construir hoje?" 
                : "No que vamos transformar esses blocos?"}
          </p>
          
          <form onSubmit={handleSubmit}>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isCreate 
                ? "ex: Um castelo medieval, um robô gigante, uma cesta de frutas..." 
                : "ex: Transforme em um carro, faça uma pirâmide, vire um coelho..."}
              disabled={isLoading}
              className={`w-full h-32 resize-none bg-slate-50 border-4 border-slate-200 rounded-xl p-4 font-bold text-slate-700 focus:outline-none focus:ring-0 focus:border-black transition-all placeholder:text-slate-400 mb-4`}
              autoFocus
            />

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-600 text-sm font-bold flex items-center gap-2">
                <X size={16} /> {error}
              </div>
            )}

            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm transition-all border-4 border-black
                  ${isLoading 
                    ? 'bg-slate-200 text-slate-400 cursor-wait border-slate-400' 
                    : `${themeBg} ${themeHover} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1`}
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Pensando...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} fill="currentColor" />
                    Gerar!
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};