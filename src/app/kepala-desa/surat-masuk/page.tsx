"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiInbox, FiDownload, FiEye, FiInfo, FiSend, FiUserCheck } from "react-icons/fi";

interface SuratMasukItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  urgensi?: "rendah" | "sedang" | "tinggi" | string;
  perihal: string;
  file_path?: string;
  latest_disposisi_tujuan?: string | null;
  latest_disposisi_tujuan_label?: string | null;
  latest_disposisi_status?: string | null;
  latest_disposisi_at?: string | null;
}

const FIXED_TUJUAN_ROLE = "sekretaris";
const FIXED_TUJUAN_LABEL = "Sekretaris Desa";

type PenangananSurat = "baru" | "diproses" | "selesai";

function getUrgensiLabel(rawValue: unknown): "Rendah" | "Sedang" | "Tinggi" {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "tinggi") return "Tinggi";
  if (value === "rendah") return "Rendah";
  return "Sedang";
}

function getUrgensiClass(rawValue: unknown): string {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "tinggi") return "status-chip-danger";
  if (value === "rendah") return "status-chip-neutral";
  return "status-chip-warning";
}

function normalizeDisposisiStatus(rawValue: unknown): string {
  return String(rawValue || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function getPenangananStatus(item: SuratMasukItem): PenangananSurat {
  const status = normalizeDisposisiStatus(item.latest_disposisi_status);
  if (!item.latest_disposisi_tujuan && !status) return "baru";
  if (["pending", "diproses", "proses", "menunggu"].includes(status)) return "diproses";
  if (["didisposisikan", "diteruskan", "selesai", "terlaksana", "completed", "done", "ditindaklanjuti", "tuntas"].includes(status)) return "selesai";
  if (item.latest_disposisi_tujuan) return "selesai";
  if (status) return "diproses";
  return "diproses";
}

function getPenangananMeta(status: PenangananSurat) {
  if (status === "baru") return { label: "Baru masuk", className: "status-chip-info" };
  if (status === "selesai") return { label: "Selesai ditangani", className: "status-chip-success" };
  return { label: "Sedang diproses", className: "status-chip-warning" };
}

function formatIsoDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");
}

export default function KepalaDesaSuratMasukPage() {
  const [suratMasuk, setSuratMasuk] = useState<SuratMasukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [disposisiTarget, setDisposisiTarget] = useState<SuratMasukItem | null>(null);
  const [tujuanLanjutan, setTujuanLanjutan] = useState<string>("");
  const [catatanDisposisi, setCatatanDisposisi] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");

  const MONTH_OPTIONS = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" },
    { value: "3", label: "Maret" }, { value: "4", label: "April" },
    { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" },
    { value: "9", label: "September" }, { value: "10", label: "Oktober" },
    { value: "11", label: "November" }, { value: "12", label: "Desember" },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2016 + 1 }, (_, i) => String(currentYear - i));

  const availableDays = useMemo(() => {
    if (selectedMonth === "") return Array.from({ length: 31 }, (_, i) => i + 1);
    const month = Number(selectedMonth);
    const year = selectedYear === "" ? currentYear : Number(selectedYear);
    if (!Number.isFinite(month) || month < 1 || month > 12) return Array.from({ length: 31 }, (_, i) => i + 1);
    return Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear, currentYear]);

  useEffect(() => {
    const fetchSuratMasuk = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/surat-masuk", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Gagal memuat data surat masuk");
        }

        setSuratMasuk(Array.isArray(result?.data) ? result.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchSuratMasuk();
  }, []);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const filteredSuratMasuk = useMemo(() => {
    return suratMasuk.filter((item) => {
      const tanggal = new Date(item.tanggal_terima);
      if (isNaN(tanggal.getTime())) return true;
      const day = tanggal.getDate();
      const parsedFrom = selectedDayFrom === "" ? null : Number(selectedDayFrom);
      const parsedTo = selectedDayTo === "" ? null : Number(selectedDayTo);
      const dayMin = parsedFrom !== null && parsedTo !== null ? Math.min(parsedFrom, parsedTo) : parsedFrom;
      const dayMax = parsedFrom !== null && parsedTo !== null ? Math.max(parsedFrom, parsedTo) : parsedTo;
      const dayFromOk = dayMin === null || day >= dayMin;
      const dayToOk = dayMax === null || day <= dayMax;
      const monthOk = !selectedMonth || String(tanggal.getMonth() + 1) === selectedMonth;
      const yearOk = !selectedYear || String(tanggal.getFullYear()) === selectedYear;
      return dayFromOk && dayToOk && monthOk && yearOk;
    });
  }, [suratMasuk, selectedMonth, selectedYear, selectedDayFrom, selectedDayTo]);

  const filterDescription = useMemo(() => {
    if (!selectedDayFrom && !selectedDayTo) return "";
    const start = selectedDayFrom || selectedDayTo;
    const end = selectedDayTo || selectedDayFrom;
    return `Jumlah data dari tanggal ${formatIsoDate(start)} sampai ${formatIsoDate(end)} = ${filteredSuratMasuk.length} data`;
  }, [selectedDayFrom, selectedDayTo, filteredSuratMasuk.length]);

  const hasDateFilter = Boolean(selectedDayFrom || selectedDayTo);

  const openDisposisiDialog = (item: SuratMasukItem) => {
    setDisposisiTarget(item);
    setTujuanLanjutan("");
    setCatatanDisposisi(`Mohon ditindaklanjuti terkait surat masuk ${item.nomor_surat || ""}.`.trim());
  };

  const closeDisposisiDialog = () => {
    setDisposisiTarget(null);
    setTujuanLanjutan("");
    setCatatanDisposisi("");
  };

  const handleDisposisi = async () => {
    if (!disposisiTarget) {
      return;
    }

    try {
      setSubmittingId(disposisiTarget.id);
      setFeedback(null);

      const response = await fetch(`/api/kepala-desa/surat-masuk/${disposisiTarget.id}/disposisi`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tujuan_role: FIXED_TUJUAN_ROLE,
          tujuan_label: FIXED_TUJUAN_LABEL,
          tujuan_lanjutan: tujuanLanjutan,
          catatan: catatanDisposisi,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal melakukan disposisi");
      }

      setSuratMasuk((current) =>
        current.map((row) =>
          row.id === disposisiTarget.id
            ? {
                ...row,
                latest_disposisi_tujuan: FIXED_TUJUAN_ROLE,
                latest_disposisi_tujuan_label: FIXED_TUJUAN_LABEL,
                latest_disposisi_at: new Date().toISOString(),
              }
            : row
        )
      );

      setFeedback({
        type: "success",
        text: `Surat ${disposisiTarget.nomor_surat || ""} berhasil didisposisikan ke ${FIXED_TUJUAN_LABEL}.`,
      });
      closeDisposisiDialog();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan saat melakukan disposisi",
      });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiInbox className="text-purple-600" /> Surat Masuk
        </h2>
        <p className="text-gray-500 mt-1">Surat masuk yang diterima kantor desa</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        {feedback && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <select
            value={selectedDayFrom}
            onChange={(e) => setSelectedDayFrom(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tanggal Dari</option>
            {availableDays.map((day) => (
              <option key={day} value={String(day)}>{day}</option>
            ))}
          </select>
          <select
            value={selectedDayTo}
            onChange={(e) => setSelectedDayTo(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tanggal Sampai</option>
            {availableDays.map((day) => (
              <option key={day} value={String(day)}>{day}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih Bulan</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih Tahun</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {hasDateFilter && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
            <FiInfo className="h-4 w-4 text-blue-700" />
            <span>{filterDescription.replace(`${filteredSuratMasuk.length} data`, "")}<strong>{filteredSuratMasuk.length}</strong> data</span>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-500">Memuat data surat masuk...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : filteredSuratMasuk.length === 0 ? (
          <div className="py-8 text-center text-gray-500">Belum ada data surat masuk.</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-xs sm:text-sm table-auto border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-3 text-left font-bold text-gray-700 w-10">No</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 w-32">Nomor Surat</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 w-28">Tanggal</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[150px]">Pengirim</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-700 w-24">Urgensi</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[180px]">Perihal</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 w-40">Disposisi</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-700 w-28">Status</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-700 w-[320px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuratMasuk.map((surat, i) => (
                  <tr key={surat.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-2 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-3 font-semibold text-gray-900 break-words">{surat.nomor_surat}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDate(surat.tanggal_terima)}</td>
                    <td className="px-3 py-3 text-gray-700 leading-snug max-w-[150px] truncate" title={surat.asal_surat}>
                      {surat.asal_surat}
                    </td>
                    <td className="px-2 py-3">
                      <span className={`status-chip scale-90 origin-left ${getUrgensiClass(surat.urgensi)}`}>
                        {getUrgensiLabel(surat.urgensi)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600 leading-snug italic max-w-[180px] truncate" title={surat.perihal}>
                      {surat.perihal}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        {surat.latest_disposisi_tujuan ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 w-fit">
                              Sudah didisposisikan
                            </span>
                            <p className="text-[10px] font-medium text-slate-500 truncate max-w-[150px]" title={surat.latest_disposisi_tujuan_label || surat.latest_disposisi_tujuan}>
                              Ke: {surat.latest_disposisi_tujuan_label || surat.latest_disposisi_tujuan}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100 w-fit italic">
                            Tanpa disposisi
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => openDisposisiDialog(surat)}
                          disabled={submittingId === surat.id}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-sky-50 text-sky-600 text-[10px] font-bold hover:bg-sky-100 border border-sky-200 transition-all shadow-sm disabled:opacity-50"
                        >
                          <FiSend className="w-3.5 h-3.5" />
                          {submittingId === surat.id ? "..." : "Kirim Sekretaris"}
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {(() => {
                        const meta = getPenangananMeta(getPenangananStatus(surat));
                        return (
                          <span className={`status-chip scale-90 origin-left ${meta.className}`}>
                            {meta.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/kepala-desa/surat-masuk/${surat.id}`}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
                          title="Lihat detail"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          Detail
                        </Link>
                        {surat.file_path && (
                          <Link
                            href={`/kepala-desa/surat-masuk/${surat.id}/preview`}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm"
                            title="Unduh file"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                            Unduh
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {disposisiTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Disposisi Surat Masuk</h3>
            <p className="mt-1 text-sm text-gray-600">
              Nomor surat: <span className="font-semibold text-gray-800">{disposisiTarget.nomor_surat || "-"}</span>
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Tujuan Disposisi</label>
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 inline-flex items-center gap-2">
                  <FiUserCheck className="h-4 w-4" />
                  Surat ini akan dikirim ke <span className="font-semibold">{FIXED_TUJUAN_LABEL}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Sekretaris akan menentukan penerusan disposisi berikutnya ke kaur/kasi/staf sesuai kebutuhan.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Rekomendasi Tujuan Lanjutan oleh Sekretaris (opsional)
                </label>
                <input
                  type="text"
                  value={tujuanLanjutan}
                  onChange={(e) => setTujuanLanjutan(e.target.value)}
                  placeholder="Contoh: Kaur Pemerintahan dan Kasi Pelayanan"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Keterangan Disposisi (instruksi tindak lanjut)
                </label>
                <textarea
                  value={catatanDisposisi}
                  onChange={(e) => setCatatanDisposisi(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Isi arahan untuk petugas yang menerima disposisi"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDisposisiDialog}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDisposisi}
                disabled={submittingId === disposisiTarget.id}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <FiSend className="h-4 w-4" />
                {submittingId === disposisiTarget.id ? "Memproses..." : "Simpan Disposisi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
