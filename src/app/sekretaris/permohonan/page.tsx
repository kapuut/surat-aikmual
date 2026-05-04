"use client";

import { useEffect, useMemo, useState } from "react";
import PopupDatePicker from "@/components/shared/PopupDatePicker";
import { FiDownload, FiEye, FiInfo, FiRotateCcw, FiSearch } from "react-icons/fi";

type ArchiveCategory = "Semua" | "Surat Menunggu" | "Surat Selesai" | "Ditolak";

type WorkflowStatus =
  | "pending"
  | "diproses"
  | "dikirim_ke_kepala_desa"
  | "perlu_revisi"
  | "ditandatangani"
  | "selesai"
  | "ditolak";

interface PermohonanItem {
  id: number;
  nomor_surat: string | null;
  created_at: string;
  nama_pemohon: string;
  nik?: string;
  jenis_surat: string;
  keperluan?: string;
  catatan?: string | null;
  file_path?: string | null;
  attachment_paths?: string[];
  status: WorkflowStatus;
}

function statusLabel(status: WorkflowStatus): string {
  switch (status) {
    case "pending":
      return "Menunggu Verifikasi";
    case "diproses":
      return "Diproses";
    case "dikirim_ke_kepala_desa":
      return "Menunggu Konfirmasi Kepala Desa";
    case "perlu_revisi":
      return "Perlu Revisi";
    case "ditandatangani":
      return "Ditandatangani";
    case "selesai":
      return "Selesai";
    case "ditolak":
      return "Ditolak";
    default:
      return status;
  }
}

function isPermohonanBaruStatus(status: WorkflowStatus): boolean {
  return status === "pending" || status === "diproses" || status === "perlu_revisi";
}

function isMenungguTtdStatus(status: WorkflowStatus): boolean {
  return status === "dikirim_ke_kepala_desa";
}

function isSuratMenungguStatus(status: WorkflowStatus): boolean {
  return isPermohonanBaruStatus(status) || isMenungguTtdStatus(status);
}

function isPermohonanSelesaiStatus(status: WorkflowStatus): boolean {
  return status === "ditandatangani" || status === "selesai";
}

function matchesArchiveCategory(status: WorkflowStatus, archiveCategory: ArchiveCategory): boolean {
  switch (archiveCategory) {
    case "Surat Menunggu":
      return isSuratMenungguStatus(status);
    case "Surat Selesai":
      return isPermohonanSelesaiStatus(status);
    case "Ditolak":
      return status === "ditolak";
    case "Semua":
    default:
      return true;
  }
}

function statusClass(status: WorkflowStatus): string {
  switch (status) {
    case "pending":
      return "status-chip-warning";
    case "diproses":
      return "status-chip-primary";
    case "dikirim_ke_kepala_desa":
      return "status-chip-info";
    case "perlu_revisi":
      return "status-chip-warning";
    case "ditandatangani":
    case "selesai":
      return "status-chip-success";
    case "ditolak":
      return "status-chip-danger";
    default:
      return "status-chip-neutral";
  }
}

function nomorPermohonan(item: PermohonanItem): string {
  if (item.nomor_surat && item.nomor_surat.trim()) {
    return item.nomor_surat.trim();
  }

  const year = new Date(item.created_at).getFullYear();
  return `REG-${item.id}/${year}`;
}

function isFinalizedStatus(status: WorkflowStatus): boolean {
  return status === "ditandatangani" || status === "selesai";
}

function isAttachmentFile(pathValue: string | null | undefined): boolean {
  if (!pathValue) return false;
  return pathValue.includes('/uploads/');
}

function isGeneratedSuratFile(pathValue: string | null | undefined): boolean {
  if (!pathValue) return false;
  const lowerPath = pathValue.toLowerCase();
  return lowerPath.includes('/generated-surat/') || lowerPath.endsWith('.html') || lowerPath.includes('.html?');
}

function resolveAttachmentPaths(item: PermohonanItem): string[] {
  const normalizedFromArray = Array.isArray(item.attachment_paths)
    ? item.attachment_paths
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
    : [];

  if (normalizedFromArray.length > 0) {
    return Array.from(new Set(normalizedFromArray));
  }

  return isAttachmentFile(item.file_path) && item.file_path ? [item.file_path] : [];
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

export default function SekretarisPermohonanPage() {
  const [permohonan, setPermohonan] = useState<PermohonanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveCategory, setArchiveCategory] = useState<ArchiveCategory>("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");
  const [draftDayFrom, setDraftDayFrom] = useState("");
  const [draftDayTo, setDraftDayTo] = useState("");

  const fetchPermohonan = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/permohonan", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Gagal mengambil data permohonan");
      }

      setPermohonan(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermohonan();
  }, []);

  const filteredPermohonan = useMemo(() => {
    return permohonan.filter((item) => {
      const matchStatus = matchesArchiveCategory(item.status, archiveCategory);
      const matchSearch =
        item.nama_pemohon.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenis_surat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.nik || "").includes(searchTerm);
      const createdAt = new Date(item.created_at);
      const createdAtValue = Number.isNaN(createdAt.getTime()) ? "" : createdAt.toISOString().slice(0, 10);
      const dayMin = selectedDayFrom && selectedDayTo ? (selectedDayFrom <= selectedDayTo ? selectedDayFrom : selectedDayTo) : selectedDayFrom;
      const dayMax = selectedDayFrom && selectedDayTo ? (selectedDayFrom <= selectedDayTo ? selectedDayTo : selectedDayFrom) : selectedDayTo;
      const matchDayFrom = !dayMin || (createdAtValue !== "" && createdAtValue >= dayMin);
      const matchDayTo = !dayMax || (createdAtValue !== "" && createdAtValue <= dayMax);

      return matchStatus && matchSearch && matchDayFrom && matchDayTo;
    });
  }, [permohonan, archiveCategory, searchTerm, selectedDayFrom, selectedDayTo]);

  const filterDescription = useMemo(() => {
    if (!selectedDayFrom && !selectedDayTo) return "";
    const start = selectedDayFrom || selectedDayTo;
    const end = selectedDayTo || selectedDayFrom;
    return `Jumlah data dari tanggal ${formatIsoDate(start)} sampai ${formatIsoDate(end)} = ${filteredPermohonan.length} data`;
  }, [selectedDayFrom, selectedDayTo, filteredPermohonan.length]);

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

  const stats = {
    menungguVerifikasi: permohonan.filter((p) => p.status === "pending" || p.status === "diproses").length,
    dikirimKeKepala: permohonan.filter((p) => p.status === "dikirim_ke_kepala_desa").length,
    selesai: permohonan.filter((p) => p.status === "ditandatangani" || p.status === "selesai").length,
    ditolak: permohonan.filter((p) => p.status === "ditolak").length,
  };

  return (
    <section>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu Verifikasi</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.menungguVerifikasi}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-yellow-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu Konfirmasi Kepala Desa</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.dikirimKeKepala}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-indigo-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Selesai / Ditandatangani</p>
              <p className="text-2xl font-bold text-green-600">{stats.selesai}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">{stats.ditolak}</p>
            </div>
            <div className="bg-red-100 text-red-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
              NO
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Cari nama, NIK, atau jenis surat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />

          <select
            value={archiveCategory}
            onChange={(e) => setArchiveCategory(e.target.value as ArchiveCategory)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua</option>
            <option value="Surat Menunggu">Surat Menunggu</option>
            <option value="Surat Selesai">Surat Selesai</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>

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
          <span>{filterDescription.replace(`${filteredPermohonan.length} data`, "")}<strong>{filteredPermohonan.length}</strong> data</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-xs sm:text-sm table-auto border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-3 text-left font-bold text-gray-700 w-10">No</th>
              <th className="px-3 py-3 text-left font-bold text-gray-700 w-32">Nomor</th>
              <th className="px-3 py-3 text-left font-bold text-gray-700 w-24">Tanggal</th>
              <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[150px]">Nama Pemohon</th>
              <th className="px-3 py-3 text-left font-bold text-gray-700 w-32">NIK</th>
              <th className="px-3 py-3 text-left font-bold text-gray-700">Jenis Surat</th>
              <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[150px]">Keperluan</th>
              <th className="px-2 py-3 text-left font-bold text-gray-700 w-32">Status</th>
              <th className="px-2 py-3 text-center font-bold text-gray-700 w-48">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={9}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <span>Memuat data permohonan...</span>
                  </div>
                </td>
              </tr>
            ) : filteredPermohonan.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500 italic" colSpan={9}>
                  Belum ada data permohonan
                </td>
              </tr>
            ) : (
              filteredPermohonan.map((item, i) => {
                const isFinalized = isFinalizedStatus(item.status);
                const previewUrl = `/sekretaris/permohonan/${item.id}/preview`;

                return (
                <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-2 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900 break-words">{nomorPermohonan(item)}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-3 py-3 text-gray-700 font-medium max-w-[150px] truncate" title={item.nama_pemohon}>{item.nama_pemohon}</td>
                  <td className="px-3 py-3 text-gray-600">{item.nik || "-"}</td>
                  <td className="px-3 py-3 text-gray-700 leading-snug">{item.jenis_surat}</td>
                  <td className="px-3 py-3 text-gray-500 leading-snug italic truncate max-w-[150px]" title={item.keperluan || "-"}>
                    {item.keperluan || "-"}
                  </td>
                  <td className="px-2 py-3">
                    <span className={`status-chip scale-90 origin-left ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => window.open(previewUrl, "_blank")}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
                        title={isFinalized ? "Lihat surat final" : "Lihat draft surat"}
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        Lihat
                      </button>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm"
                        title={isFinalized ? "Unduh surat final" : "Unduh draft surat"}
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                        Unduh
                      </a>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
