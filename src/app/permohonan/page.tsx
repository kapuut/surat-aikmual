'use client';

import { useRequireAuth } from '@/lib/useAuth';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import SimpleLayout from '@/components/layout/SimpleLayout';
import Card, { CardBody } from '@/components/ui/Card';

const SURAT_TYPES = [
  {
    slug: 'surat-domisili',
    title: 'Surat Keterangan Domisili',
    description: 'Surat yang menyatakan tempat tinggal seseorang',
  },
  {
    slug: 'surat-masih-hidup',
    title: 'Surat Keterangan Masih Hidup',
    description: 'Surat pernyataan bahwa seseorang masih hidup',
  },
  {
    slug: 'surat-kematian',
    title: 'Surat Keterangan Kematian',
    description: 'Surat resmi untuk administrasi kematian',
  },
  {
    slug: 'surat-cerai',
    title: 'Surat Keterangan Cerai',
    description: 'Surat yang menyatakan status perceraian',
  },
  {
    slug: 'surat-janda',
    title: 'Surat Keterangan Janda',
    description: 'Surat yang menyatakan status janda',
  },
  {
    slug: 'surat-kehilangan',
    title: 'Surat Keterangan Hilang',
    description: 'Laporan resmi untuk dokumen atau barang yang hilang',
  },
  {
    slug: 'surat-penghasilan',
    title: 'Surat Keterangan Penghasilan',
    description: 'Surat yang menyatakan penghasilan seseorang',
  },
  {
    slug: 'surat-tidak-punya-rumah',
    title: 'Surat Keterangan Tidak Memiliki Rumah',
    description: 'Surat untuk pengajuan bantuan rumah atau properti',
  },
  {
    slug: 'surat-usaha',
    title: 'Surat Keterangan Usaha',
    description: 'Surat yang menyatakan kegiatan usaha seseorang',
  },
];

type DynamicTemplateSummary = {
  id: string;
  nama: string;
  jenisSurat: string;
  deskripsi: string;
};

function normalizeSuratName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function PermohonanPage() {
  useRequireAuth();

  const [dynamicTemplates, setDynamicTemplates] = useState<DynamicTemplateSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadDynamicTemplates = async () => {
      try {
        const response = await fetch('/api/dynamic-templates', { credentials: 'include' });
        const data = await response.json();

        if (!response.ok || !data?.success || !Array.isArray(data?.templates)) {
          return;
        }

        if (!cancelled) {
          setDynamicTemplates(data.templates);
        }
      } catch {
        // Keep static cards when dynamic endpoint is unavailable.
      }
    };

    loadDynamicTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  const suratCards = useMemo(() => {
    const staticCards = SURAT_TYPES.map((surat) => ({
      key: `static-${surat.slug}`,
      title: surat.title,
      description: surat.description,
      href: `/permohonan/${surat.slug}`,
    }));

    const mergedCards = [...staticCards];
    const cardIndexByName = new Map<string, number>();
    const seenDynamicNames = new Set<string>();

    mergedCards.forEach((card, index) => {
      cardIndexByName.set(normalizeSuratName(card.title), index);
    });

    for (const template of dynamicTemplates) {
      const dynamicTitle = (template.jenisSurat || template.nama || '').trim();
      if (!dynamicTitle) continue;

      const dynamicNameKey = normalizeSuratName(dynamicTitle);
      if (!dynamicNameKey || seenDynamicNames.has(dynamicNameKey)) {
        continue;
      }
      seenDynamicNames.add(dynamicNameKey);

      const dynamicCard = {
        key: `dynamic-${template.id}`,
        title: dynamicTitle,
        description: template.deskripsi || 'Jenis surat tambahan yang dikonfigurasi admin.',
        href: `/permohonan/dinamis/${encodeURIComponent(template.id)}`,
      };

      const existingIndex = cardIndexByName.get(dynamicNameKey);
      if (existingIndex !== undefined) {
        mergedCards[existingIndex] = {
          ...mergedCards[existingIndex],
          description: dynamicCard.description,
          href: dynamicCard.href,
        };
        continue;
      }

      cardIndexByName.set(dynamicNameKey, mergedCards.length);
      mergedCards.push(dynamicCard);
    }

    return mergedCards;
  }, [dynamicTemplates]);

  return (
    <SimpleLayout useSidebar>
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Permohonan Surat</h1>
        <p className="text-lg text-gray-600">Pilih jenis surat yang ingin Anda ajukan.</p>
      </div>

      {/* Surat Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {suratCards.map((surat) => (
          <Link
            key={surat.key}
            href={surat.href}
            className="group"
          >
            <Card className="h-full hover:shadow-lg">
              <CardBody className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition">
                  {surat.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 flex-1">{surat.description}</p>
                <div className="flex items-center gap-2 text-blue-900 font-medium group-hover:gap-3 transition">
                  <span>Ajukan</span>
                  <FiArrowRight className="w-4 h-4" />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </SimpleLayout>
  );
}
