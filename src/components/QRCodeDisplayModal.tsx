/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { QrCode, Copy, Check, ExternalLink, Sparkles, Smartphone } from 'lucide-react';
import { Look } from '../types';

interface QRCodeDisplayModalProps {
  look: Look;
  isOpen: boolean;
  onClose: () => void;
  onSimulateScan: (lookId: string) => void;
}

export default function QRCodeDisplayModal({ look, isOpen, onClose, onSimulateScan }: QRCodeDisplayModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Let's formulate the QR scan URL pattern
  // Uses current location so that it redirects to the exact look parameter on the active container URL
  const destinationUrl = `${window.location.origin}/?look_id=${look.id}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=d4af37&bgcolor=0b0b0b&margin=15&data=${encodeURIComponent(destinationUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(destinationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div 
        id={`qr-modal-${look.id}`} 
        className="relative w-full max-w-md bg-[#121212] border border-neutral-800 rounded-lg p-6 text-center text-neutral-200 shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors p-1 hover:bg-neutral-800 rounded cursor-pointer"
        >
          ✕
        </button>

        <QrCode className="w-8 h-8 text-gold-500 mx-auto mb-2" />
        <h3 className="font-serif text-xl text-white tracking-wide">{look.title}</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
          Insira este QR Code na passarela física. Quem escanear será conectado diretamente a este visual para deixar comentários.
        </p>

        {/* QR Code Graphic Frame */}
        <div className="my-6 p-4 bg-[#0A0A0A] border border-neutral-800/80 rounded-xl relative overflow-hidden inline-block group">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold-500"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold-500"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold-500"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold-500"></div>
          
          <img 
            src={qrCodeApiUrl} 
            alt={`QR Code para o look ${look.title}`}
            className="w-56 h-56 mx-auto rounded-lg object-contain bg-[#0b0b0b] relative z-10 p-1"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Interactive buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              onSimulateScan(look.id);
              onClose();
            }}
            className="w-full bg-gold-500 hover:bg-gold-600 active:scale-[0.98] text-black py-2.5 px-4 font-semibold rounded text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-gold-500/10"
          >
            <Smartphone className="w-4 h-4" />
            Simular Escaneamento (Testar Look)
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Link Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  Copiar Link do QR
                </>
              )}
            </button>

            <a
              href={destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-xs text-neutral-400 hover:text-white py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver no Navegador
            </a>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-center gap-1 text-[11px] text-neutral-500 italic">
          <Sparkles className="w-3 h-3 text-gold-500/60" />
          O melhor comentário no mural ganhará uma premiação oficial!
        </div>
      </div>
    </div>
  );
}
