"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiFileText, FiCheckCircle, FiClock } from "react-icons/fi";
import { OFFICIAL_STANDARD_PROCEDURE } from "@/lib/template-surat/official-defaults";

const persyaratan = [
	"Fotokopi Kartu Keluarga (KK)",
	"Fotokopi KTP Pemohon",
	"Surat Pengantar dari RT/RW",
	"Pas foto 3x4 sebanyak 2 lembar",
	"Fotokopi dokumen pendukung sesuai jenis surat",
	"Formulir permohonan yang telah diisi"
];

const prosedur = OFFICIAL_STANDARD_PROCEDURE.map((item) => ({
step: item.step,
title: item.title,
description: item.desc,
}));

const jenisSurat = [
	"Surat Keterangan Berkelakuan Baik",
	"Surat Keterangan Penghasilan",
	"Surat Keterangan Belum Menikah",
	"Surat Keterangan Kehilangan",
	"Surat Keterangan Kematian",
	"Surat Keterangan lainnya sesuai kebutuhan"
];

export default function SuratKeteranganPage() {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto px-4 py-8">
				<button
					type="button"
					onClick={() => router.back()}
					className="mb-4 inline-flex cursor-pointer items-center gap-2 font-medium text-green-600 transition-colors duration-200 hover:text-green-700"
				>
					<FiArrowLeft className="h-4 w-4" />
					<span>Kembali</span>
				</button>

				{/* Hero Section */}
				<div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl text-white p-8 mb-8">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
							<FiFileText className="w-8 h-8" />
						</div>
						<div>
							<h1 className="text-3xl font-bold">Surat Keterangan Umum</h1>
							<p className="text-green-100">Pembuatan surat keterangan umum dari desa</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
						<div className="flex items-center gap-2">
							<FiClock className="w-4 h-4" />
							<span className="text-sm">Status: Ikuti pembaruan di menu tracking</span>
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
							<FiFileText className="w-6 h-6 text-green-600" />
							Persyaratan
						</h2>
						<ul className="space-y-3">
							{persyaratan.map((item, index) => (
								<li key={index} className="flex items-start gap-3">
									<div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-xs font-semibold text-green-600">{index + 1}</span>
									</div>
									<span className="text-gray-700">{item}</span>
								</li>
							))}
						</ul>
					</div>

					{/* Prosedur */}
					<div className="bg-white rounded-xl p-6 shadow-sm">
						<h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
							<FiCheckCircle className="w-6 h-6 text-green-600" />
							Prosedur Pengajuan
						</h2>
						<div className="space-y-4">
							{prosedur.map((item, index) => (
								<div key={index} className="flex gap-4">
									<div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
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

				{/* Jenis Surat */}
				<div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
					<h2 className="text-xl font-bold text-gray-900 mb-4">Jenis Surat Keterangan yang Tersedia</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{jenisSurat.map((item, index) => (
							<div key={index} className="flex items-start gap-3">
								<div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
								<span className="text-gray-700">{item}</span>
							</div>
						))}
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
								<li>â€¢ Isi tujuan permohonan secara jelas pada formulir</li>
								<li>â€¢ Persyaratan tambahan mungkin diperlukan sesuai jenis surat</li>
								<li>â€¢ Untuk surat tertentu, mungkin diperlukan saksi atau konfirmasi tambahan</li>
								<li>â€¢ Hubungi petugas desa jika membutuhkan bantuan pengisian formulir</li>
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
							href="/permohonan/surat-keterangan/form"
							className="bg-green-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center justify-center gap-2"
						>
							<FiFileText className="w-5 h-5" />
							Ajukan Permohonan
						</Link>
						<Link
							href="/tracking"
							className="border border-green-600 text-green-600 font-semibold py-3 px-8 rounded-lg hover:bg-green-600 hover:text-white transition-colors inline-flex items-center justify-center gap-2"
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


