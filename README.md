This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## WhatsApp Notification Setup

Sistem mendukung notifikasi WhatsApp otomatis ketika status permohonan berubah menjadi surat jadi (`ditandatangani` atau `selesai`).

Tambahkan environment variables berikut:

```env
WHATSAPP_API_URL=https://your-whatsapp-api/send
WHATSAPP_API_TOKEN=your_bearer_token_optional
WHATSAPP_API_KEY=your_api_key_optional
WHATSAPP_API_KEY_HEADER=x-api-key
WHATSAPP_SENDER=SI-Surat Desa Aikmual
```

Payload JSON yang dikirim ke `WHATSAPP_API_URL`:

```json
{
	"to": "6281234567890",
	"message": "Halo ..., Surat Anda sudah jadi ...",
	"sender": "SI-Surat Desa Aikmual",
	"metadata": {
		"permohonanId": 123,
		"status": "selesai",
		"nomorSurat": "001/Ds.Aml/04/2026"
	}
}
```

Catatan:
- Nomor otomatis dinormalisasi ke format Indonesia (`62...`).
- Pengiriman bersifat best-effort (jika API WhatsApp gagal, update status surat tetap berhasil).
