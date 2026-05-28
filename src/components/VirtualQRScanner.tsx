/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, AlertTriangle, Play, CheckCircle, Smartphone, CameraOff } from 'lucide-react';
import { Look } from '../types';

interface VirtualQRScannerProps {
  looks: Look[];
  onScanSuccess: (lookId: string) => void;
  onClose: () => void;
}

export default function VirtualQRScanner({ looks, onScanSuccess, onClose }: VirtualQRScannerProps) {
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scannedLook, setScannedLook] = useState<Look | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Stop camera if component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    setCameraError(null);
    setUseCamera(true);
    setScanState('scanning');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      setCameraError(
        'Acesso à câmera bloqueado ou indisponível. Utilize o seletor virtual rápido de simulação abaixo!'
      );
      setUseCamera(false);
      setScanState('idle');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
    setScanState('idle');
  };

  const handleSimulatedScan = (look: Look) => {
    setScanState('success');
    setScannedLook(look);
    
    // Auto-trigger scan callback after a nice futuristic scan loading animation
    setTimeout(() => {
      onScanSuccess(look.id);
      stopCamera();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div 
        id="qr-scanner-card" 
        className="relative w-full max-w-lg bg-[#111] border border-neutral-800 rounded-lg p-6 shadow-2xl text-neutral-200"
      >
        <div className="flex justify-between items-start mb-4 border-b border-neutral-900 pb-3">
          <div>
            <h3 className="font-serif text-xl text-white tracking-wide flex items-center gap-2">
              <Camera className="text-gold-500 w-5 h-5 animate-pulse" />
              Escanear Look do Desfile
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Aponte para o QR Code ou selecione um look da lista para simular</p>
          </div>
          <button 
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-neutral-500 hover:text-white transition-colors p-1.5 hover:bg-neutral-800 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scanner Body Area */}
        <div className="relative aspect-video w-full bg-[#050505] rounded-lg border border-neutral-800 flex flex-col items-center justify-center overflow-hidden mb-6">
          
          {/* Futuristic corner targets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gold-500 z-20"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gold-500 z-20"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gold-500 z-20"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gold-500 z-20"></div>

          {/* Active scanning bar */}
          {scanState === 'scanning' && (
            <div className="absolute left-0 right-0 h-0.5 bg-gold-400/80 shadow-[0_0_15px_#d4af37] animate-bounce z-10 pointer-events-none"></div>
          )}

          {/* Render real Camera Element inside panel if enabled */}
          {useCamera && !cameraError ? (
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <div className="z-10 text-center p-6 max-w-xs flex flex-col items-center">
              {scanState === 'success' && scannedLook ? (
                <div className="space-y-2 animate-pulse">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold text-emerald-400">QR Code Identificado!</p>
                  <p className="font-serif text-xs text-neutral-400">"{scannedLook.title}"</p>
                </div>
              ) : (
                <>
                  <CameraOff className="w-10 h-10 text-neutral-600 mb-3" />
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Você pode habilitar a câmera para simular a sensação do aluno em pé na passarela física.
                  </p>
                  <button
                    onClick={startCamera}
                    className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-gold-400 hover:text-gold-300 px-4 py-2 text-xs font-semibold rounded flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-gold-500" />
                    Ativar Minha Câmera
                  </button>
                </>
              )}
            </div>
          )}

          {/* Error notifications */}
          {cameraError && (
            <div className="absolute inset-x-4 bottom-4 z-20 bg-red-950/90 border border-red-500/20 rounded p-2 text-[10px] text-red-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Control overlay during active camera streams */}
          {useCamera && (
            <button
              onClick={stopCamera}
              className="absolute bottom-3 right-3 z-20 bg-black/80 hover:bg-black text-xs text-neutral-300 py-1 px-2.5 rounded border border-neutral-800 transition-colors cursor-pointer"
            >
              Desativar Transmissão
            </button>
          )}
        </div>

        {/* Tactile Virtual QR selector */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Smartphone className="w-4 h-4 text-gold-500" />
            <h4 className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
              Simulação de Plateia: Escolha o Look
            </h4>
          </div>
          <p className="text-[11px] text-neutral-500 mb-3 leading-relaxed">
            Seja rápido: clique em qualquer uma das obras publicadas abaixo para simular instantaneamente a leitura do QR Code correspondente da passarela!
          </p>

          {looks.length === 0 ? (
            <div className="text-center py-4 bg-neutral-950 rounded border border-dashed border-neutral-800">
              <span className="text-xs text-neutral-500">Nenhum look cadastrado para simular.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {looks.map((look) => (
                <button
                  key={look.id}
                  onClick={() => handleSimulatedScan(look)}
                  disabled={scanState === 'success'}
                  className="bg-neutral-950 hover:bg-gold-500/10 hover:border-gold-500/50 text-left p-2.5 rounded border border-neutral-900 group transition-all text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <img 
                    src={look.image_url} 
                    alt={look.title}
                    className="w-8 h-10 object-cover rounded bg-neutral-900"
                    referrerPolicy="no-referrer"
                  />
                  <div className="truncate flex-1">
                    <div className="font-serif text-white group-hover:text-gold-400 transition-colors font-medium truncate">
                      {look.title}
                    </div>
                    <span className="text-[9px] font-mono text-neutral-500">Aperte para ler</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
