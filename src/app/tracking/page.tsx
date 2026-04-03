'use client';

import { useRequireAuth } from '@/lib/hooks';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiDownload, FiClock } from 'react-icons/fi';
import SimpleLayout from '@/components/layout/SimpleLayout';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, StatusBadge, EmptyState } from '@/components/ui/Table';
import { Button } from '@/components/ui/button';

interface Permohonan {
  id: number;
  nik: string;
  jenis_surat: string;
  nomor_surat: string | null;
  status: 'pending' | 'diproses' | 'selesai' | 'ditolak';
  tanggal_permohonan: string;
  tanggal_selesai: string | null;
  alasan_penolakan: string | null;
  file_path: string | null;
}

export default function TrackingPage() {
  const { user } = useRequireAuth();
  const [permohonan, setPermohonan] = useState<Permohonan[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchPermohonan();
  }, []);

  const fetchPermohonan = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/permohonan', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPermohonan(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching permohonan:', error);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <SimpleLayout useSidebar>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Lacak Surat</h1>
        <p className="text-lg text-gray-600">Pantau status permohonan surat Anda.</p>
      </div>

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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Jenis Surat</TableHeaderCell>
                    <TableHeaderCell>Tanggal Pengajuan</TableHeaderCell>
                    <TableHeaderCell>Nomor Surat</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell align="center">Dokumen</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permohonan.map(item => (
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
                        <StatusBadge status={item.status as 'pending' | 'diproses' | 'selesai' | 'ditolak'} />
                      </TableCell>
                      <TableCell align="center">
                        {item.status === 'selesai' && item.file_path ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="inline-flex"
                            onClick={() => window.open(item.file_path as string, '_blank')}
                          >
                            <FiDownload className="w-4 h-4" />
                            <span>Unduh Surat</span>
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                            <FiClock className="w-4 h-4" />
                            Belum tersedia
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          {/* Info Card */}
          <Card className="mt-6">
            <CardHeader title="Informasi " />
            <CardBody>
              <p className="text-sm text-gray-700 mb-4">
                Pantau status permohonan Anda di tabel di atas. Jika status sudah selesai, tombol unduh surat akan muncul otomatis.
              </p>
              <Link href="/permohonan">
                <Button variant="secondary" size="sm">
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
