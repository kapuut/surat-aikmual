'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Surat, StatusSurat, KategoriSurat } from '@/lib/types';
import { Search, Plus, Eye, Edit, Trash2, Download, Filter } from 'lucide-react';

export default function SuratPage() {
  const router = useRouter();
  const [surat, setSurat] = useState<Surat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusSurat | 'ALL'>('ALL');
  const [kategoriFilter, setKategoriFilter] = useState<KategoriSurat | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  const fetchSurat = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (kategoriFilter !== 'ALL') params.append('kategori', kategoriFilter);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`/api/surat?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSurat(data.data || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching surat:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, kategoriFilter, itemsPerPage, currentPage]);

  useEffect(() => {
    fetchSurat();
  }, [currentPage, fetchSurat]);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/surat/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSurat();
      } else {
        alert('Gagal menghapus surat');
      }
    } catch (error) {
      console.error('Error deleting surat:', error);
      alert('Terjadi kesalahan saat menghapus surat');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const getStatusBadge = (status: string) => {
    // Status mapping untuk approval permohonan
    const statusStyles: Record<string, string> = {
      DITERIMA: 'bg-green-100 text-green-800',
      DIPROSES: 'bg-yellow-100 text-yellow-800',
      SELESAI: 'bg-blue-100 text-blue-800',
      DITOLAK: 'bg-red-100 text-red-800',
      // Status filing
      'aktif': 'bg-green-100 text-green-800',
      'arsip': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setKategoriFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Surat</h1>
            <p className="text-gray-600">Kelola dan arsipkan surat masuk dan keluar</p>
          </div>
          <Link href="/surat/tambah">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Surat
            </Button>
          </Link>
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari nomor surat, pengirim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusSurat | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ALL">Semua Status</option>
              <option value="DITERIMA">Diterima</option>
              <option value="DIPROSES">Diproses</option>
              <option value="SELESAI">Selesai</option>
              <option value="DITOLAK">Ditolak</option>
            </select>

            {/* Kategori Filter */}
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value as KategoriSurat | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="SURAT_MASUK">Surat Masuk</option>
              <option value="SURAT_KELUAR">Surat Keluar</option>
              <option value="SURAT_KEPUTUSAN">Surat Keputusan</option>
              <option value="SURAT_KETERANGAN">Surat Keterangan</option>
              <option value="SURAT_UNDANGAN">Surat Undangan</option>
            </select>

            {/* Reset Button */}
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Reset Filter
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          ) : surat.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4 bg-gray-100 w-16 h-16 rounded-lg flex items-center justify-center"><span className="text-2xl font-bold text-gray-500">-</span></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tidak ada surat
              </h3>
              <p className="text-gray-600 mb-4">
                Belum ada surat yang diarsipkan atau sesuai dengan filter pencarian.
              </p>
              <Link href="/surat/tambah">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Surat Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nomor Surat
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perihal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pengirim/Tujuan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {surat.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.nomorSurat}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={item.perihal}>
                          {item.perihal}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.pengirim || item.penerima || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {item.kategori.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(item.tanggal?.toString() || '')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Link href={`/surat/detail/${item.id}`}>
                            <Button size="sm" variant="outline" className="p-2">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/surat/edit/${item.id}`}>
                            <Button size="sm" variant="outline" className="p-2">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          {item.filePath && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="p-2"
                              onClick={() => window.open(item.filePath, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-2 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
              <div className="text-sm text-gray-700">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}