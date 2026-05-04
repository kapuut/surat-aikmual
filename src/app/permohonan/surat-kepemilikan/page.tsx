"use client";

import { useRouter } from "next/navigation";
import { FiShield, FiFileText, FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import Header from "@/components/layout/Header";
import FooterWrapper from "@/components/layout/FooterWrapper";
import { OFFICIAL_STANDARD_PROCEDURE } from "@/lib/template-surat/official-defaults";

export default function SuratKepemilikanInfoPage() {
  const router = useRouter();

  const persyaratan = [
    "Scan/foto KTP yang masih berlaku",
    "Scan/foto Kartu Keluarga (KK)",
    "Scan/foto Sertifikat Tanah/Bangunan (jika ada)",
    "Scan/foto Surat Keterangan Kepemilikan dari RT/RW",
    "Scan/foto bukti pembayaran PBB terakhir",
    "Upload pas foto 3x4",
    "Scan/foto surat kuasa bermaterai (jika diwakilkan)",
  ];

  const prosedur = OFFICIAL_STANDARD_PROCEDURE;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex cursor-pointer items-center gap-2 font-medium text-green-600 transition-colors duration-200 hover:text-green-700"
          >
            <FiArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </button>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500 rounded-full mb-6">
              <FiShield className="text-white text-4xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Surat Keterangan Kepemilikan
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Surat resmi yang menyatakan kepemilikan atas tanah atau bangunan di wilayah desa.
              Digunakan untuk pengurusan sertifikat, jual beli, atau administrasi lainnya.
            </p>
          </div>

          {/* Persyaratan Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <FiFileText className="text-purple-500 text-3xl mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                Persyaratan Dokumen
              </h2>
            </div>
            <div className="space-y-4">
              {persyaratan.map((item, index) => (
                <div key={index} className="flex items-start">
                  <FiCheckCircle className="text-green-500 text-xl mr-3 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prosedur Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Prosedur Permohonan
            </h2>
            <div className="space-y-6">
              {prosedur.map((item) => (
                <div key={item.step} className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={() => router.push("/permohonan/surat-kepemilikan/form")}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Ajukan Permohonan Sekarang
            </button>
            <p className="text-gray-500 text-sm mt-4">
              Pastikan semua persyaratan dokumen sudah disiapkan
            </p>
          </div>
        </div>
      </div>
      <FooterWrapper />
    </>
  );
}


