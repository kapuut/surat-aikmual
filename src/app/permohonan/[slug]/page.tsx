"use client";

import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiFileText } from "react-icons/fi";
import { ALLOWED_SURAT_SLUGS, ALLOWED_SURAT_TYPES, normalizeSuratSlug } from "@/lib/surat-data";

interface SuratDetailProps {
  params: { slug: string };
}

const suratData: Record<string, {
  title: string;
  description: string;
  requirements: string[];
  procedures: string[];
}> = ALLOWED_SURAT_TYPES.reduce((acc, item) => {
  acc[item.slug] = {
    title: item.title,
    description: item.description,
    requirements: [
      "NIK terdaftar dan akun sudah tervalidasi admin",
      "Nomor telepon aktif",
      "Upload dokumen pendukung sesuai jenis surat (bukti tambahan)",
      "KTP dan KK cukup diunggah sekali saat registrasi akun"
    ],
    procedures: [
      "Persiapan Dokumen - Pastikan NIK akun sudah tervalidasi dan siapkan bukti pendukung domisili sesuai kebutuhan",
      "Isi Form Permohonan - Lengkapi formulir permohonan dengan data yang benar",
      "Upload Dokumen - Unggah dokumen pendukung sesuai jenis permohonan",
      "Verifikasi Data - Petugas akan memverifikasi kelengkapan dan kebenaran data",
      "Proses Persetujuan - Menunggu persetujuan dari Kepala Desa",
      "Akses Surat - Surat dapat diunduh setelah mendapat persetujuan."
    ]
  };
  return acc;
}, {} as Record<string, {
  title: string;
  description: string;
  requirements: string[];
  procedures: string[];
}>);

export default function SuratDetailPage({ params }: SuratDetailProps) {
  const suratSlug = normalizeSuratSlug(params.slug);
  const surat = suratSlug && ALLOWED_SURAT_SLUGS.has(suratSlug)
    ? suratData[suratSlug]
    : null;

  if (!surat) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Surat tidak ditemukan</h1>
        <p className="mt-4 text-gray-600">
          Halaman permohonan untuk jenis surat ini belum tersedia.
        </p>
        <Link
          href="/permohonan"
          className="inline-block mt-6 bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Kembali ke Daftar Surat
        </Link>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-2">
            <FiArrowLeft /> Kembali
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{surat.title}</h1>
        <p className="text-lg text-gray-600 mb-10">{surat.description}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FiCheckCircle className="text-blue-600" />
                  Persyaratan Dokumen
                </h2>
              </div>
              <div className="card-body">
                <ul className="space-y-4">
                  {surat.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-blue-600">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FiFileText className="text-blue-600" />
                  Prosedur Pengajuan
                </h2>
              </div>
              <div className="card-body">
                <ol className="list-decimal list-inside space-y-3">
                  {surat.procedures.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 card">
              <div className="card-body">
                <h3 className="font-bold text-lg mb-4">Ajukan Permohonan</h3>
                <Link
                  href={`/permohonan/${params.slug}/form`}
                  className="btn btn-primary w-full"
                >
                  Buat Permohonan
                </Link>

                <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h4 className="text-sm font-semibold text-blue-800">Menu Upload Dokumen</h4>
                  <ul className="mt-2 space-y-2 text-sm text-blue-700">
                    <li>1. Dokumen pendukung sesuai jenis surat</li>
                    <li>2. KTP dan KK sudah tersimpan dari registrasi akun</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
