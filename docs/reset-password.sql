-- Jalankan DESCRIBE users; lalu ganti <NAMA_KOLOM_PASSWORD> jika berbeda.
-- Isi <HASH_SEKRETARIS> dan <HASH_KEPALA_DESA> dengan hash bcrypt hasil generate.
-- node -e "console.log(require('bcryptjs').hashSync('sekretaris000', 10))"
-- node -e "console.log(require('bcryptjs').hashSync('kepaladesa000', 10))"
UPDATE users
SET password = '$2b$10$8eF1k0zvtCVV16TOZJF1wuF6v1s/Szpe4V1/25cZPPeO7E7Bz0X5z'
WHERE username = 'sekretaris';

UPDATE users
SET password = '$2b$10$qPrJ2g1b6w8L4z9UH0aEyuVwK9S6i3s1Nf8Z2LhnOeDu.E4dZg6N.'
WHERE username = 'kepala_desa';
