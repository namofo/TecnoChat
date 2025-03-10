import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQRStore } from '../../store/qrStore';

export default function QRPage() {
  const { qrData, loading, error, fetchQR } = useQRStore();
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchQR();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white flex justify-center items-center">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Conectar WhatsApp</h1>
        
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {qrData && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-emerald-500 mb-3">
                ¿Cómo conectar tu WhatsApp?
              </h2>
              <div className="space-y-3 text-gray-300">
                <p>1. Abre WhatsApp en tu teléfono</p>
                <p>2. Ve a Menú (⋮) o Ajustes</p>
                <p>3. Selecciona "Dispositivos vinculados"</p>
                <p>4. Toca en "Vincular un dispositivo"</p>
                <p>5. Cuando aparezca la cámara, haz clic en "Ver QR" abajo y escanea el código</p>
              </div>
              <div className="mt-4 p-4 bg-blue-900/30 rounded-md">
                <p className="text-blue-300 font-medium">
                  ¡Importante! 
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  Mantén tu teléfono conectado a internet para que el bot funcione correctamente.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowQR(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Ver QR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal del QR */}
      {showQR && qrData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <div className="relative">
              <img
                src={qrData.url_qr}
                alt="QR Code"
                className="w-full h-auto"
              />
              <button
                onClick={() => setShowQR(false)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
