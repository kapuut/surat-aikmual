"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiCalendar, FiDownload, FiInbox, FiRefreshCw, FiSend, FiUserCheck } from "react-icons/fi";

interface SuratMasukItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  perihal: string;
  file_path?: string | null;
  created_by_name?: string | null;
  latest_disposisi_tujuan?: string | null;
  latest_disposisi_tujuan_label?: string | null;
  latest_disposisi_status?: string | null;
  latest_disposisi_catatan?: string | null;
  latest_disposisi_at?: string | null;
  latest_disposisi_by?: string | null;
}

const FIXED_TUJUAN_ROLE = "sekretaris";
const FIXED_TUJUAN_LABEL = "Sekretaris Desa";

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value?: string): string {
  const parsed = parseDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function normalizeCsvCell(value: string): string {
  const text = value.replace(/\r?\n/g, " ").replace(/"/g, '""');
  return `"${text}"`;
}

export default function KepalaDesaLaporanSuratMasukPage() {
  const [data, setData] = useState<SuratMasukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [disposisiTarget, setDisposisiTarget] = useState<SuratMasukItem | null>(null);
  const [tujuanLanjutan, setTujuanLanjutan] = useState<string>("");
  const [catatanDisposisi, setCatatanDisposisi] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [sortBy, setSortBy] = useState<
    "tanggal-desc" | "tanggal-asc" | "bulan-desc" | "bulan-asc" | "tahun-desc" | "tahun-asc"
  >("tanggal-desc");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/surat-masuk", { credentials: "include" });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat data laporan surat masuk");
      }

      setData((result.data || []) as SuratMasukItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

      const nowIso = new Date().toISOString();

      setData((current) =>
        current.map((row) =>
          row.id === disposisiTarget.id
            ? {
                ...row,
                latest_disposisi_tujuan: FIXED_TUJUAN_ROLE,
                latest_disposisi_tujuan_label: FIXED_TUJUAN_LABEL,
                latest_disposisi_status: "didisposisikan",
                latest_disposisi_catatan: catatanDisposisi,
                latest_disposisi_at: nowIso,
                latest_disposisi_by: "Kepala Desa",
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

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const values = new Set<number>([currentYear]);

    data.forEach((item) => {
      const parsed = parseDate(item.tanggal_terima || item.tanggal_surat);
      if (parsed) values.add(parsed.getFullYear());
    });

    return Array.from(values).sort((a, b) => b - a);
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchPool = [
        item.nomor_surat,
        item.asal_surat,
        item.perihal,
        item.created_by_name || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchTerm.trim() || searchPool.includes(searchTerm.trim().toLowerCase());

      const dateSource = parseDate(item.tanggal_terima || item.tanggal_surat);
      const matchesMonth = !filterMonth || (dateSource ? dateSource.getMonth() + 1 === Number(filterMonth) : false);
      const matchesYear = !filterYear || (dateSource ? dateSource.getFullYear() === Number(filterYear) : false);

      return matchesSearch && matchesMonth && matchesYear;
    });
  }, [data, searchTerm, filterMonth, filterYear]);

  const sortedData = useMemo(() => {
    const rows = [...filteredData];

    rows.sort((a, b) => {
      const dateA = parseDate(a.tanggal_terima || a.tanggal_surat);
      const dateB = parseDate(b.tanggal_terima || b.tanggal_surat);

      const timeA = dateA?.getTime() ?? 0;
      const timeB = dateB?.getTime() ?? 0;
      const monthA = dateA ? dateA.getMonth() + 1 : 0;
      const monthB = dateB ? dateB.getMonth() + 1 : 0;
      const yearA = dateA?.getFullYear() ?? 0;
      const yearB = dateB?.getFullYear() ?? 0;

      switch (sortBy) {
        case "tanggal-asc":
          return timeA - timeB;
        case "tanggal-desc":
          return timeB - timeA;
        case "bulan-asc":
          return monthA - monthB || yearA - yearB || timeA - timeB;
        case "bulan-desc":
          return monthB - monthA || yearB - yearA || timeB - timeA;
        case "tahun-asc":
          return yearA - yearB || monthA - monthB || timeA - timeB;
        case "tahun-desc":
          return yearB - yearA || monthB - monthA || timeB - timeA;
        default:
          return timeB - timeA;
      }
    });

    return rows;
  }, [filteredData, sortBy]);

  const totalSuratMasuk = data.length;
  const totalFiltered = sortedData.length;
  const bulanIniCount = data.filter((item) => {
    const parsed = parseDate(item.tanggal_terima || item.tanggal_surat);
    if (!parsed) return false;
    const now = new Date();
    return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
  }).length;
  const pengirimUnik = new Set(data.map((item) => (item.asal_surat || "").trim()).filter(Boolean)).size;

  const downloadCsv = () => {
    const header = ["No", "Nomor Surat", "Tanggal Terima", "Asal Surat", "Perihal", "Petugas Input"];
    const rows = sortedData.map((item, index) => [
      String(index + 1),
      item.nomor_surat || "-",
      formatDate(item.tanggal_terima || item.tanggal_surat),
      item.asal_surat || "-",
      item.perihal || "-",
      item.created_by_name || "-",
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => normalizeCsvCell(cell)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `laporan-surat-masuk-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiInbox className="text-purple-600" /> Surat Masuk
        </h2>
        <p className="text-gray-500 mt-1">Ringkasan surat masuk berdasarkan filter periode dan pencarian.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pencarian</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor surat, asal surat, perihal, atau petugas..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Semua Tahun</option>
              {years.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sorting</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="tanggal-desc">Tanggal Terbaru</option>
              <option value="tanggal-asc">Tanggal Terlama</option>
              <option value="bulan-desc">Bulan Terbesar ke Kecil</option>
              <option value="bulan-asc">Bulan Terkecil ke Besar</option>
              <option value="tahun-desc">Tahun Terbaru</option>
              <option value="tahun-asc">Tahun Terlama</option>
            </select>
          </div>
        </div>
      </div>

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

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="text-sm text-gray-600 inline-flex items-center gap-2">
          <FiCalendar className="text-gray-500" />
          Menampilkan {totalFiltered} dari {totalSuratMasuk} surat masuk
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm hover:bg-slate-200"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
          >
            <FiDownload className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Surat Masuk</p>
          <p className="text-2xl font-bold text-blue-700">{totalSuratMasuk}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Data Ditampilkan</p>
          <p className="text-2xl font-bold text-emerald-700">{totalFiltered}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Bulan Ini</p>
          <p className="text-2xl font-bold text-purple-700">{bulanIniCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Pengirim Unik</p>
          <p className="text-2xl font-bold text-slate-700">{pengirimUnik}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data laporan surat masuk...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : sortedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tidak ada data yang sesuai filter.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Terima</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Asal Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Petugas Input</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Disposisi</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">{item.nomor_surat || "-"}</td>
                  <td className="px-4 py-3">{formatDate(item.tanggal_terima || item.tanggal_surat)}</td>
                  <td className="px-4 py-3">{item.asal_surat || "-"}</td>
                  <td className="px-4 py-3">{item.perihal || "-"}</td>
                  <td className="px-4 py-3">{item.created_by_name || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {item.latest_disposisi_tujuan ? (
                        <div className="text-xs text-emerald-700">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 font-semibold">
                            Sudah didisposisikan
                          </span>
                          <p className="mt-1 font-semibold text-gray-700">
                            Tujuan: {item.latest_disposisi_tujuan_label || item.latest_disposisi_tujuan}
                          </p>
                          <p className="mt-1 text-gray-600">
                            {formatDate(item.latest_disposisi_at || undefined)}
                            {item.latest_disposisi_by ? ` • oleh ${item.latest_disposisi_by}` : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          Tanpa disposisi
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => openDisposisiDialog(item)}
                        disabled={submittingId === item.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        <FiSend className="h-3.5 w-3.5" />
                        {submittingId === item.id ? "Memproses..." : "Kirim ke Sekretaris"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Link
                        href={`/kepala-desa/surat-masuk/${item.id}`}
                        className="text-xs font-medium text-slate-700 hover:text-blue-600 hover:underline"
                      >
                        Lihat Detail
                      </Link>
                      {item.file_path ? (
                        <a href={item.file_path} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          Lihat File
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
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
