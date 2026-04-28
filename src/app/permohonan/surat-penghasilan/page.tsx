"use client";

import { useRouter } from "next/navigation";
import { FiDollarSign, FiFileText, FiCheckCircle } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { OFFICIAL_STANDARD_PROCEDURE } from "@/lib/template-surat/official-defaults";

export default function SuratPenghasilanInfoPage() {
  const router = useRouter();

  const persyaratan = [
    "Scan/foto KTP yang masih berlaku",
    "Scan/foto Kartu Keluarga (KK)",
    "Scan/foto slip gaji/bukti penghasilan (jika ada)",
    "Scan/foto surat keterangan dari tempat kerja (jika bekerja)",
  ];

  const prosedur = OFFICIAL_STANDARD_PROCEDURE;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
              <FiDollarSign className="text-white text-4xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Surat Keterangan Penghasilan
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Surat resmi yang menyatakan penghasilan seseorang per bulan.
              Digunakan untuk pengajuan kredit, beasiswa, bantuan sosial, atau administrasi lainnya.
            </p>
          </div>

          {/* Persyaratan Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <FiFileText className="text-green-500 text-3xl mr-3" />
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
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
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
              onClick={() => router.push("/permohonan/surat-penghasilan/form")}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Ajukan Permohonan Sekarang
            </button>
            <p className="text-gray-500 text-sm mt-4">
              Pastikan semua persyaratan dokumen sudah disiapkan
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}


