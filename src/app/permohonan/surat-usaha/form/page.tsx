"use client";

import Link from "next/link";
import { FiArrowLeft, FiShield, FiCheckCircle, FiClock, FiFileText } from "react-icons/fi";

const persyaratan = [
	"Fotokopi Kartu Keluarga (KK)",
	"Fotokopi KTP Pemohon",
	"Surat Pengantar dari RT/RW",
	"Fotokopi SIUP/TDP (jika ada)",
	"Foto lokasi usaha",
	"Surat keterangan usaha dari RT/RW",
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
		title: "Verifikasi Lokasi",
		description: "Tim akan melakukan verifikasi lokasi usaha jika diperlukan"
	},
	{
		step: 5,
		title: "Tunggu Persetujuan",
		description: "Proses verifikasi membutuhkan waktu 2-4 hari kerja"
	},
	{
		step: 6,
		title: "Ambil Surat",
		description: "Surat dapat diambil di kantor desa atau dikirim via email"
	}
];

export default function SuratUsahaPage() {
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
				<div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl text-white p-8 mb-8">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
							<FiShield className="w-8 h-8" />
						</div>
						<div>
							<h1 className="text-3xl font-bold">Surat Keterangan Usaha</h1>
							<p className="text-indigo-100">Surat keterangan untuk keperluan usaha dan bisnis</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
						<div className="flex items-center gap-2">
							<FiClock className="w-4 h-4" />
							<span className="text-sm">Estimasi: 2-4 hari kerja</span>
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
							<FiFileText className="w-6 h-6 text-indigo-600" />
							Persyaratan
						</h2>
						<ul className="space-y-3">
							{persyaratan.map((item, index) => (
								<li key={index} className="flex items-start gap-3">
									<div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-xs font-semibold text-indigo-600">{index + 1}</span>
									</div>
									<span className="text-gray-700">{item}</span>
								</li>
							))}
						</ul>
					</div>

					{/* Prosedur */}
					<div className="bg-white rounded-xl p-6 shadow-sm">
						<h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
							<FiCheckCircle className="w-6 h-6 text-indigo-600" />
							Prosedur Pengajuan
						</h2>
						<div className="space-y-4">
							{prosedur.map((item, index) => (
								<div key={index} className="flex gap-4">
									<div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
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

				{/* Use Cases */}
				<div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
					<h2 className="text-xl font-bold text-gray-900 mb-4">Kegunaan Surat Ini</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="flex items-start gap-3">
							<div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
							<span className="text-gray-700">Pengajuan kredit usaha mikro</span>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
							<span className="text-gray-700">Pendaftaran program bantuan UMKM</span>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
							<span className="text-gray-700">Keperluan pajak dan perizinan</span>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
							<span className="text-gray-700">Verifikasi kegiatan usaha</span>
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
							href="/permohonan/surat-usaha/form"
							className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2"
						>
							<FiFileText className="w-5 h-5" />
							Ajukan Permohonan
						</Link>
						<Link
							href="/tracking"
							className="border border-indigo-600 text-indigo-600 font-semibold py-3 px-8 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors inline-flex items-center justify-center gap-2"
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
