/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, Send, Calendar, User, Eye, X, AlertCircle } from 'lucide-react';
import { Look, Comment } from '../types';
import { db } from '../lib/supabase';

interface LookScanDetailModalProps {
  look: Look;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export default function LookScanDetailModal({ look, isOpen, onClose, onCommentAdded }: LookScanDetailModalProps) {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // Load comments specific to this look
  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    
    async function loadLookComments() {
      setLoadingComments(true);
      setErrorMsg(null);
      try {
        const fetched = await db.getComments(look.id);
        if (isMounted) {
          setComments(fetched);
        }
      } catch (err: any) {
        console.error('Failed to load comments:', err);
        if (isMounted) {
          setErrorMsg('Não foi possível carregar os comentários. Tente novamente.');
        }
      } finally {
        if (isMounted) {
          setLoadingComments(false);
        }
      }
    }

    loadLookComments();

    // Listen to local state changes to keep single-look views synchronized
    const handleLocalState = () => {
      loadLookComments();
    };
    window.addEventListener('local_comments_changed', handleLocalState);

    return () => {
      isMounted = false;
      window.removeEventListener('local_comments_changed', handleLocalState);
    };
  }, [look.id, isOpen]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(false);

    try {
      await db.addComment(look.id, authorName.trim(), content.trim());
      
      setContent('');
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      
      // Reload comments
      const updated = await db.getComments(look.id);
      setComments(updated);

      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err: any) {
      console.error('Error publishing comment:', err);
      setErrorMsg(err.message || 'Falha ao publicar comentário. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
      {/* Background close click */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      {/* Main interactive panel */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        id={`scanned-look-details-${look.id}`}
        className="relative w-full max-w-4xl bg-[#0d0d0d] border-t md:border border-neutral-800 rounded-t-xl md:rounded-lg overflow-hidden flex flex-col md:flex-row shadow-2xl z-10 max-h-screen md:max-h-[90vh]"
      >
        {/* Floating Close Button for mobile */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-black/60 border border-neutral-800 hover:border-white text-neutral-300 hover:text-white p-2 rounded-full transition-all hover:scale-105 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Fashion Image section */}
        <div className="w-full md:w-1/2 relative bg-black flex items-center justify-center min-h-[300px] md:h-auto overflow-hidden">
          <img 
            src={look.image_url} 
            alt={look.title} 
            className="w-full h-full object-cover aspect-[3/4]"
            referrerPolicy="no-referrer"
          />
          {/* Ambient vignette background blur */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/30 md:bg-gradient-to-r md:from-transparent md:to-[#0d0d0d] pointer-events-none"></div>
          
          {/* Editorial category card */}
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto bg-black/80 backdrop-blur-md border border-neutral-800 rounded px-4 py-3 max-w-sm">
            <span className="text-[10px] font-mono tracking-widest text-gold-500 uppercase font-semibold">
              ★ Look Escaneado
            </span>
            <h4 className="font-serif text-lg text-white mt-0.5">{look.title}</h4>
          </div>
        </div>

        {/* Action/Comments Form section */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[60vh] md:max-h-[90vh]">
          <div>
            {/* Header detail */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 border-b border-neutral-900 pb-4 mb-4">
              <Eye className="w-4 h-4 text-gold-500" />
              <span>Você está visualizando os detalhes da passarela</span>
            </div>

            {/* Campaign info premium */}
            <div className="bg-gold-950/20 border border-gold-500/20 rounded p-4 mb-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-12 h-12 bg-gold-500/10 rounded-full blur-xl pointer-events-none"></div>
              <p className="text-xs text-gold-300 font-semibold flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Concorra ao Prêmio de Melhor Frase!
              </p>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Deixe seu comentário estilístico sobre a obra. O autor do melhor comentário do desfile ganhará um prêmio surpresa oficial no encerramento.
              </p>
            </div>

            {/* Existing Comments loop */}
            <div className="mb-6">
              <h5 className="font-serif text-sm tracking-wider text-white uppercase mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-gold-500" />
                Comentários da Plateia ({comments.length})
              </h5>

              {loadingComments ? (
                <div className="space-y-2.5">
                  <div className="h-10 bg-neutral-900 animate-pulse rounded"></div>
                  <div className="h-10 bg-neutral-900 animate-pulse rounded"></div>
                </div>
              ) : errorMsg ? (
                <div className="text-xs text-red-400 flex items-center gap-1.5 p-2 bg-red-950/20 border border-red-500/10 rounded">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-neutral-800 rounded bg-neutral-950/30">
                  <p className="text-xs text-neutral-500 font-mono">Nenhum comentário para este look ainda.</p>
                  <p className="text-[11px] text-gold-500/60 font-mono mt-0.5">Seja o primeiro a dar sua opinião!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                  {comments.map((comm) => (
                    <div 
                      key={comm.id} 
                      className="bg-neutral-950 p-3 rounded border border-neutral-900 hover:border-neutral-800 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                        <span className="font-bold text-white flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-gold-500" />
                          {comm.author_name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(comm.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 italic font-serif leading-relaxed">
                        "{comm.content}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comment Form styling */}
          <div className="mt-auto border-t border-neutral-900 pt-5">
            <h5 className="font-serif text-sm text-white mb-3">Deixe sua impressão</h5>
            
            <form onSubmit={handleSubmitComment} className="space-y-3.5">
              <div>
                <input 
                  type="text" 
                  placeholder="Seu nome ou apelido"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-[#121212] border border-neutral-800 focus:border-gold-500 outline-none rounded p-2.5 text-xs text-white transition-colors"
                  maxLength={40}
                  required
                />
              </div>

              <div>
                <textarea 
                  placeholder="Qual a sua melhor frase e opinião sobre este look?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#121212] border border-neutral-800 focus:border-gold-500 outline-none rounded p-2.5 text-xs text-white h-20 resize-none transition-colors"
                  maxLength={250}
                  required
                />
                <div className="text-[9px] text-neutral-500 text-right mt-1 font-mono">
                  {content.length}/250 caracteres
                </div>
              </div>

              <AnimatePresence>
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded text-center font-mono"
                  >
                    ✦ Comentário enviado! Obrigado por participar!
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={submitting || !authorName.trim() || !content.trim()}
                className="w-full bg-gold-500 hover:bg-gold-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-black py-2.5 px-4 font-semibold rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  'Publicando...'
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Enviar Comentário
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
