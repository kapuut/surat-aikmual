export type AllowedSuratSlug =
  | "surat-domisili"
  | "surat-kematian"
  | "surat-kepemilikan"
  | "surat-cerai"
  | "surat-janda"
  | "surat-kehilangan"
  | "surat-penghasilan"
  | "surat-tidak-punya-rumah"
  | "surat-usaha";

export interface SuratTypeItem {
  slug: AllowedSuratSlug;
  title: string;
  description: string;
  templateFile: string;
  href: string;
}

export const ALLOWED_SURAT_TYPES: readonly SuratTypeItem[] = [
  {
    slug: "surat-domisili",
    title: "Surat Keterangan Domisili",
    description: "Surat keterangan tempat tinggal atau domisili",
    templateFile: "template-domisili.docx",
    href: "/permohonan/surat-domisili",
  },
  {
    slug: "surat-kematian",
    title: "Surat Keterangan Kematian",
    description: "Surat keterangan untuk keperluan administrasi kematian",
    templateFile: "template-kematian.docx",
    href: "/permohonan/surat-kematian",
  },
  {
    slug: "surat-kepemilikan",
    title: "Surat Keterangan Kepemilikan",
    description: "Surat keterangan kepemilikan tanah atau bangunan",
    templateFile: "template-kepemilikan.docx",
    href: "/permohonan/surat-kepemilikan",
  },
  {
    slug: "surat-cerai",
    title: "Surat Keterangan Cerai",
    description: "Surat keterangan status perceraian",
    templateFile: "template-cerai.docx",
    href: "/permohonan/surat-cerai",
  },
  {
    slug: "surat-janda",
    title: "Surat Keterangan Janda/Duda",
    description: "Surat keterangan status janda atau duda",
    templateFile: "template-janda-duda.docx",
    href: "/permohonan/surat-janda",
  },
  {
    slug: "surat-kehilangan",
    title: "Surat Keterangan Kehilangan",
    description: "Surat keterangan untuk barang atau dokumen hilang",
    templateFile: "template-kehilangan.docx",
    href: "/permohonan/surat-kehilangan",
  },
  {
    slug: "surat-penghasilan",
    title: "Surat Keterangan Penghasilan",
    description: "Surat keterangan penghasilan bulanan",
    templateFile: "template-penghasilan.docx",
    href: "/permohonan/surat-penghasilan",
  },
  {
    slug: "surat-tidak-punya-rumah",
    title: "Surat Keterangan Tidak Memiliki Rumah",
    description: "Surat keterangan tidak memiliki rumah",
    templateFile: "template-tidak-punya-rumah.docx",
    href: "/permohonan/surat-tidak-punya-rumah",
  },
  {
    slug: "surat-usaha",
    title: "Surat Keterangan Usaha",
    description: "Surat keterangan untuk keperluan usaha",
    templateFile: "template-usaha.docx",
    href: "/permohonan/surat-usaha",
  },
];

export const ALLOWED_SURAT_SLUGS = new Set(
  ALLOWED_SURAT_TYPES.map((item) => item.slug)
);

const aliasToSlugMap = new Map<string, AllowedSuratSlug>([
  ["surat-domisili", "surat-domisili"],
  ["surat keterangan domisili", "surat-domisili"],
  ["surat-kematian", "surat-kematian"],
  ["surat keterangan kematian", "surat-kematian"],
  ["surat-kepemilikan", "surat-kepemilikan"],
  ["surat keterangan kepemilikan", "surat-kepemilikan"],
  ["surat-cerai", "surat-cerai"],
  ["surat keterangan cerai", "surat-cerai"],
  ["surat-janda", "surat-janda"],
  ["surat keterangan janda/duda", "surat-janda"],
  ["surat keterangan janda", "surat-janda"],
  ["surat-kehilangan", "surat-kehilangan"],
  ["surat keterangan kehilangan", "surat-kehilangan"],
  ["surat-penghasilan", "surat-penghasilan"],
  ["surat keterangan penghasilan", "surat-penghasilan"],
  ["surat-tidak-punya-rumah", "surat-tidak-punya-rumah"],
  ["surat keterangan tidak memiliki rumah", "surat-tidak-punya-rumah"],
  ["surat-usaha", "surat-usaha"],
  ["surat keterangan usaha", "surat-usaha"],
]);

export function normalizeSuratSlug(value: string | null | undefined): AllowedSuratSlug | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  return aliasToSlugMap.get(normalized) ?? null;
}

export function getSuratBySlug(slug: AllowedSuratSlug): SuratTypeItem {
  const found = ALLOWED_SURAT_TYPES.find((item) => item.slug === slug);
  if (!found) {
    throw new Error("Surat type tidak ditemukan");
  }
  return found;
}
