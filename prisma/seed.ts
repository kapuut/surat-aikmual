import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding database...');

  // Data sample surat untuk testing
  const sampleSurat = [
    {
      nomorSurat: 'SM/001/2024',
      perihal: 'Undangan Rapat Koordinasi',
      tanggalSurat: new Date(),
      pengirim: 'Dinas Pendidikan',
      penerima: 'Kepala Desa'
    }
  ];

  console.log('✅ Seeding selesai');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });