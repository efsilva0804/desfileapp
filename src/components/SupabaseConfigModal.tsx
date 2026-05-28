/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Key, Server, Settings, Check, Copy, AlertTriangle, RefreshCw } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, hasRealSupabase } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    
    setTimeout(() => {
      saveSupabaseConfig(url, anonKey);
      setSaveStatus('saved');
    }, 800);
  };

  const handleClear = () => {
    setUrl('');
    setAnonKey('');
    saveSupabaseConfig('', '');
  };

  const sqlCode = `-- 1. CRIAÇÃO DA TABELA DE LOOKS
create table public.looks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CRIAÇÃO DA TABELA DE COMENTÁRIOS
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  look_id uuid references public.looks(id) on delete cascade not null,
  author_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- HABILITAR ROW LEVEL SECURITY (RLS)
alter table public.looks enable row level security;
alter table public.comments enable row level security;

-- 3. POLÍTICAS DE SEGURANÇA (RLS)
-- Políticas para a tabela looks:
create policy "Looks acessíveis publicamente para leitura" on public.looks
  for select using (true);

create policy "Apenas administradores podem inserir looks" on public.looks
  for insert with check (auth.role() = 'authenticated');

create policy "Apenas administradores podem deletar looks" on public.looks
  for delete using (auth.role() = 'authenticated');

-- Políticas para a tabela comments:
create policy "Comentários acessíveis publicamente" on public.comments
  for select using (true);

create policy "Qualquer pessoa pode comentar" on public.comments
  for insert with check (true);

-- 4. STORAGE BUCKET: Crie um bucket público chamado "gallery-images"
-- Certifique-se de definir o bucket "gallery-images" como PUBLIC no painel do Supabase.
`;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div 
        id="supabase-config-card" 
        className="relative w-full max-w-2xl bg-[#121212] border border-neutral-800 rounded-lg p-6 md:p-8 text-neutral-200 shadow-2xl my-8"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold-950/50 border border-gold-500/30 rounded-lg text-gold-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-2xl tracking-wide text-white">Configuração Supabase</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Conecte o desfile à sua própria base de dados</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-neutral-800 rounded"
          >
            ✕
          </button>
        </div>

        {/* Current status banner */}
        <div className={`p-4 rounded-md border mb-6 text-sm flex gap-3 items-start ${
          hasRealSupabase 
            ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300' 
            : 'bg-gold-950/20 border-gold-500/20 text-gold-200'
        }`}>
          <Server className={`w-5 h-5 shrink-0 ${hasRealSupabase ? 'text-emerald-400' : 'text-gold-400'}`} />
          <div>
            <div className="font-semibold flex items-center gap-2">
              Status Atual: {hasRealSupabase ? 'Conectado no Supabase' : 'Modo Simulação Local (Offline)'}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {hasRealSupabase 
                ? 'A aplicação está conectada à sua instância oficial do Supabase em tempo real. Imagens enviadas irão para o seu bucket e registros para o PostgreSQL.' 
                : 'A aplicação está rodando em modo sandboxing de segurança. Os dados ficam salvos de forma responsiva no seu navegador de forma local, simulando todas as interações perfeitamente.'
              }
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-gold-500" />
              Supabase Project URL
            </label>
            <input 
              type="url"
              placeholder="https://suasupabaseurl.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-gold-500 outline-none rounded p-3 text-sm transition-colors text-white font-mono"
              required={!!anonKey}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-gold-500" />
              Supabase Anon Key
            </label>
            <input 
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-gold-500 outline-none rounded p-3 text-sm transition-colors text-white font-mono"
              required={!!url}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="flex-1 bg-gold-500 hover:bg-gold-600 active:scale-95 disabled:opacity-50 text-black py-2.5 px-4 font-medium rounded text-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Salvando e reiniciando...
                </>
              ) : (
                'Salvar e Conectar'
              )}
            </button>
            
            {hasRealSupabase && (
              <button
                type="button"
                onClick={handleClear}
                className="bg-neutral-800 hover:bg-red-950/50 border border-neutral-700 hover:border-red-800/40 text-neutral-400 hover:text-red-300 py-2.5 px-4 rounded text-sm transition-colors cursor-pointer"
              >
                Voltar Local (Demo)
              </button>
            )}
          </div>
        </form>

        {/* Database setup assistance */}
        <div className="mt-8 pt-6 border-t border-neutral-800/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-gold-500" />
              SQL para o SQL Editor do Supabase
            </div>
            <button
              onClick={() => copyToClipboard(sqlCode, 1)}
              className="text-xs font-mono text-gold-500 hover:text-gold-400 flex items-center gap-1 focus:outline-none transition-colors border border-gold-500/20 px-2 py-0.5 rounded cursor-pointer"
            >
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedIndex === 1 ? 'Copiado!' : 'Copiar SQL'}
            </button>
          </div>
          <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
            Para o funcionamento completo, crie um bucket público de Storage com o nome <code className="text-gold-400 font-mono">gallery-images</code> no Supabase, habilite RLS e execute as consultas SQL descritas abaixo:
          </p>
          <div className="bg-[#171717] rounded border border-neutral-800 p-3 h-36 overflow-y-auto font-mono text-[11px] text-neutral-400 leading-normal select-all">
            {sqlCode}
          </div>
        </div>
      </div>
    </div>
  );
}
