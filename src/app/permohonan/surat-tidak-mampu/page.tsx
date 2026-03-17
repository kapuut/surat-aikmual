"use client";

import Link from "next/link";
import { FiArrowLeft, FiHeart, FiCheckCircle, FiClock, FiFileText } from "react-icons/fi";

const persyaratan = [
	"Fotokopi Kartu Keluarga (KK)",
	"Fotokopi KTP Pemohon",
	"Surat Pengantar dari RT/RW",
	"Surat Keterangan Penghasilan dari RT/RW",
	"Fotokopi Kartu Keluarga Sejahtera (jika ada)",
	"Surat pernyataan tidak mampu bermaterai",
	"Formulir permohonan yang telah diisi"
];

const prosedur = [
	{
		step: 1,
		title: "Siapkan Persyaratan",
		description: "Kumpulkan semua dokumen yang diperlukan sesuai daftar persyaratan"
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
		title: "Verifikasi Lapangan",
		description: "Tim akan melakukan verifikasi kondisi ekonomi keluarga"
	},
	{
		step: 5,
		title: "Tunggu Persetujuan",
		description: "Proses verifikasi membutuhkan waktu 2-3 hari kerja"
	},
	{
		step: 6,
		title: "Ambil Surat",
		description: "Surat dapat diambil di kantor desa atau dikirim via email"
	}
];

export default function SuratTidakMampuPage() {
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
				<div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl text-white p-8 mb-8">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
							<FiHeart className="w-8 h-8" />
						</div>
						<div>
							<h1 className="text-3xl font-bold">Surat Keterangan Tidak Mampu</h1>
							<p className="text-red-100">Surat keterangan untuk keluarga tidak mampu</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
						<div className="flex items-center gap-2">
							<FiClock className="w-4 h-4" />
							<span className="text-sm">Estimasi: 2-3 hari kerja</span>
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
							<FiFileText className="w-6 h-6 text-red-600" />
							Persyaratan
						</h2>
						<ul className="space-y-3">
							{persyaratan.map((item, index) => (
								<li key={index} className="flex items-start gap-3">
									<div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-xs font-semibold text-red-600">{index + 1}</span>
									</div>
									<span className="text-gray-700">{item}</span>
								</li>
							))}
						</ul>
					</div>

					{/* Prosedur */}
					<div className="bg-white rounded-xl p-6 shadow-sm">
						<h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
							<FiCheckCircle className="w-6 h-6 text-red-600" />
							Prosedur Pengajuan
						</h2>
						<div className="space-y-4">
							{prosedur.map((item, index) => (
								<div key={index} className="flex gap-4">
									<div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
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
				<div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
							<span className="text-xs font-bold text-white">!</span>
						</div>
						<div>
							<h3 className="font-semibold text-yellow-800 mb-2">Catatan Penting</h3>
							<p className="text-sm text-yellow-700">
								Surat keterangan tidak mampu akan melalui proses verifikasi lapangan untuk memastikan 
								keakuratan data ekonomi keluarga. Proses ini diperlukan untuk menjaga integritas bantuan 
								sosial dan program pemerintah lainnya.
							</p>
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
							href="/permohonan/surat-tidak-mampu/form"
							className="bg-red-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-2"
						>
							<FiFileText className="w-5 h-5" />
							Ajukan Permohonan
						</Link>
						<Link
							href="/tracking"
							className="border border-red-600 text-red-600 font-semibold py-3 px-8 rounded-lg hover:bg-red-600 hover:text-white transition-colors inline-flex items-center justify-center gap-2"
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