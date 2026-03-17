// src/app/page.tsx
"use client";

import Link from "next/link";
import { 
	FiFileText, 
	FiUser, 
	FiHome, 
	FiCreditCard, 
	FiHeart, 
	FiShield,
	FiMapPin,
	FiUsers,
	FiBookOpen,
	FiArrowRight,
	FiClock,
	FiCheckCircle,
	FiStar
} from "react-icons/fi";
import { ALLOWED_SURAT_TYPES } from "@/lib/surat-data";

const suratList = [
	{
		id: "surat-domisili",
		title: "Surat Keterangan Domisili",
		description: "Surat keterangan tempat tinggal/domisili",
		href: "/permohonan/surat-domisili",
		icon: FiHome,
		color: "bg-orange-500",
		estimasi: "1-2 hari kerja"
	},
	{
		id: "surat-kematian",
		title: "Surat Keterangan Kematian",
		description: "Surat keterangan untuk keperluan kematian",
		href: "/permohonan/surat-kematian",
		icon: FiHeart,
		color: "bg-gray-500",
		estimasi: "1-2 hari kerja"
	},
	{
		id: "surat-kepemilikan",
		title: "Surat Keterangan Kepemilikan",
		description: "Surat keterangan kepemilikan tanah/bangunan",
		href: "/permohonan/surat-kepemilikan",
		icon: FiHome,
		color: "bg-green-500",
		estimasi: "2-3 hari kerja"
	},
	{
		id: "surat-cerai",
		title: "Surat Keterangan Cerai",
		description: "Surat keterangan status perceraian",
		href: "/permohonan/surat-cerai",
		icon: FiUsers,
		color: "bg-purple-500",
		estimasi: "2-3 hari kerja"
	},
	{
		id: "surat-janda",
		title: "Surat Keterangan Janda/Duda",
		description: "Surat keterangan status janda atau duda",
		href: "/permohonan/surat-janda",
		icon: FiUser,
		color: "bg-pink-500",
		estimasi: "1-2 hari kerja"
	},
	{
		id: "surat-kehilangan",
		title: "Surat Keterangan Kehilangan",
		description: "Surat keterangan untuk barang hilang",
		href: "/permohonan/surat-kehilangan",
		icon: FiShield,
		color: "bg-red-500",
		estimasi: "1-2 hari kerja"
	},
	{
		id: "surat-penghasilan",
		title: "Surat Keterangan Penghasilan",
		description: "Surat keterangan penghasilan bulanan",
		href: "/permohonan/surat-penghasilan",
		icon: FiCreditCard,
		color: "bg-blue-500",
		estimasi: "2-3 hari kerja"
	},
	{
		id: "surat-tidak-punya-rumah",
		title: "Surat Keterangan Tidak Memiliki Rumah",
		description: "Surat keterangan tidak memiliki rumah",
		href: "/permohonan/surat-tidak-punya-rumah",
		icon: FiMapPin,
		color: "bg-indigo-500",
		estimasi: "2-3 hari kerja"
	},
	{
		id: "surat-usaha",
		title: "Surat Keterangan Usaha",
		description: "Surat keterangan untuk keperluan usaha",
		href: "/permohonan/surat-usaha",
		icon: FiShield,
		color: "bg-teal-500",
		estimasi: "2-4 hari kerja"
	}
];

export default function HomePage() {
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
				<div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-3">
						<img
							src="/images/logo-desa.png"
							alt="Logo Desa Aikmual"
							className="h-12 w-auto"
						/>
						<div>
							<h1 className="text-xl font-bold text-gray-900">Pelayanan Online</h1>
							<p className="text-sm text-gray-600">Desa Aikmual</p>
						</div>
					</div>
					<Link
						href="/login"
						className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
					>
						Masuk/Daftar
					</Link>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 overflow-hidden">
				<div className="absolute inset-0 bg-black/20"></div>
				
				<div className="relative max-w-7xl mx-auto px-4 text-center">
					<div className="max-w-4xl mx-auto">
						<h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
							Pelayanan Surat Online
							<span className="block text-blue-200 text-3xl md:text-4xl mt-2">
								Desa Aikmual
							</span>
						</h1>
						<p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
							Ajukan berbagai macam surat keterangan secara online dengan mudah, cepat, dan terpercaya
						</p>
						
						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							<Link
								href="#layanan"
								className="bg-white text-blue-600 font-semibold py-4 px-8 rounded-full shadow-lg hover:bg-blue-50 transition-all transform hover:scale-105 flex items-center gap-2"
							>
								<FiFileText className="w-5 h-5" />
								Pilih Layanan Surat
								<FiArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href="/tracking"
								className="border-2 border-white text-white font-semibold py-4 px-8 rounded-full hover:bg-white hover:text-blue-600 transition-all flex items-center gap-2"
							>
								<FiCheckCircle className="w-5 h-5" />
								Lacak Status Surat
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-16 bg-white">
				<div className="max-w-7xl mx-auto px-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
						<div className="p-6">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<FiClock className="w-8 h-8 text-blue-600" />
							</div>
							<h3 className="text-2xl font-bold text-gray-900 mb-2">24/7</h3>
							<p className="text-gray-600">Layanan Online Tersedia Kapan Saja</p>
						</div>
						<div className="p-6">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<FiCheckCircle className="w-8 h-8 text-green-600" />
							</div>
							<h3 className="text-2xl font-bold text-gray-900 mb-2">Mudah</h3>
							<p className="text-gray-600">Proses Pengajuan Yang Simpel</p>
						</div>
						<div className="p-6">
							<div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<FiStar className="w-8 h-8 text-purple-600" />
							</div>
							<h3 className="text-2xl font-bold text-gray-900 mb-2">Terpercaya</h3>
							<p className="text-gray-600">Resmi Dari Kantor Desa</p>
						</div>
					</div>
				</div>
			</section>

			{/* Services Section */}
			<main id="layanan" className="max-w-7xl mx-auto px-4 py-16">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold text-gray-900 mb-4">
						Layanan Surat Online
					</h2>
					<p className="text-lg text-gray-600 max-w-3xl mx-auto">
						Pilih jenis surat yang Anda butuhkan. Setiap layanan dilengkapi dengan persyaratan lengkap dan estimasi waktu penyelesaian.
					</p>
				</div>

				{/* Service Cards */}
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{suratList.map((item) => {
						const IconComponent = item.icon;
						return (
							<Link
									key={item.id}
								href={item.href}
								className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 hover:border-blue-300"
							>
								<div className="flex items-start gap-4">
									<div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
										<IconComponent className="w-6 h-6" />
									</div>
									<div className="flex-1">
										<h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
											{item.title}
										</h3>
										<p className="text-sm text-gray-600 mb-3 leading-relaxed">
											{item.description}
										</p>
										<div className="flex items-center justify-between">
											<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
												{item.estimasi}
											</span>
											<FiArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
										</div>
									</div>
								</div>
							</Link>
						);
					})}
				</div>

				{/* CTA Section */}
				<div className="mt-16 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
					<h3 className="text-2xl font-bold text-gray-900 mb-4">
							Butuh Bantuan Pengajuan?
					</h3>
					<p className="text-gray-600 mb-6">
							Gunakan pelacakan untuk melihat progres, atau hubungi petugas desa untuk konsultasi.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
								href="/login"
							className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
						>
								Masuk Untuk Mengajukan
						</Link>
						<Link
							href="/tracking"
							className="border border-blue-600 text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
						>
							Lacak Status Surat
						</Link>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="bg-white border-t py-8">
				<div className="max-w-7xl mx-auto px-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div>
							<div className="flex items-center gap-3 mb-4">
								<img
									src="/images/logo-desa.png"
									alt="Logo Desa Aikmual"
									className="h-10 w-auto"
								/>
								<div>
									<h3 className="text-lg font-bold text-gray-900">Desa Aikmual</h3>
									<p className="text-sm text-gray-600">Pelayanan Online</p>
								</div>
							</div>
							<p className="text-sm text-gray-600">
								Sistem informasi pelayanan surat online untuk mempermudah pelayanan administrasi desa.
							</p>
						</div>
						<div>
							<h4 className="text-lg font-semibold text-gray-900 mb-4">Layanan</h4>
							<ul className="space-y-2 text-sm text-gray-600">
								{ALLOWED_SURAT_TYPES.slice(0, 3).map((item) => (
									<li key={item.slug}>
										<Link href={item.href} className="hover:text-blue-600">{item.title}</Link>
									</li>
								))}
								<li><Link href="/tracking" className="hover:text-blue-600">Lacak Status Surat</Link></li>
								<li><Link href="/staff/login" className="hover:text-blue-600">Login Staff</Link></li>
							</ul>
						</div>
						<div>
							<h4 className="text-lg font-semibold text-gray-900 mb-4">Kontak</h4>
							<div className="space-y-2 text-sm text-gray-600">
								<p>Kantor Desa Aikmual</p>
								<p>Kecamatan Aikmual</p>
								<p>Kabupaten Lombok Utara</p>
								<p>Nusa Tenggara Barat</p>
							</div>
						</div>
					</div>
					<div className="border-t mt-8 pt-8">
						<div className="flex flex-col md:flex-row items-center justify-center gap-4">
							<p className="text-sm text-gray-600">
								&copy; {new Date().getFullYear()} SI Pengarsipan Surat Desa Aikmual. All rights reserved.
							</p>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}