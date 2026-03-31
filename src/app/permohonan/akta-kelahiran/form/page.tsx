"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiUpload } from 'react-icons/fi';

interface FormData {
  nama_anak: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  nama_ayah: string;
  nama_ibu: string;
  alamat: string;
  dokumen: FileList;
}

export default function FormAktaKelahiran() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'dokumen') {
          Array.from(data.dokumen).forEach((file) => {
            formData.append('dokumen', file);
          });
        } else {
          const value = data[key as keyof FormData];
          if (typeof value === 'string') {
            formData.append(key, value);
          } else if (value instanceof Blob) {
            formData.append(key, value);
          }
        }
      });

      const res = await fetch('/api/permohonan/akta-kelahiran', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Gagal mengirim permohonan');
      
      // Handle success
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Form Permohonan Akta Kelahiran</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-group">
          <label className="form-label">Nama Lengkap Anak</label>
          <input
            type="text"
            className="form-input"
            {...register("nama_anak", { required: true })}
          />
        </div>
        
        {/* Add other form fields */}
        
        <div className="form-group">
          <label className="form-label">Upload Dokumen</label>
          <div className="file-upload-area">
            <input
              type="file"
              multiple
              {...register("dokumen", { required: true })}
              className="hidden"
              id="dokumen"
            />
            <label htmlFor="dokumen" className="cursor-pointer">
              <FiUpload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Klik untuk upload dokumen</p>
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim Permohonan'}
        </button>
      </form>
    </div>
  );
}

