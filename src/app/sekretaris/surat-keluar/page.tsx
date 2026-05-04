"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PopupDatePicker from "@/components/shared/PopupDatePicker";
import { FiDownload, FiEye, FiInfo, FiRotateCcw, FiSearch } from "react-icons/fi";
import * as XLSX from "xlsx";

interface SuratKeluarItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  status: "Draft" | "Menunggu" | "Terkirim";
  file_path: string | null;
  source_type?: "manual" | "permohonan";
  source_permohonan_id?: number | null;
}

function getReferenceId(item: SuratKeluarItem): number {
  if (
    item.source_type === "permohonan"
    && item.source_permohonan_id
    && Number(item.source_permohonan_id) > 0
  ) {
    return -Math.abs(Number(item.source_permohonan_id));
  }

  return item.id;
}

function parseValidDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getExportDateLabel() {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatIsoDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");
}

function getStoredFileName(filePath?: string | null) {
  if (!filePath) {
    return "-";
  }

  const parts = filePath.split("/");
  return parts[parts.length - 1] || filePath;
}

export default function SekretarisSuratKeluarPage() {
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");
  const [draftDayFrom, setDraftDayFrom] = useState("");
  const [draftDayTo, setDraftDayTo] = useState("");

  const fetchSuratKeluar = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/surat-keluar", { credentials: "include" });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat data surat keluar");
      }

      setSuratKeluar(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuratKeluar();
  }, []);

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredSuratKeluar = suratKeluar.filter((item) => {
    const searchMatch = !normalizedSearchTerm || [item.nomor_surat, item.tujuan, item.perihal]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearchTerm));

    const tanggalSurat = parseValidDate(item.tanggal_surat);
    const tanggalSuratValue = tanggalSurat ? tanggalSurat.toISOString().slice(0, 10) : "";
    const dayMin = selectedDayFrom && selectedDayTo ? (selectedDayFrom <= selectedDayTo ? selectedDayFrom : selectedDayTo) : selectedDayFrom;
    const dayMax = selectedDayFrom && selectedDayTo ? (selectedDayFrom <= selectedDayTo ? selectedDayTo : selectedDayFrom) : selectedDayTo;
    const dayFromMatch = !dayMin || (tanggalSuratValue !== "" && tanggalSuratValue >= dayMin);
    const dayToMatch = !dayMax || (tanggalSuratValue !== "" && tanggalSuratValue <= dayMax);

    return searchMatch && dayFromMatch && dayToMatch;
  });

  const hasFilter = Boolean(normalizedSearchTerm || selectedDayFrom || selectedDayTo);

  const filterDescription = useMemo(() => {
    if (!selectedDayFrom && !selectedDayTo) return "";
    const start = selectedDayFrom || selectedDayTo;
    const end = selectedDayTo || selectedDayFrom;
    return `Jumlah data dari tanggal ${formatIsoDate(start)} sampai ${formatIsoDate(end)} = ${filteredSuratKeluar.length} data`;
  }, [selectedDayFrom, selectedDayTo, filteredSuratKeluar.length]);

  const hasDateFilter = Boolean(selectedDayFrom || selectedDayTo);

  const isFilterActive =
    searchTerm !== "" ||
    selectedDayFrom !== "" ||
    selectedDayTo !== "";

  const applyDateFilters = () => {
    if (draftDayFrom && draftDayTo && draftDayFrom > draftDayTo) {
      setSelectedDayFrom(draftDayTo);
      setSelectedDayTo(draftDayFrom);
      return;
    }

    setSelectedDayFrom(draftDayFrom);
    setSelectedDayTo(draftDayTo);
  };

  const resetDateFilters = () => {
    setDraftDayFrom("");
    setDraftDayTo("");
    setSelectedDayFrom("");
    setSelectedDayTo("");
  };



  const handleExportExcel = () => {
    const exportRows = filteredSuratKeluar.map((item, index) => ({
      No: index + 1,
      "Nomor Surat": item.nomor_surat,
      "Tanggal Kirim": formatDate(item.tanggal_surat),
      Tujuan: item.tujuan,
      Perihal: item.perihal,
      Status: item.status,
      "Nama File": getStoredFileName(item.file_path),
      "Status File": item.file_path ? "Tersedia" : "Tidak ada",
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["LAPORAN SURAT KELUAR"],
      [`Tanggal Export: ${getExportDateLabel()}`],
      [`Total Data: ${filteredSuratKeluar.length}`],
      [],
    ]);

    XLSX.utils.sheet_add_json(worksheet, exportRows, {
      origin: "A5",
      skipHeader: false,
    });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    ];

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 18 },
      { wch: 24 },
      { wch: 38 },
      { wch: 14 },
      { wch: 38 },
      { wch: 14 },
    ];

    worksheet["!autofilter"] = {
      ref: `A5:H${Math.max(exportRows.length + 5, 5)}`,
    };

    worksheet["!rows"] = [
      { hpt: 24 },
      { hpt: 20 },
      { hpt: 20 },
      { hpt: 8 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Keluar");

    const exportDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `laporan-surat-keluar-${exportDate}.xlsx`);
  };

  return (
    <section>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nomor surat, tujuan, atau perihal"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
          >
            Export
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyDateFilters}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              Terapkan Filter
            </button>
            <button
              type="button"
              onClick={resetDateFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              <FiRotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <PopupDatePicker
            label="Tanggal Dari"
            value={draftDayFrom}
            max={draftDayTo || undefined}
            onChange={setDraftDayFrom}
          />
          <PopupDatePicker
            label="Tanggal Sampai"
            value={draftDayTo}
            min={draftDayFrom || undefined}
            onChange={setDraftDayTo}
          />
        </div>
      </div>

      {hasDateFilter && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
          <FiInfo className="h-4 w-4 text-blue-700" />
          <span>{filterDescription.replace(`${filteredSuratKeluar.length} data`, "")}<strong>{filteredSuratKeluar.length}</strong> data</span>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data surat keluar...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : filteredSuratKeluar.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {hasFilter ? "Data surat keluar tidak ditemukan" : "Belum ada data surat keluar."}
          </div>
        ) : (
          <table className="w-full text-xs sm:text-sm table-auto border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-3 text-left font-bold text-gray-700 w-10">No</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 w-36">Nomor Surat</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 w-32">Tgl Kirim</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[150px]">Tujuan</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[200px]">Perihal</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 w-24">Status</th>
                <th className="px-2 py-3 text-center font-bold text-gray-700 w-48">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSuratKeluar.map((surat, i) => {
                const refId = getReferenceId(surat);

                return (
                <tr key={surat.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-2 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900 break-words">{surat.nomor_surat}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDate(surat.tanggal_surat)}</td>
                  <td className="px-3 py-3 text-gray-700 max-w-[150px] truncate" title={surat.tujuan}>{surat.tujuan}</td>
                  <td className="px-3 py-3 text-gray-600 max-w-[200px] truncate" title={surat.perihal}>{surat.perihal}</td>
                  <td className="px-3 py-3">
                    <span className={`status-chip scale-90 origin-left ${
                      surat.status === "Menunggu"
                        ? "status-chip-warning"
                        : surat.status === "Draft"
                          ? "status-chip-neutral"
                          : "status-chip-success"
                    }`}>
                      {surat.status}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-2">
                      {surat.file_path ? (
                        <>
                          <Link
                            href={`/sekretaris/surat-keluar/${refId}/preview`}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            Lihat
                          </Link>
                          <a
                            href={surat.file_path}
                            download={getStoredFileName(surat.file_path)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                            Unduh
                          </a>
                        </>
                      ) : (
                        <span className="text-[10px] font-semibold text-gray-400 italic bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          Tidak ada file
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
