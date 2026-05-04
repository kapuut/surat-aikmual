'use client';

import { useRequireAuth } from '@/lib/hooks';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiDownload, FiClock, FiEye, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { useMemo } from 'react';
import SimpleLayout from '@/components/layout/SimpleLayout';
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
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDayFrom, setSelectedDayFrom] = useState('');
  const [selectedDayTo, setSelectedDayTo] = useState('');

  const summarizeReason = (reason: string | null): string => {
    const text = (reason || '').trim();
    if (!text) return '-';
    if (text.length <= 80) return text;
    return `${text.slice(0, 80)}...`;
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

  const yearOptions = useMemo(() => {
    const startYear = 2016;
    const currentYear = new Date().getFullYear();
    const endYear = Math.max(currentYear, startYear);
    return Array.from({ length: endYear - startYear + 1 }, (_, index) => String(endYear - index));
  }, []);

  const monthOptions = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const filteredPermohonan = useMemo(() => {
    return permohonan.filter(item => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const searchMatch = !normalizedSearch || 
        [item.jenis_surat, item.nomor_surat].filter(Boolean).some(v => String(v).toLowerCase().includes(normalizedSearch));

      const date = new Date(item.tanggal_permohonan);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const parsedDayFrom = selectedDayFrom === '' ? null : Number(selectedDayFrom);
      const parsedDayTo = selectedDayTo === '' ? null : Number(selectedDayTo);
      const dayMin = parsedDayFrom !== null && parsedDayTo !== null ? Math.min(parsedDayFrom, parsedDayTo) : parsedDayFrom;
      const dayMax = parsedDayFrom !== null && parsedDayTo !== null ? Math.max(parsedDayFrom, parsedDayTo) : parsedDayTo;

      const dayFromMatch = dayMin === null || day >= dayMin;
      const dayToMatch = dayMax === null || day <= dayMax;
      const monthMatch = !selectedMonth || String(month) === selectedMonth;
      const yearMatch = !selectedYear || String(year) === selectedYear;

      return searchMatch && dayFromMatch && dayToMatch && monthMatch && yearMatch;
    });
  }, [permohonan, searchTerm, selectedDayFrom, selectedDayTo, selectedMonth, selectedYear]);

  const filterDescription = useMemo(() => {
    const parts: string[] = [];
    if (selectedDayFrom && selectedDayTo) parts.push(`tanggal ${selectedDayFrom}\u2013${selectedDayTo}`);
    else if (selectedDayFrom) parts.push(`tanggal ${selectedDayFrom}`);
    else if (selectedDayTo) parts.push(`tanggal s/d ${selectedDayTo}`);
    
    if (selectedMonth) {
      const m = monthOptions.find(o => o.value === selectedMonth);
      if (m) parts.push(m.label);
    }
    
    if (selectedYear) parts.push(`tahun ${selectedYear}`);
    return parts.length > 0 ? parts.join(' ') : 'semua waktu';
  }, [selectedDayFrom, selectedDayTo, selectedMonth, selectedYear]);

  const isFilterActive = searchTerm !== '' || selectedDayFrom !== '' || selectedDayTo !== '' || selectedMonth !== '' || selectedYear !== '';

  if (!loadingData && fetchError) {
    return (
      <SimpleLayout useSidebar>
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Lacak Surat</h1>
          <p className="text-base sm:text-lg text-gray-600">Pantau status permohonan surat Anda.</p>
        </div>

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
      {/* Header Section */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Lacak Surat</h1>
          <p className="text-base sm:text-lg text-gray-600">Pantau status permohonan surat Anda.</p>
        </div>
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
              <div className="relative w-full sm:w-80">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari jenis atau nomor surat"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedDayFrom}
                  onChange={(e) => setSelectedDayFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tgl Dari</option>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={selectedDayTo}
                  onChange={(e) => setSelectedDayTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tgl Ke</option>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Bulan</option>
                  {monthOptions.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Tahun</option>
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isFilterActive && (
            <div>
              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 border border-indigo-100">
                Jumlah data dari {filterDescription} = {filteredPermohonan.length} data
              </span>
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
