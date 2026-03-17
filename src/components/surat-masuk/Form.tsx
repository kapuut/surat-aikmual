"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormData {
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  perihal: string;
  file?: FileList;
}

export default function SuratMasukForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/surat-masuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Gagal menambahkan surat');
      
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="form-group">
        <label className="form-label">Nomor Surat</label>
        <input
          type="text"
          className="form-input"
          {...register("nomor_surat", { required: true })}
        />
      </div>
      {/* Add other form fields */}
    </form>
  );
}
