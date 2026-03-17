"use client";

import Link from "next/link";
import { FiArrowLeft, FiUsers, FiCheckCircle, FiClock, FiFileText } from "react-icons/fi";

const persyaratan = [
	"Fotokopi Kartu Keluarga (KK) Calon Suami",
	"Fotokopi Kartu Keluarga (KK) Calon Istri",
	"Fotokopi KTP Calon Suami",
	"Fotokopi KTP Calon Istri",
	"Fotokopi Akta Kelahiran Calon Suami",
	"Fotokopi Akta Kelahiran Calon Istri",
	"Surat Pengantar dari RT/RW masing-masing",
	"Surat Keterangan Belum Menikah dari Kelurahan asal",
	"Pas foto bersama 4x6 sebanyak 2 lembar",
	"Formulir permohonan yang telah diisi"
];

const prosedur = [
	{
		step: 1,
		title: "Siapkan Persyaratan",
		description: "Kumpulkan semua dokumen yang diperlukan dari kedua calon mempelai"
	},
	{
		step: 2,
		title: "Isi Formulir",
		description: "Klik tombol 'Ajukan Permohonan' dan isi formulir dengan lengkap"
	},
	{
		step: 3,
		title: "Upload Dokumen",
		description: "Upload semua dokumen persyaratan dalam format PDF atau JPG"
	},
	{
		step: 4,
		title: "Verifikasi Data",
		description: "Tim akan memverifikasi kelengkapan dan keabsahan dokumen"
	},
	{
		step: 5,
		title: "Konfirmasi Kehadiran",
		description: "Kedua calon mempelai diminta hadir untuk konfirmasi"
	},
	{
		step: 6,
		title: "Tunggu Persetujuan",
		description: "Proses verifikasi membutuhkan waktu 3-7 hari kerja"
	},
	{
		step: 7,
		title: "Ambil Surat",
		description: "Surat dapat diambil di kantor desa"
	}
];

export default function SuratNikahPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center gap-4">
						<Link
							href="/"
							className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
						>
							<FiArrowLeft className="w-5 h-5" />
							Kembali ke Beranda
						</Link>
					</div>
				</div>
			</header>

			<div className="max-w-4xl mx-auto px-4 py-8">
				{/* Hero Section */}
				<div className="bg-gradient-to-r from-pink-600 to-pink-700 rounded-2xl text-white p-8 mb-8">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
							<FiUsers className="w-8 h-8" />
						</div>
						<div>
							<h1 className="text-3xl font-bold">Surat Pengantar Nikah</h1>
							<p className="text-pink-100">Surat pengantar untuk keperluan pernikahan di KUA</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
						<div className="flex items-center gap-2">
							<FiClock className="w-4 h-4" />
							<span className="text-sm">Estimasi: 3-7 hari kerja</span>
						</div>
						<div className="flex items-center gap-2">
							<FiFileText className="w-4 h-4" />
							<span className="text-sm">Format: PDF/Digital</span>
						</div>
						<div className="flex items-center gap-2">
							<FiCheckCircle className="w-4 h-4" />
							<span className="text-sm">Gratis</span>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Persyaratan */}
					<div className="bg-white rounded-xl p-6 shadow-sm">
						<h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
							<FiFileText className="w-6 h-6 text-pink-600" />
							Persyaratan
						</h2>
						<ul className="space-y-3">
							{persyaratan.map((item, index) => (
								<li key={index} className="flex items-start gap-3">
									<div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-xs font-semibold text-pink-600">{index + 1}</span>
									</div>
									<span className="text-gray-700">{item}</span>
								</li>
							))}
						</ul>
					</div>

					{/* Prosedur */}
					<div className="bg-white rounded-xl p-6 shadow-sm">
						<h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
							<FiCheckCircle className="w-6 h-6 text-pink-600" />
							Prosedur Pengajuan
						</h2>
						<div className="space-y-4">
							{prosedur.map((item, index) => (
								<div key={index} className="flex gap-4">
									<div className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
										<span className="text-sm font-semibold">{item.step}</span>
									</div>
									<div>
										<h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
										<p className="text-sm text-gray-600">{item.description}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Important Note */}
				<div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
							<span className="text-xs font-bold text-white">i</span>
						</div>
						<div>
							<h3 className="font-semibold text-blue-800 mb-2">Informasi Penting</h3>
							<ul className="text-sm text-blue-700 space-y-1">
								<li>• Kedua calon mempelai harus hadir saat pengambilan surat</li>
								<li>• Surat ini berlaku untuk pendaftaran nikah di KUA</li>
								<li>• Pastikan semua data yang diisikan sudah benar dan sesuai KTP</li>
								<li>• Jika ada perubahan data, segera hubungi petugas desa</li>
							</ul>
						</div>
					</div>
				</div>

				{/* CTA Section */}
				<div className="mt-8 bg-white rounded-xl p-6 shadow-sm text-center">
					<h3 className="text-xl font-bold text-gray-900 mb-2">
						Siap Mengajukan Permohonan?
					</h3>
					<p className="text-gray-600 mb-6">
						Pastikan semua persyaratan sudah lengkap sebelum mengajukan permohonan
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							href="/permohonan/surat-nikah/form"
							className="bg-pink-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-pink-700 transition-colors inline-flex items-center justify-center gap-2"
						>
							<FiFileText className="w-5 h-5" />
							Ajukan Permohonan
						</Link>
						<Link
							href="/tracking"
							className="border border-pink-600 text-pink-600 font-semibold py-3 px-8 rounded-lg hover:bg-pink-600 hover:text-white transition-colors inline-flex items-center justify-center gap-2"
						>
							<FiCheckCircle className="w-5 h-5" />
							Lacak Status
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}