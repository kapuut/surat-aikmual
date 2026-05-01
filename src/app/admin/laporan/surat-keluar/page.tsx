"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

interface SuratKeluarApiItem {
  id?: number;
  nomor_surat?: string;
  tanggal_surat?: string;
  tujuan?: string;
  perihal?: string;
  created_by_name?: string | null;
  source_type?: "manual" | "permohonan";
}

interface SuratKeluarReportItem {
  noRegistrasi: string;
  noSurat: string;
  tanggalSurat: string;
  pengirim: string;
  perihal: string;
  penerima: string;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

function parseValidDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toIsoDate(value: string | null | undefined): string {
  const parsed = parseValidDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : "";
}

function formatDate(value: string): string {
  const parsed = parseValidDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function buildRegistrasiCode(prefix: string, idValue: number, dateValue: string): string {
  const year = parseValidDate(dateValue)?.getFullYear() || new Date().getFullYear();
  return `${prefix}-${String(idValue).padStart(3, "0")}/${year}`;
}

export default function LaporanSuratKeluarPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const [filterTanggalDari, setFilterTanggalDari] = useState("");
  const [filterTanggalSampai, setFilterTanggalSampai] = useState("");
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluarReportItem[]>([]);

  useEffect(() => {
    const fetchSuratKeluar = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/surat-keluar", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Gagal memuat data surat keluar");
        }

        const rows = Array.isArray(result?.data) ? (result.data as SuratKeluarApiItem[]) : [];
        const mapped = rows.map((item, index) => {
          const parsedId = Number(item.id);
          const idValue = Number.isFinite(parsedId) && parsedId !== 0 ? Math.abs(parsedId) : index + 1;
          const tanggalIso = toIsoDate(item.tanggal_surat);
          const registrasiPrefix = item.source_type === "permohonan" ? "REG-PRM" : "REG-OUT";

          return {
            noRegistrasi: buildRegistrasiCode(registrasiPrefix, idValue, tanggalIso),
            noSurat: String(item.nomor_surat || "-").trim() || "-",
            tanggalSurat: tanggalIso,
            pengirim: String(item.created_by_name || (item.source_type === "permohonan" ? "Permohonan Masyarakat" : "Admin/Operator Desa") || "-").trim() || "-",
            perihal: String(item.perihal || "-").trim() || "-",
            penerima: String(item.tujuan || "-").trim() || "-",
          };
        });

        setSuratKeluar(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat laporan");
      } finally {
        setLoading(false);
      }
    };

    fetchSuratKeluar();
  }, []);

  const availableYears = useMemo(() => {
    const years = suratKeluar
      .map((surat) => parseValidDate(surat.tanggalSurat)?.getFullYear() ?? null)
      .filter((year): year is number => year !== null)
      .filter((year) => Number.isFinite(year));

    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [suratKeluar]);

  const availableDays = useMemo(() => {
    if (filterBulan === "") {
      return Array.from({ length: 31 }, (_, index) => index + 1);
    }

    const month = Number(filterBulan);
    const fallbackYear = new Date().getFullYear();
    const year = filterTahun === "" ? fallbackYear : Number(filterTahun);

    if (!Number.isFinite(month) || month < 1 || month > 12) {
      return Array.from({ length: 31 }, (_, index) => index + 1);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => index + 1);
  }, [filterBulan, filterTahun]);

  useEffect(() => {
    if (filterTanggalDari !== "") {
      const selectedDayFromNumber = Number(filterTanggalDari);
      if (!availableDays.includes(selectedDayFromNumber)) {
        setFilterTanggalDari("");
      }
    }

    if (filterTanggalSampai !== "") {
      const selectedDayToNumber = Number(filterTanggalSampai);
      if (!availableDays.includes(selectedDayToNumber)) {
        setFilterTanggalSampai("");
      }
    }
  }, [availableDays, filterTanggalDari, filterTanggalSampai]);

  const filteredData = suratKeluar.filter((surat) => {
    const matchSearch = searchTerm === "" || 
      surat.noSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.pengirim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.noRegistrasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.penerima.toLowerCase().includes(searchTerm.toLowerCase());

    const tanggalSurat = parseValidDate(surat.tanggalSurat);
    const isValidDate = Boolean(tanggalSurat);
    const month = isValidDate ? tanggalSurat.getMonth() + 1 : null;
    const year = isValidDate ? tanggalSurat.getFullYear() : null;
    const day = isValidDate ? tanggalSurat.getDate() : null;
    
    const matchBulan = filterBulan === "" || 
      month === Number(filterBulan);
    
    const matchTahun = filterTahun === "" || 
      year === Number(filterTahun);

    const parsedDayFrom = filterTanggalDari === "" ? null : Number(filterTanggalDari);
    const parsedDayTo = filterTanggalSampai === "" ? null : Number(filterTanggalSampai);
    const dayMin = parsedDayFrom !== null && parsedDayTo !== null ? Math.min(parsedDayFrom, parsedDayTo) : parsedDayFrom;
    const dayMax = parsedDayFrom !== null && parsedDayTo !== null ? Math.max(parsedDayFrom, parsedDayTo) : parsedDayTo;
    const matchDayFrom = dayMin === null || (day !== null && day >= dayMin);
    const matchDayTo = dayMax === null || (day !== null && day <= dayMax);

    return matchSearch && matchDayFrom && matchDayTo && matchBulan && matchTahun;
  });

  const filterDescription = useMemo(() => {
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const parts: string[] = [];
    if (filterTanggalDari && filterTanggalSampai) {
      parts.push(`tanggal ${filterTanggalDari}–${filterTanggalSampai}`);
    } else if (filterTanggalDari) {
      parts.push(`tanggal ${filterTanggalDari}`);
    } else if (filterTanggalSampai) {
      parts.push(`tanggal s/d ${filterTanggalSampai}`);
    }
    if (filterBulan) parts.push(months[Number(filterBulan) - 1] || filterBulan);
    if (filterTahun) parts.push(`tahun ${filterTahun}`);
    return parts.length > 0 ? parts.join(' ') : 'semua waktu';
  }, [filterTahun, filterBulan, filterTanggalDari, filterTanggalSampai]);

  const monthlyChartData = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);

    for (const item of filteredData) {
      const date = parseValidDate(item.tanggalSurat);
      if (!date) continue;
      counts[date.getMonth()] += 1;
    }

    const maxValue = Math.max(...counts, 1);
    return MONTH_LABELS.map((label, index) => {
      const value = counts[index];
      const percent = value > 0 ? Math.max((value / maxValue) * 100, 8) : 0;
      return {
        label,
        value,
        width: `${percent}%`,
      };
    });
  }, [filteredData]);

  const handleExportExcel = () => {
    const exportRows = filteredData.map((surat, index) => ({
      No: index + 1,
      "No. Registrasi": surat.noRegistrasi,
      "No. Surat": surat.noSurat,
      "Tanggal Surat": formatDate(surat.tanggalSurat),
      Pengirim: surat.pengirim,
      Perihal: surat.perihal,
      Penerima: surat.penerima,
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["LAPORAN SURAT KELUAR"],
      [`Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`],
      [`Total Data: ${filteredData.length}`],
      [],
    ]);

    XLSX.utils.sheet_add_json(worksheet, exportRows, {
      origin: "A5",
      skipHeader: false,
    });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
    ];

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 26 },
      { wch: 38 },
      { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Keluar");

    const exportDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `laporan-surat-keluar-${exportDate}.xlsx`);
  };

  return (
    <section>
        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Surat Keluar</p>
              <p className="text-2xl font-bold text-red-600">{suratKeluar.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Data Ditampilkan</p>
              <p className="text-2xl font-bold text-green-600">{filteredData.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Bulan Ini</p>
              <p className="text-2xl font-bold text-purple-600">
                {suratKeluar.filter((s) => {
                  const currentDate = new Date();
                  const suratDate = parseValidDate(s.tanggalSurat);
                  if (!suratDate) return false;
                  return suratDate.getMonth() === currentDate.getMonth() && suratDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800">Grafik Surat Keluar per Bulan {filterTahun || new Date().getFullYear()}</h3>
          <p className="mt-1 text-xs text-gray-500">Mengikuti data yang sedang difilter.</p>
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-[36px_1fr_28px] items-center gap-2">
              <span></span><span></span>
              <span className="text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</span>
            </div>
            {monthlyChartData.map((item) => (
              <div key={item.label} className="grid grid-cols-[36px_1fr_28px] items-center gap-2">
                <span className="text-xs text-gray-500">{item.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all"
                    style={{ width: item.width }}
                  />
                </div>
                <span className="text-right text-xs font-medium text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cari berdasarkan nomor surat, pengirim, perihal, atau penerima..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="Pencarian"
              />
            </div>
            
            <div>
              <select
                value={filterTanggalDari}
                onChange={(e) => setFilterTanggalDari(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="Tanggal Dari"
              >
                <option value="">Tanggal Dari</option>
                {availableDays.map((day) => (
                  <option key={day} value={String(day)}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterTanggalSampai}
                onChange={(e) => setFilterTanggalSampai(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="Tanggal Sampai"
              >
                <option value="">Tanggal Sampai</option>
                {availableDays.map((day) => (
                  <option key={day} value={String(day)}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="Bulan"
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
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="Tahun"
              >
                <option value="">Semua Tahun</option>
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            Jumlah data dari {filterDescription} = {filteredData.length} data
          </div>
          
          <button 
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
          >
            Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No. Registrasi</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No. Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Pengirim</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Penerima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Memuat data laporan...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((surat, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-red-600">{surat.noRegistrasi}</td>
                    <td className="px-4 py-3">{surat.noSurat}</td>
                    <td className="px-4 py-3">{formatDate(surat.tanggalSurat)}</td>
                    <td className="px-4 py-3">{surat.pengirim}</td>
                    <td className="px-4 py-3">{surat.perihal}</td>
                    <td className="px-4 py-3">{surat.penerima}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada data yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </section>
  );
}