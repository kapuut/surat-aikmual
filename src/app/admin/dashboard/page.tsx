"use client";

import { useState, useEffect, useMemo } from "react";
import { AuthUser } from "@/lib/types";
import { useSharedStats, AdminStats, DashboardStats } from "@/components/dashboard/SharedStats";
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiInbox,
  FiSend,
  FiFileText,
  FiUsers,
  FiUserCheck,
  FiTrendingUp,
} from "react-icons/fi";

export default function AdminDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const { stats, loading: statsLoading, error: statsError, refresh } = useSharedStats();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/verify", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const pendingCount = stats?.permohonan.pending ?? 0;
  const approvedCount = stats?.permohonan.disetujui ?? 0;
  const draftSuratKeluar = stats?.suratKeluar.draft ?? 0;
  const unreadSuratMasuk = stats?.suratMasuk.belumDibaca ?? 0;

  const staffHighlights = useMemo(
    () => [
      {
        role: "Sekretaris Desa",
        description:
          "Mengelola surat masuk dan keluar serta memverifikasi permohonan warga sebelum diajukan ke kepala desa.",
        accent: "text-blue-600",
        background: "bg-blue-50",
        icon: FiInbox,
        metrics: [
          {
            label: "Surat masuk bulan ini",
            value: stats?.suratMasuk.bulanIni ?? 0,
          },
          {
            label: "Surat keluar bulan ini",
            value: stats?.suratKeluar.bulanIni ?? 0,
          },
          {
            label: "Permohonan menunggu verifikasi",
            value: pendingCount,
          },
        ],
      },
      {
        role: "Kepala Desa",
        description:
          "Mereview dan menyetujui permohonan yang sudah diverifikasi serta memantau laporan layanan warga.",
        accent: "text-emerald-600",
        background: "bg-emerald-50",
        icon: FiCheckCircle,
        metrics: [
          {
            label: "Menunggu tanda tangan",
            value: pendingCount,
          },
          {
            label: "Surat disetujui bulan ini",
            value: approvedCount,
          },
          {
            label: "Surat keluar draft",
            value: draftSuratKeluar,
          },
        ],
      },
    ],
    [stats, pendingCount, approvedCount, draftSuratKeluar]
  );

  const teamActivity = useMemo(
    () => [
      {
        id: "ACT-2025-014",
        actor: "Sekretaris Desa",
        role: "sekretaris",
        action: `Memverifikasi ${Math.min(pendingCount, 3)} permohonan terbaru`,
        detail: "PM-2025-011, PM-2025-012",
        time: "09:25 WITA",
        status: "Selesai",
      },
      {
        id: "ACT-2025-013",
        actor: "Kepala Desa",
        role: "kepala_desa",
        action: "Menandatangani Surat Domisili",
        detail: "PM-2025-009",
        time: "08:10 WITA",
        status: "Tertanda",
      },
      {
        id: "ACT-2025-012",
        actor: "Sekretaris Desa",
        role: "sekretaris",
        action: "Mengunggah arsip surat keluar bulanan",
        detail: `${stats?.suratKeluar.total ?? 0} surat terekam`,
        time: "Kemarin",
        status: "Diarsipkan",
      },
      {
        id: "ACT-2025-011",
        actor: "Kepala Desa",
        role: "kepala_desa",
        action: "Memberi catatan revisi",
        detail: "Permohonan PM-2025-007",
        time: "Kemarin",
        status: "Perlu revisi",
      },
    ],
    [pendingCount, stats?.suratKeluar.total]
  );

  const oversightAlerts = useMemo(
    () => [
      {
        label: "Surat masuk belum dibaca",
        value: unreadSuratMasuk,
        description: "Segera distribusikan ke sekretaris untuk ditindaklanjuti.",
        tone: "info" as const,
      },
      {
        label: "Permohonan menunggu verifikasi",
        value: pendingCount,
        description: "Pastikan sekretaris telah melengkapi berkas sebelum dikirim ke kepala desa.",
        tone: "warning" as const,
      },
      {
        label: "Surat keluar masih draft",
        value: draftSuratKeluar,
        description: "Koordinasikan finalisasi sebelum surat disebarkan.",
        tone: "neutral" as const,
      },
    ],
    [draftSuratKeluar, pendingCount, unreadSuratMasuk]
  );

  const activityLog = useMemo(
    () => [
      {
        id: "LOG-1204",
        actor: "Sekretaris",
        message: "Memperbarui status permohonan PM-2025-012 menjadi 'Terverifikasi'.",
        timestamp: "10:42 WITA",
        status: "Sukses",
      },
      {
        id: "LOG-1203",
        actor: "Kepala Desa",
        message: "Menyetujui Surat Keterangan Usaha untuk pemohon 3512-2025.",
        timestamp: "09:58 WITA",
        status: "Sukses",
      },
      {
        id: "LOG-1202",
        actor: "Sekretaris",
        message: "Mengunggah template surat pengantar RT terbaru.",
        timestamp: "Kemarin",
        status: "Pembaharuan",
      },
      {
        id: "LOG-1201",
        actor: "Kepala Desa",
        message: "Memberikan catatan revisi pada permohonan PM-2025-007.",
        timestamp: "Kemarin",
        status: "Catatan",
      },
    ],
    []
  );

  const quickActions = useMemo(
    () => [
      {
        label: "Kelola akun pegawai",
        description: "Tambah atau nonaktifkan admin, sekretaris, dan kepala desa.",
        href: "/admin/users",
        icon: FiUsers,
      },
      {
        label: "Pantau log aktivitas",
        description: "Audit kegiatan terbaru untuk memastikan kepatuhan.",
        href: "/admin/laporan/grafik",
        icon: FiActivity,
      },
      {
        label: "Template dan arsip surat",
        description: "Perbarui template surat resmi sebelum digunakan petugas.",
        href: "/admin/template-surat",
        icon: FiFileText,
      },
    ],
    []
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-2">
              <FiUserCheck className="h-4 w-4" /> Portal Administrasi Terpadu
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Selamat datang, {user.nama}</h1>
            <p className="mt-1 text-gray-600 max-w-2xl">
              Pantau kinerja sekretaris dan kepala desa, kelola akun internal, serta pastikan setiap permohonan warga berjalan efisien dalam satu dasbor terpadu.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <p className="font-medium text-gray-700">{formattedDate}</p>
            <p className="flex items-center gap-2 text-green-600">
              <FiTrendingUp className="h-4 w-4" /> Sistem aktif dan tersinkron
                </p>
              </div>
            </div>
          </div>
          
          <div>
            {statsError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                Gagal memuat statistik terkini. <button onClick={refresh} className="underline font-semibold">Muat ulang</button>
              </div>
            )}
            {statsLoading && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
                ))}
              </div>
            )}
            {!statsLoading && stats && <AdminStats stats={stats as DashboardStats} />}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FiActivity className="h-5 w-5 text-blue-600" /> Aktivitas Terbaru Tim
                    </h2>
                    <p className="text-sm text-gray-500">Log koordinasi sekretaris dan kepala desa dalam 24 jam terakhir.</p>
                  </div>
                  <button onClick={refresh} className="text-sm text-blue-600 hover:underline">Segarkan</button>
                </div>
                <div className="mt-6 space-y-4">
                  {teamActivity.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        {item.role === "sekretaris" ? <FiInbox className="h-5 w-5" /> : <FiCheckCircle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">{item.actor}</p>
                          <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {item.role === "sekretaris" ? "Sekretaris" : "Kepala Desa"}
                          </span>
                          <span className="text-xs text-gray-400">{item.time}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{item.action}</p>
                        <p className="text-xs text-gray-500">{item.detail}</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiAlertCircle className="h-5 w-5 text-orange-500" /> Pengawasan Real-time
                </h2>
                <p className="mt-1 text-sm text-gray-500">Prioritas tindakan agar alur surat tetap terkoordinasi.</p>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {oversightAlerts.map((alert) => (
                    <div
                      key={alert.label}
                      className={`rounded-2xl border p-4 ${
                        alert.tone === "warning"
                          ? "border-orange-200 bg-orange-50"
                          : alert.tone === "info"
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-wide text-gray-500">{alert.label}</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{alert.value}</p>
                      <p className="mt-1 text-xs text-gray-600">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiUsers className="h-5 w-5 text-purple-600" /> Tindakan Cepat
                </h2>
                <p className="mt-1 text-sm text-gray-500">Akses fitur internal untuk memastikan kontrol penuh.</p>
                <div className="mt-4 space-y-4">
                  {quickActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        <span className="mt-1 rounded-lg bg-blue-600/10 p-2 text-blue-600">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <FiClock className="h-4 w-4 text-gray-300 group-hover:text-blue-400" />
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiFileText className="h-5 w-5 text-slate-600" /> Log Aktivitas Internal
                </h2>
                <p className="mt-1 text-sm text-gray-500">Riwayat audit untuk memastikan transparansi.</p>
                <div className="mt-4 space-y-4">
                  {activityLog.map((log) => (
                    <div key={log.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">{log.actor}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{log.message}</p>
                      <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiSend className="h-5 w-5 text-blue-600" /> Ringkasan Kinerja Peran
            </h2>
            <p className="mt-1 text-sm text-gray-500">Ikhtisar tugas dan progres setiap peran dalam sistem.</p>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {staffHighlights.map((highlight) => {
                const Icon = highlight.icon;
                return (
                  <div key={highlight.role} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-xl ${highlight.background} p-3 text-2xl text-gray-700`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className={`text-sm font-semibold uppercase tracking-wide ${highlight.accent}`}>{highlight.role}</p>
                        <p className="text-xs text-gray-500">Aktif dalam koordinasi harian</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">{highlight.description}</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {highlight.metrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl bg-white p-3 text-center shadow-sm">
                          <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                          <p className="text-xs text-gray-500">{metric.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
    </div>
  );
}