"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface VerificationData {
  id: number;
  nomor_surat: string;
  nama_pemohon: string;
  nik: string;
  surat_untuk: string;
  jenis_surat: string;
  keperluan: string;
  pembuat_surat: string;
  jabatan_penanda_tangan: string;
  status: string;
  tanggal_ttd: string;
  file_path: string | null;
}

export default function VerifikasiSuratPage() {
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>("");
  const [data, setData] = useState<VerificationData | null>(null);

  const params = useMemo(() => {
    if (typeof window === "undefined") return { permohonan: "", kode: "", token: "" };
    const search = new URLSearchParams(window.location.search);
    return {
      permohonan: search.get("permohonan") || "",
      kode: search.get("kode") || "",
      token: search.get("token") || "",
    };
  }, []);

  useEffect(() => {
    const verify = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/verifikasi-surat?permohonan=${encodeURIComponent(params.permohonan)}&kode=${encodeURIComponent(params.kode)}&token=${encodeURIComponent(params.token)}`,
          { cache: "no-store" }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Gagal verifikasi surat");
        }

        setValid(Boolean(result?.valid));
        setMessage(String(result?.reason || result?.error || "Verifikasi selesai"));
        setData((result?.data as VerificationData) || null);
      } catch (error) {
        setValid(false);
        setMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat verifikasi");
      } finally {
        setLoading(false);
      }
    };

    void verify();
  }, [params.kode, params.permohonan, params.token]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <section className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Verifikasi Surat Digital</h1>
        <p className="mt-2 text-sm text-gray-600">
          Halaman ini memvalidasi keaslian QR dan token integritas surat.
        </p>

        <div
          className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
            loading
              ? "border-gray-200 bg-gray-50 text-gray-700"
              : valid
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {loading ? "Memverifikasi surat..." : message}
        </div>

        {data && (
          <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr><td className="w-44 bg-gray-50 px-4 py-2 font-medium text-gray-700">Nomor Surat</td><td className="px-4 py-2">{data.nomor_surat}</td></tr>
                <tr><td className="bg-gray-50 px-4 py-2 font-medium text-gray-700">Nama Pemohon</td><td className="px-4 py-2">{data.nama_pemohon}</td></tr>
                <tr><td className="bg-gray-50 px-4 py-2 font-medium text-gray-700">NIK</td><td className="px-4 py-2">{data.nik}</td></tr>
                <tr><td className="bg-gray-50 px-4 py-2 font-medium text-gray-700">Surat Ditujukan Untuk</td><td className="px-4 py-2">{data.surat_untuk || `${data.nama_pemohon} (${data.nik})`}</td></tr>
                <tr><td className="bg-gray-50 px-4 py-2 font-medium text-gray-700">Jenis Surat</td><td className="px-4 py-2">{data.jenis_surat}</td></tr>
                <tr><td className="bg-gray-50 px-4 py-2 font-medium text-gray-700">Tujuan/Keperluan</td><td className="px-4 py-2">{data.keperluan}</td></tr>
                <tr><td className="bg-gray-50 px-4 py-2 font-medium text-gray-700">Pembuat/Penanda Tangan</td><td className="px-4 py-2">{data.pembuat_surat} ({data.jabatan_penanda_tangan})</td></tr>
                <tr><td className="bg-gray-50 px-4 py-2 font-medium text-gray-700">Status</td><td className="px-4 py-2">{data.status}</td></tr>
                <tr><td className="bg-gray-50 px-4 py-2 font-medium text-gray-700">Tanggal TTD</td><td className="px-4 py-2">{new Date(data.tanggal_ttd).toLocaleString("id-ID")}</td></tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {data?.file_path && (
            <a
              href={data.file_path}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Lihat Dokumen Surat
            </a>
          )}
          <Link href="/" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Kembali
          </Link>
        </div>
      </section>
    </main>
  );
}
