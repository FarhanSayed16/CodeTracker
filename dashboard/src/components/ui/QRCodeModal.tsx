import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { fetchApi } from '../../services/api';
import { Loader2 } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, sessionId }) => {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId && !qrUrl) {
      setLoading(true);
      fetchApi<{ dataUrl: string }>(`/sessions/${sessionId}/qr`)
        .then(res => {
          setQrUrl(res.dataUrl);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, sessionId, qrUrl]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Session">
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-xl font-semibold">Scan to join</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          {loading ? (
            <div className="w-64 h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary-500 w-8 h-8" />
            </div>
          ) : qrUrl ? (
            <img src={qrUrl} alt="Session QR Code" className="w-64 h-64" />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-red-500">
              Failed to load QR code
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 text-center">
          Students can scan this code with their phones or tablets to instantly open the join screen with the session code pre-filled.
        </p>
      </div>
    </Modal>
  );
};
