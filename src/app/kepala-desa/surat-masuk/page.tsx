"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiInbox, FiDownload, FiEye, FiSend, FiUserCheck } from "react-icons/fi";

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

        setSuratMasuk(result.data || []);
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
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const parts: string[] = [];
    if (selectedDayFrom && selectedDayTo) {
      parts.push(`tanggal ${selectedDayFrom}\u2013${selectedDayTo}`);
    } else if (selectedDayFrom) {
      parts.push(`tanggal ${selectedDayFrom}`);
    } else if (selectedDayTo) {
      parts.push(`tanggal s/d ${selectedDayTo}`);
    }
    if (selectedMonth) parts.push(months[Number(selectedMonth) - 1] || selectedMonth);
    if (selectedYear) parts.push(`tahun ${selectedYear}`);
    return parts.length > 0 ? parts.join(' ') : 'semua waktu';
  }, [selectedYear, selectedMonth, selectedDayFrom, selectedDayTo]);

  const isFilterActive =
    selectedDayFrom !== "" ||
    selectedDayTo !== "" ||
    selectedMonth !== "" ||
    selectedYear !== "";

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

        {isFilterActive && (
          <div className="mb-4">
            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 border border-indigo-100">
              Jumlah data dari {filterDescription} = {filteredSuratMasuk.length} data
            </span>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-500">Memuat data surat masuk...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : filteredSuratMasuk.length === 0 ? (
          <div className="py-8 text-center text-gray-500">Belum ada data surat masuk.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-semibold">No</th>
                <th className="px-4 py-3 text-left font-semibold">Nomor Surat</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold">Pengirim</th>
                <th className="px-4 py-3 text-left font-semibold">Urgensi</th>
                <th className="px-4 py-3 text-left font-semibold">Perihal</th>
                <th className="px-4 py-3 text-left font-semibold">Disposisi</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuratMasuk.map((surat, i) => (
                <tr key={surat.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{surat.nomor_surat}</td>
                  <td className="px-4 py-3">{formatDate(surat.tanggal_terima)}</td>
                  <td className="px-4 py-3">{surat.asal_surat}</td>
                  <td className="px-4 py-3">
                    <span className={`status-chip ${getUrgensiClass(surat.urgensi)}`}>
                      {getUrgensiLabel(surat.urgensi)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{surat.perihal}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {surat.latest_disposisi_tujuan ? (
                        <div className="text-[10px] text-emerald-700">
                          <span className="status-chip status-chip-success">
                            Sudah didisposisikan
                          </span>
                          <p className="mt-1 text-[10px] font-semibold text-gray-700">
                            Tujuan: {surat.latest_disposisi_tujuan_label || surat.latest_disposisi_tujuan}
                          </p>
                        </div>
                      ) : (
                        <span className="status-chip status-chip-neutral">
                          Tanpa disposisi
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => openDisposisiDialog(surat)}
                        disabled={submittingId === surat.id}
                        className="aksi-btn aksi-btn-primary"
                      >
                        <FiSend className="h-3.5 w-3.5" />
                        {submittingId === surat.id ? "Memproses..." : "Kirim ke Sekretaris"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const meta = getPenangananMeta(getPenangananStatus(surat));
                      return (
                        <span className={`status-chip ${meta.className}`}>
                          {meta.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <Link
                        href={`/kepala-desa/surat-masuk/${surat.id}`}
                        className="aksi-btn-icon aksi-btn-view"
                        title="Lihat detail surat"
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                      {surat.file_path ? (
                        <>
                          <Link
                            href={`/kepala-desa/surat-masuk/${surat.id}/preview`}
                            className="aksi-btn-icon aksi-btn-download"
                            title="Lihat file surat"
                          >
                            <FiDownload className="w-4 h-4" />
                          </Link>
                        </>
                      ) : (
                        <span className="status-chip status-chip-neutral">Tidak ada file</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
