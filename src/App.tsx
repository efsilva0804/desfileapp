/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  HashRouter, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useLocation,
  useSearchParams
} from 'react-router-dom';
import { 
  Camera, 
  Database, 
  Image, 
  Trash2, 
  MessageSquare, 
  QrCode, 
  LogOut, 
  Sparkles, 
  Upload, 
  Lock, 
  Clock, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  RefreshCw,
  Eye,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Custom library core
import { db, authService, hasRealSupabase } from './lib/supabase';
import { Look, Comment } from './types';

// Modals
import SupabaseConfigModal from './components/SupabaseConfigModal';
import QRCodeDisplayModal from './components/QRCodeDisplayModal';
import LookScanDetailModal from './components/LookScanDetailModal';
import VirtualQRScanner from './components/VirtualQRScanner';

// ----------------------------------------------------------------------
// MAIN APPLICATION LAYOUT & ROUTER WRAPPER
// ----------------------------------------------------------------------

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // DB States
  const [looks, setLooks] = useState<Look[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loadingLooks, setLoadingLooks] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Modal Triggers
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedLook, setSelectedLook] = useState<Look | null>(null);
  const [activeQRTarget, setActiveQRTarget] = useState<Look | null>(null);

  // Toast HUD state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- DATA LOADING & SUBSCRIPTIONS ---
  const reloadData = async () => {
    setLoadingLooks(true);
    try {
      const dbLooks = await db.getLooks();
      setLooks(dbLooks);
      
      const dbComments = await db.getComments();
      setAllComments(dbComments);
    } catch (err) {
      console.error('Failed to load initial desfile gallery state:', err);
    } finally {
      setLoadingLooks(false);
    }
  };

  // Monitor deep linked scan parameter: ?look_id=UUID
  useEffect(() => {
    const lookIdParam = searchParams.get('look_id');
    if (lookIdParam && looks.length > 0) {
      const match = looks.find(l => l.id === lookIdParam);
      if (match) {
        setSelectedLook(match);
        // Clear param to avoid keeping modal open on fresh clicks
        const copy = new URLSearchParams(searchParams);
        copy.delete('look_id');
        setSearchParams(copy);
        showToast(`Look "${match.title}" escaneado com sucesso!`, 'success');
      } else {
        showToast('Look escaneado não encontrado no banco de dados.', 'error');
      }
    }
  }, [searchParams, looks, setSearchParams]);

  useEffect(() => {
    reloadData();

    // Subscribe to Auth status changes
    const unsubAuth = authService.subscribeToAuth((user) => {
      setCurrentUser(user);
    });

    // Subscribe to comments REALTIME Postgres events
    const unsubComments = db.subscribeToComments((newComment) => {
      setAllComments(prev => [newComment, ...prev]);
      
      // Update targeted look comments inline if modal is active on that look
      showToast(`Novo comentário de ${newComment.author_name} no mural!`, 'info');
    });

    // Refresh looking lists on local updates
    const handleLooksUpdate = () => {
      db.getLooks().then(setLooks);
    };
    window.addEventListener('local_looks_changed', handleLooksUpdate);

    return () => {
      unsubAuth();
      unsubComments();
      window.removeEventListener('local_looks_changed', handleLooksUpdate);
    };
  }, []);

  const handleAdminLogout = async () => {
    try {
      await authService.logout();
      showToast('Sessão encerrada com sucesso.', 'success');
      navigate('/');
    } catch (err: any) {
      showToast('Falha ao deslogar: ' + err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-gold-500 selection:text-black">
      
      {/* Top Banner indicating Supabase connection mode */}
      <div className="bg-[#121212] border-b border-neutral-900 text-xs px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span className={`w-2 h-2 rounded-full ${hasRealSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-gold-500'}`} />
            <span>
              {hasRealSupabase 
                ? 'Conectado ao seu Supabase Real' 
                : 'Rodando no Modo Simulação Inteligente (Dados locais)'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-gold-500 hover:text-gold-400 font-medium flex items-center gap-1 transition-colors hover:underline cursor-pointer"
            >
              <Database className="w-3 h-3" />
              {hasRealSupabase ? 'Ver Configuração' : 'Conectar Supabase Real'}
            </button>
            <span className="text-neutral-700">|</span>
            <span className="text-[10px] text-neutral-500 font-mono">ID: {location.pathname}</span>
          </div>
        </div>
      </div>

      {/* GLOBAL HIGH-FASHION MAIN HEADER */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800 h-20 flex items-center justify-between px-6 md:px-12 shrink-0">
        <Link to="/" className="flex items-center gap-1.5 focus:outline-none">
          <h1 className="text-2xl font-semibold tracking-tighter uppercase font-sans hover:text-gold-400 transition-colors text-white">
            Desfile<span className="gold-accent">•</span>Galeria
          </h1>
        </Link>

        {/* Navigation Bar */}
        <nav className="flex items-center gap-6 md:gap-10 text-sm uppercase tracking-widest font-medium text-zinc-400">
          <Link 
            to="/" 
            className={`transition-colors pb-0.5 ${
              location.pathname === '/' ? 'text-white border-b border-[#D4AF37]' : 'hover:text-white'
            }`}
          >
            Galeria
          </Link>
          <Link 
            to="/mural" 
            className={`transition-colors pb-0.5 ${
              location.pathname === '/mural' ? 'text-white border-b border-[#D4AF37]' : 'hover:text-white'
            }`}
          >
            Mural
          </Link>
          <Link 
            to="/admin" 
            className={`transition-colors pb-0.5 ${
              location.pathname === '/admin' ? 'text-white border-b border-[#D4AF37]' : 'hover:text-white'
            }`}
          >
            Admin
          </Link>

          {/* If Auth Admin is active, show signout helper */}
          {currentUser && (
            <button
              onClick={handleAdminLogout}
              title="Sair como Administrador"
              className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-all cursor-pointer flex items-center gap-1 ml-2 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-mono text-[10px]">Sair</span>
            </button>
          )}
        </nav>
      </header>

      {/* APP ELEMENT TOAST MANAGER */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded border text-xs shadow-2xl flex items-center gap-2 max-w-sm ${
              toast.type === 'success' 
                ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300' 
                : toast.type === 'error'
                ? 'bg-red-950/95 border-red-500/30 text-red-300'
                : 'bg-indigo-950/95 border-indigo-500/30 text-indigo-300'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-neutral-400 hover:text-white ml-2">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE FRAME ROUTERS */}
      <main className="flex-grow w-full px-4 md:px-8 py-8 md:py-12">
        <Routes>
          
          {/* GALERIA INDEX PAGE */}
          <Route path="/" element={
            <div className="max-w-7xl mx-auto space-y-16">
              
              {/* IMMERSIVE HERO SEGMENT */}
              <div className="text-center max-w-3xl mx-auto space-y-6 pt-4">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-neutral-950 border border-zinc-800 rounded-sm text-[10px] text-gold-400 font-mono select-none uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Concurso de Frases • Participe da Plateia
                </div>
                <h1 className="font-serif text-4xl md:text-6xl font-light tracking-tight text-white leading-tight">
                  A passarela <span className="text-[#D4AF37] italic font-serif">vista</span> por quem assistiu
                </h1>
                <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto font-sans font-light tracking-wide leading-relaxed">
                  Cada look possui um QR Code único. Escaneie-o, envie seu comentário em tempo real e concorra ao prêmio.
                </p>

                {/* Main QR Simulator Activation Trigger */}
                <div className="pt-4">
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="bg-[#D4AF37] hover:bg-[#cfa52b] text-black font-semibold uppercase tracking-widest text-xs px-8 py-4 rounded-sm transition-all duration-300 shadow-xl shadow-gold-500/5 active:scale-95 inline-flex items-center gap-3 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Escanear QR Code de Look
                  </button>
                </div>
              </div>

              {/* CLOTHES GRID SHOWCASE */}
              <div>
                <div className="flex items-center justify-between mb-8 pb-3 border-b border-zinc-900">
                  <div className="text-xs uppercase tracking-[0.2em] font-sans font-bold text-zinc-400">
                    Looks em Exibição ({looks.length})
                  </div>
                  <span className="text-[10px] uppercase font-sans tracking-widest text-zinc-600">Arraste ou clique para expandir</span>
                </div>

                {loadingLooks ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className="bg-neutral-900/50 aspect-[3/4] rounded-sm animate-pulse"></div>
                    ))}
                  </div>
                ) : looks.length === 0 ? (
                  // Empty State styling box
                  <div className="border border-dashed border-zinc-800 rounded-sm p-16 text-center max-w-md mx-auto bg-neutral-950/20">
                    <Image className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                    <h4 className="font-serif text-lg text-white font-medium">Nenhum look cadastrado ainda.</h4>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Como administrador cadastrado, acesse a aba "Admin" para adicionar looks no catálogo do desfile!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {looks.map((look, i) => (
                      <motion.div
                        key={look.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="bg-[#121212] border border-zinc-900 rounded-sm overflow-hidden group hover:border-[#D4AF37]/35 transition-all duration-300 flex flex-col justify-between"
                      >
                        {/* Outfits photo relative */}
                        <div className="relative aspect-[3/4] bg-black overflow-hidden cursor-pointer" onClick={() => setSelectedLook(look)}>
                          <img 
                            src={look.image_url} 
                            alt={look.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="card-overlay absolute inset-0 opacity-80 group-hover:opacity-65 transition-opacity"></div>
                          
                          {/* Top floating metadata */}
                          <div className="absolute top-4 left-4 bg-black/85 backdrop-blur-md border border-zinc-800 rounded-sm px-2.5 py-1 text-[9px] font-mono text-zinc-400">
                            LOOK #{look.id.slice(0, 4).toUpperCase()}
                          </div>

                          {/* Trigger scan animation details on hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="bg-[#D4AF37] text-black font-semibold text-xs tracking-widest uppercase py-3 px-5 rounded-sm flex items-center gap-2 shadow-lg shadow-gold-500/10 pointer-events-auto">
                              <Eye className="w-4 h-4" /> Ver e Comentar
                            </span>
                          </div>
                        </div>

                        {/* Title panel bottom */}
                        <div className="p-4 flex items-center justify-between gap-3 bg-black">
                          <div className="truncate">
                            <h4 className="font-serif text-base text-zinc-200 group-hover:text-gold-400 transition-colors font-medium truncate">
                              {look.title}
                            </h4>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Publicado às {new Date(look.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Quick scanning modal displayer toggle */}
                          <button
                            onClick={() => setActiveQRTarget(look)}
                            title="Gerar QR Code de Passarela"
                            className="p-2 border border-zinc-800 hover:border-[#D4AF37] text-zinc-500 hover:text-[#D4AF37] rounded-sm transition-colors bg-neutral-950 cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          } />

          {/* MURAL DE COMENTÁRIOS COM FEED REALTIME */}
          <Route path="/mural" element={
            <div className="max-w-4xl mx-auto space-y-12">
              
              {/* HERO SEGMENT */}
              <div className="text-center space-y-4 pt-4">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#D4AF37] uppercase block">
                  Mural de Opiniões & Sentenças
                </span>
                <h2 className="font-serif text-4xl md:text-5xl text-white font-light tracking-wide">
                  Vozes da plateia
                </h2>
                <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Frases enviadas em tempo real pelas pessoas que escanearam os QR Codes da passarela escolar.
                </p>
              </div>

              {/* TIMELINE LIST */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> Feed de Sentenças Concorrentes ({allComments.length})
                  </div>
                  <div className="text-[9px] uppercase font-mono tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Supabase Realtime
                  </div>
                </div>

                {allComments.length === 0 ? (
                  // Empty State styling box
                  <div className="border border-dashed border-zinc-800 rounded-sm p-16 text-center bg-neutral-950/20">
                    <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                    <h4 className="font-serif text-lg text-white font-medium">Nenhum comentário enviado.</h4>
                    <p className="text-xs text-zinc-500 mt-2">Visite a Galeria, escaneie os QR codes e seja o primeiro a deixar sua frase!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {allComments.map((comm) => (
                        <motion.div
                          key={comm.id}
                          initial={{ opacity: 0, x: -10, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: 'auto' }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          className="bg-[#121212] border border-zinc-900 rounded-sm p-6 hover:border-[#D4AF37]/25 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex-grow space-y-3">
                            <div className="flex items-center gap-2.5">
                              <span className="font-semibold tracking-wider text-[9px] uppercase text-[#D4AF37] bg-neutral-950 border border-zinc-800 px-2.5 py-1 rounded-sm flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" /> Look: {comm.look_title}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">{new Date(comm.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <p className="font-serif italic text-base md:text-lg text-zinc-100 leading-relaxed pl-1">
                              "{comm.content}"
                            </p>
                          </div>

                          <div className="md:text-right border-t md:border-t-0 border-zinc-900 pt-4 md:pt-0 shrink-0">
                            <div className="text-sm text-white font-semibold flex items-center md:justify-end gap-1.5">
                              <User className="w-4 h-4 text-[#D4AF37]" />
                              {comm.author_name}
                            </div>
                            <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider mt-0.5">
                              Participante do Desfile
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          } />

          {/* ADMIN AUTH E DASHBOARD / GERENCIADOR */}
          <Route path="/admin" element={
            <div className="max-w-4xl mx-auto space-y-10">
              <AdminView 
                looks={looks} 
                onReloadLooks={reloadData} 
                onShowToast={showToast} 
                activeUser={currentUser}
                onShowQR={(look) => setActiveQRTarget(look)}
              />
            </div>
          } />

        </Routes>
      </main>

      {/* FOOTER GLOBAL */}
      <footer className="h-16 border-t border-zinc-900 bg-black flex items-center justify-center mt-16 px-4">
        <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-semibold font-sans text-center">
          Desfile Escolar <span className="mx-3 text-zinc-800">·</span> O melhor comentário será premiado
        </span>
      </footer>

      {/* RENDER DYNAMIC WINDOW OVERLAYS */}
      <SupabaseConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
      />

      {activeQRTarget && (
        <QRCodeDisplayModal 
          look={activeQRTarget}
          isOpen={!!activeQRTarget}
          onClose={() => setActiveQRTarget(null)}
          onSimulateScan={(lookId) => {
            const matchedLook = looks.find(l => l.id === lookId);
            if (matchedLook) {
              setSelectedLook(matchedLook);
            }
          }}
        />
      )}

      {selectedLook && (
        <LookScanDetailModal
          look={selectedLook}
          isOpen={!!selectedLook}
          onClose={() => setSelectedLook(null)}
          onCommentAdded={() => {
            // Hotreload comments on dashboard
            db.getComments().then(setAllComments);
          }}
        />
      )}

      {isScannerOpen && (
        <VirtualQRScanner
          looks={looks}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(lookId) => {
            const matchedLook = looks.find(l => l.id === lookId);
            if (matchedLook) {
              setSelectedLook(matchedLook);
              setIsScannerOpen(false);
            }
          }}
        />
      )}

    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-SEGMENT: ADMIN LOGIN GATEWAY & MAIN DASHBOARD
// ----------------------------------------------------------------------

interface AdminViewProps {
  looks: Look[];
  onReloadLooks: () => Promise<void>;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeUser: any | null;
  onShowQR: (look: Look) => void;
}

function AdminView({ looks, onReloadLooks, onShowToast, activeUser, onShowQR }: AdminViewProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Add Look Form states
  const [newTitle, setNewTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingLook, setUploadingLook] = useState(false);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoadingAction(true);
    try {
      if (isLoginView) {
        await authService.login(email, password);
        onShowToast('Autenticado com sucesso como Administrador.', 'success');
      } else {
        await authService.signUp(email, password);
        onShowToast('Conta criada com sucesso! Você agora é administrador.', 'success');
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Falha no login/cadastro escolar.', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        onShowToast('Foto do look muito pesada. Limite máximo de 5MB.', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCreateLook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onShowToast('Digite um título para o look.', 'error');
      return;
    }
    if (!selectedFile) {
      onShowToast('Por favor, faça upload de uma foto da peça.', 'error');
      return;
    }

    setUploadingLook(true);
    try {
      await db.addLook(newTitle.trim(), selectedFile);
      onShowToast('Peça de moda publicada com sucesso no desfile!', 'success');
      setNewTitle('');
      setSelectedFile(null);
      // Reset input element
      const fileInput = document.getElementById('look-file-uploader') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await onReloadLooks();
    } catch (err: any) {
      console.error(err);
      onShowToast('Falha ao adicionar look: ' + (err.message || 'Erro inesperado'), 'error');
    } finally {
      setUploadingLook(false);
    }
  };

  const handleDeleteLook = async (id: string, titleName: string) => {
    if (!confirm(`Deseja mesmo remover o "${titleName}" e todos os seus comentários associados?`)) {
      return;
    }

    try {
      await db.deleteLook(id);
      onShowToast('Peça excluída com sucesso do catálogo.', 'success');
      await onReloadLooks();
    } catch (err: any) {
      console.error(err);
      onShowToast('Falha ao desativar look: ' + err.message, 'error');
    }
  };

  // --- RENDERING IF NOT AUTHENTICATED (LOGIN BOX) ---
  if (!activeUser) {
    return (
      <div 
        id="admin-auth-panel"
        className="max-w-md mx-auto bg-[#121212] border border-neutral-800 rounded-lg p-6 md:p-8 shadow-2xl text-neutral-200"
      >
        <div className="text-center space-y-2 mb-6">
          <div className="w-10 h-10 bg-gold-950/40 border border-gold-500/20 rounded flex items-center justify-center mx-auto text-gold-500">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-2xl text-white tracking-wide">Área Admin</h3>
          <p className="text-xs text-neutral-400">
            O primeiro cadastro vira admin automaticamente.
          </p>
        </div>

        <form onSubmit={handleAdminAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">E-mail de Acesso</label>
            <input 
              type="email" 
              placeholder="ex: admin@desfile.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-gold-500 outline-none rounded p-3 text-xs text-white transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-medium">Senha</label>
            <input 
              type="password" 
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-gold-500 outline-none rounded p-3 text-xs text-white transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loadingAction}
            className="w-full bg-gold-500 hover:bg-gold-600 active:scale-[0.98] disabled:opacity-50 text-black py-2.5 px-4 font-semibold rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            {loadingAction ? (
              'Processando...'
            ) : isLoginView ? (
              'Entrar na Área Admin'
            ) : (
              'Cadastrar novo Administrador'
            )}
          </button>
        </form>

        <div className="text-center mt-5">
          <button
            onClick={() => setIsLoginView(!isLoginView)}
            className="text-xs text-neutral-400 hover:text-gold-400 transition-colors cursor-pointer"
          >
            {isLoginView ? 'Não tem conta? Cadastrar Admin' : 'Já possui conta? Fazer Login'}
          </button>
        </div>
      </div>
    );
  }

  // --- RENDERING IF USER LOGGED IN (DASHBOARD) ---
  return (
    <div id="admin-dashboard-container" className="space-y-8 animate-fade-in">
      
      {/* Title block */}
      <div className="border-b border-neutral-900 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono text-gold-500 tracking-wider uppercase block">Painel Gerencial</span>
          <h2 className="font-serif text-3xl text-white font-bold">Gerenciar desfile</h2>
          <p className="text-xs text-neutral-400 mt-1">Cadastre looks, adquira códigos QR de passarela e faça a moderação das peças.</p>
        </div>
        <div className="bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800 text-[11px] text-neutral-400 font-mono">
          E-mail: <span className="text-white font-semibold">{activeUser.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PUBLISH LOOK FORM COLUMN */}
        <div className="lg:col-span-1">
          <div className="bg-[#121212] border border-neutral-800 rounded-lg p-5 space-y-4">
            <h3 className="font-serif text-lg text-white font-semibold flex items-center gap-1.5 border-b border-neutral-900 pb-2">
              <Plus className="w-5 h-5 text-gold-500" />
              Adicionar novo look
            </h3>

            <form onSubmit={handleCreateLook} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">Título do Look</label>
                <input 
                  type="text" 
                  placeholder="Ex: Look 01 - Verão"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-neutral-800 focus:border-gold-500 outline-none rounded p-3 text-xs text-white transition-colors"
                  maxLength={40}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider block mb-1">
                  Foto da Peça / Modelo
                </label>
                
                {/* Drag and Drop manual box */}
                <div className="relative group border border-dashed border-neutral-800 hover:border-gold-500/50 rounded-lg p-4 bg-neutral-950 text-center transition-colors">
                  <input
                    id="look-file-uploader"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="w-16 h-16 mx-auto rounded overflow-hidden bg-neutral-900 relative">
                        <img 
                          src={URL.createObjectURL(selectedFile)}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[11px] text-emerald-400 font-semibold truncate max-w-xs mx-auto">
                        ✓ {selectedFile.name}
                      </p>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-[10px] text-red-400 font-mono hover:underline cursor-pointer"
                      >
                        Remover Foto
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="w-6 h-6 text-neutral-600 mx-auto" />
                      <p className="text-xs text-neutral-400 font-medium">
                        Arraste ou clique para enviar
                      </p>
                      <p className="text-[9px] text-neutral-600 font-mono">
                        PNG, JPG ou WEBP até 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadingLook || !newTitle.trim() || !selectedFile}
                className="w-full bg-gold-500 hover:bg-gold-600 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-black py-2.5 px-4 font-semibold rounded text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {uploadingLook ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enviando peça ao Storage...
                  </>
                ) : (
                  'Publicar Look'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* PUBLISHED LOOKS LIST moderating panel */}
        <div className="lg:col-span-2">
          <div className="bg-[#121212] border border-neutral-800 rounded-lg p-5">
            <h3 className="font-serif text-lg text-white font-semibold mb-4 pb-2 border-b border-neutral-900">
              Looks publicados ({looks.length})
            </h3>

            {looks.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-neutral-800 bg-neutral-950/20 rounded">
                <Image className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
                <p className="text-xs text-neutral-400 font-mono">Nenhuma imagem publicada.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {looks.map((look) => (
                  <div 
                    key={look.id} 
                    className="bg-neutral-950 border border-neutral-900 hover:border-neutral-800 p-3 rounded-lg flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 rounded overflow-hidden bg-neutral-900 border border-neutral-800 flex-shrink-0">
                        <img 
                          src={look.image_url} 
                          alt={look.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="truncate">
                        <h4 className="font-serif font-semibold text-xs text-white truncate max-w-sm">{look.title}</h4>
                        <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">ID: #{look.id.slice(0, 10)}...</span>
                        <span className="text-[9px] text-neutral-500 font-mono">Publicado em: {new Date(look.created_at).toLocaleDateString()} ás {new Date(look.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Action Panel: Get QR Code, Delete look */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onShowQR(look)}
                        className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 p-2 text-gold-500 rounded transition-colors text-xs flex items-center gap-1 cursor-pointer"
                        title="Obter QR Code para Impressão"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[10px] font-mono leading-none">Imprimir QR</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteLook(look.id, look.title)}
                        className="bg-neutral-900 hover:bg-red-950/40 hover:border-red-500/20 border border-neutral-800 p-2 text-neutral-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                        title="Excluir Peça"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
