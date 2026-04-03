import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface PermohonanData {
  jenisSurat: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface UsePermohonanSubmitReturn {
  loading: boolean;
  error: string | null;
  handleSubmit: (data: PermohonanData) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook untuk handling form submission permohonan surat
 * Mengurangi duplikasi logika submit di berbagai form pages
 */
export function usePermohonanSubmit(): UsePermohonanSubmitReturn {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PermohonanData): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/permohonan/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengajukan permohonan');
      }

      // Success - show message and redirect
      alert('Permohonan berhasil diajukan!');
      router.push('/permohonan/riwayat');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
      console.error('Permohonan submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { loading, error, handleSubmit, clearError };
}
