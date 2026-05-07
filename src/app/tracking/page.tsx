'use client';

import { useRequireAuth } from '@/lib/hooks';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiDownload, FiClock, FiEye, FiInfo, FiSearch, FiRefreshCw, FiActivity, FiRotateCcw } from 'react-icons/fi';
import { useMemo } from 'react';
import SimpleLayout from '@/components/layout/SimpleLayout';
import PopupDatePicker from '@/components/shared/PopupDatePicker';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, StatusBadge, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/button';

interface Permohonan {
  id: number;
  nik: string;
  jenis_surat: string;
  nomor_surat: string | null;
  status:
    | 'pending'
    | 'diproses'
    | 'dikirim_ke_kepala_desa'
    | 'perlu_revisi'
    | 'ditandatangani'
    | 'selesai'
    | 'ditolak';
  tanggal_permohonan: string;
  tanggal_selesai: string | null;
  alasan_penolakan: string | null;
  file_path: string | null;
}

export default function TrackingPage() {
  const { user } = useRequireAuth();
  const [permohonan, setPermohonan] = useState<Permohonan[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFrom, setSelectedDateFrom] = useState('');
  const [selectedDateTo, setSelectedDateTo] = useState('');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');

  const summarizeReason = (reason: string | null): string => {
    const text = (reason || '').trim();
    if (!text) return '-';
    if (text.length <= 80) return text;
    return `${text.slice(0, 80)}...`;
  };

  const formatIsoDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-');
  };

  useEffect(() => {
    fetchPermohonan();
  }, []);

  const fetchPermohonan = async () => {
    try {
      setLoadingData(true);
      setFetchError(null);
      const response = await fetch('/api/permohonan', {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Gagal memuat riwayat permohonan');
      }

      setPermohonan(data.data || []);
    } catch (error) {
      console.error('Error fetching permohonan:', error);
      setFetchError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat riwayat');
      setPermohonan([]);
    } finally {
      setLoadingData(false);
    }
  };

  const buildPdfUrl = (item: Permohonan): string => {
    if (item.file_path) {
      return `${item.file_path}${item.file_path.includes('?') ? '&' : '?'}print=1`;
    }

    // Fallback untuk data lama yang statusnya final tetapi file final belum tertaut.
    return `/api/admin/permohonan/${item.id}/preview?print=1`;
  };

  const applyDateFilters = () => {
    if (draftDateFrom && draftDateTo && draftDateFrom > draftDateTo) {
      setSelectedDateFrom(draftDateTo);
      setSelectedDateTo(draftDateFrom);
      setDraftDateFrom(draftDateTo);
      setDraftDateTo(draftDateFrom);
      return;
    }

    setSelectedDateFrom(draftDateFrom);
    setSelectedDateTo(draftDateTo);
  };

  const resetDateFilters = () => {
    setSelectedDateFrom('');
    setSelectedDateTo('');
    setDraftDateFrom('');
    setDraftDateTo('');
  };

  const filteredPermohonan = useMemo(() => {
    return permohonan.filter(item => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const searchMatch = !normalizedSearch ||
        [item.jenis_surat, item.nomor_surat].filter(Boolean).some(v => String(v).toLowerCase().includes(normalizedSearch));

      const itemDate = item.tanggal_permohonan.split('T')[0];
      const dateFromMatch = !selectedDateFrom || itemDate >= selectedDateFrom;
      const dateToMatch = !selectedDateTo || itemDate <= selectedDateTo;

      return searchMatch && dateFromMatch && dateToMatch;
    });
  }, [permohonan, searchTerm, selectedDateFrom, selectedDateTo]);

  const hasDateFilter = Boolean(selectedDateFrom || selectedDateTo);

  const filterDescription = useMemo(() => {
    if (!selectedDateFrom && !selectedDateTo) return '';
    const parts: string[] = [];
    if (selectedDateFrom) parts.push(`dari ${formatIsoDate(selectedDateFrom)}`);
    if (selectedDateTo) parts.push(`sampai ${formatIsoDate(selectedDateTo)}`);
    return `Menampilkan data ${parts.join(' ')}`;
  }, [selectedDateFrom, selectedDateTo]);

  const isFilterActive = searchTerm !== '' || selectedDateFrom !== '' || selectedDateTo !== '';
  const canApplyDateFilter = draftDateFrom !== selectedDateFrom || draftDateTo !== selectedDateTo;
  const canResetDateFilter = draftDateFrom !== '' || draftDateTo !== '' || selectedDateFrom !== '' || selectedDateTo !== '';

  if (!loadingData && fetchError) {
    return (
      <SimpleLayout useSidebar>
        <Card>
          <CardBody>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
              {fetchError}
            </div>
          </CardBody>
        </Card>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout useSidebar>
      {/* Refresh Button */}
      <div className="mb-4 flex justify-end">
        {!loadingData && !fetchError && (
          <Button variant="outline" size="sm" onClick={fetchPermohonan}>
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      {/* Filters Section */}
      {!loadingData && permohonan.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="relative w-full sm:w-96">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari jenis atau nomor surat"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 hidden items-center justify-end gap-2 md:flex">
              <Button
                type="button"
                onClick={applyDateFilters}
                disabled={!canApplyDateFilter}
                variant="outline"
                size="sm"
                className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <FiActivity className="mr-2 h-4 w-4" />
                Terapkan Filter
              </Button>
              <Button
                type="button"
                onClick={resetDateFilters}
                disabled={!canResetDateFilter}
                variant="outline"
                size="sm"
              >
                <FiRotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <PopupDatePicker
                label="TANGGAL DARI"
                value={draftDateFrom}
                max={draftDateTo || undefined}
                onChange={setDraftDateFrom}
                placeholder="Pilih tanggal"
              />
              <PopupDatePicker
                label="TANGGAL SAMPAI"
                value={draftDateTo}
                min={draftDateFrom || undefined}
                onChange={setDraftDateTo}
                placeholder="Pilih tanggal"
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:hidden">
              <Button
                type="button"
                onClick={applyDateFilters}
                disabled={!canApplyDateFilter}
                variant="outline"
                size="sm"
                className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <FiActivity className="mr-2 h-4 w-4" />
                Terapkan Filter
              </Button>
              <Button
                type="button"
                onClick={resetDateFilters}
                disabled={!canResetDateFilter}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <FiRotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {hasDateFilter && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
              <FiInfo className="h-4 w-4 text-blue-700" />
              <span>{filterDescription.replace(`${filteredPermohonan.length} data`, '')}<strong>{filteredPermohonan.length}</strong> data</span>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loadingData && permohonan.length === 0 && (
        <Card>
          <CardBody>
            <EmptyState
              title="Belum ada permohonan"
              description="Anda belum membuat permohonan surat apapun. Mulai dengan membuat permohonan baru."
              action={
                <Link href="/permohonan">
              <Button>Buat Permohonan Baru</Button>
                </Link>
              }
            />
          </CardBody>
        </Card>
      )}

      {/* Table */}
      {!loadingData && permohonan.length > 0 && (
        <>
          <Card noPadding>
            <CardHeader title="Daftar Permohonan Anda" />
            <CardBody className="p-0">
              <Table className="min-w-[820px]">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Jenis Surat</TableHeaderCell>
                    <TableHeaderCell>Tanggal Pengajuan</TableHeaderCell>
                    <TableHeaderCell>Nomor Surat</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell align="center">Aksi</TableHeaderCell>
                    <TableHeaderCell align="center">Dokumen</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPermohonan.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" className="py-12 text-gray-500">
                        {isFilterActive ? "Data tidak ditemukan untuk filter ini." : "Tidak ada permohonan."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPermohonan.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium text-gray-900">{item.jenis_surat}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-700">
                            {new Date(item.tanggal_permohonan).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </TableCell>
                        <TableCell>
                          {item.nomor_surat ? (
                            <p className="font-mono text-sm text-green-700 font-bold">{item.nomor_surat}</p>
                          ) : (
                            <p className="text-gray-500 text-sm">Belum diterbitkan</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={
                              item.status as
                                | 'pending'
                                | 'diproses'
                                | 'dikirim_ke_kepala_desa'
                                | 'perlu_revisi'
                                | 'ditandatangani'
                                | 'selesai'
                                | 'ditolak'
                            }
                          />
                          {(item.status === 'ditolak' || item.status === 'perlu_revisi') && item.alasan_penolakan && (
                            <p className="mt-1 text-xs text-red-600">{summarizeReason(item.alasan_penolakan)}</p>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Link
                            href={`/tracking/${item.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                          >
                            <FiEye className="w-4 h-4" />
                            Lihat Detail
                          </Link>
                        </TableCell>
                        <TableCell align="center">
                          {item.status === 'selesai' || item.status === 'ditandatangani' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="inline-flex w-full sm:w-auto"
                              onClick={() => window.open(buildPdfUrl(item), '_blank')}
                            >
                              <FiDownload className="w-4 h-4" />
                              <span>Unduh PDF</span>
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                              <FiClock className="w-4 h-4" />
                              Belum tersedia
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          {/* Info Card */}
          <Card className="mt-6">
            <CardHeader title="Informasi " />
            <CardBody>
              <p className="text-sm text-gray-700 mb-4">
                Pantau status permohonan Anda di tabel di atas. Jika status sudah ditandatangani atau selesai, tombol unduh surat akan muncul otomatis.
              </p>
              <Link href="/permohonan">
                <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                  Buat Permohonan Baru
                </Button>
              </Link>
            </CardBody>
          </Card>
        </>
      )}

      {/* Loading State */}
      {loadingData && (
        <Card>
          <CardBody>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </SimpleLayout>
  );
}

