# 🔐 Informasi Keamanan Password Admin

## Password Terbaru untuk Login Admin

### **Kredensial Login:**
- **Username:** `admin`
- **Password:** `adminsurat000`

### **Akses Dashboard Admin:**
1. Buka: `http://localhost:3000`
2. Klik link **"Admin"** di pojok kanan atas
3. Masukkan kredensial di atas
4. Setelah login, Anda bisa mengubah password melalui menu **"Ubah Password"**

## Fitur Keamanan Baru

### ✅ **Password Yang Kuat**
Password baru mengikuti standar keamanan:
- Minimal 8 karakter
- Mengandung huruf besar (A-Z)
- Mengandung huruf kecil (a-z)  
- Mengandung angka (0-9)
- Mengandung simbol (@$!%*?&)

### ✅ **Halaman Ubah Password**
- Akses melalui: `/admin/change-password`
- Validasi real-time kekuatan password
- Verifikasi password lama sebelum mengubah
- Konfirmasi password baru untuk mencegah kesalahan

### ✅ **Keamanan API**
- JWT token untuk autentikasi
- Hash password menggunakan bcrypt
- Validasi input untuk mencegah injection

## Saran Keamanan

### 🔒 **Password Alternatif yang Kuat:**
Jika ingin mengganti password, gunakan salah satu dari:
- `Aikmual#Village2024!`
- `SiSurat@Admin!2025`
- `Desa#Aikmual123!`

### 🔒 **Best Practices:**
1. **Ganti password secara berkala** (setiap 3-6 bulan)
2. **Jangan gunakan password yang sama** untuk akun lain
3. **Logout setelah selesai** menggunakan sistem
4. **Gunakan HTTPS** untuk production
5. **Backup database** secara berkala

## Mode Development vs Production

### **Development (Saat Ini):**
- Mock authentication jika database tidak tersedia
- Password tersimpan di kode untuk testing
- Environment variables di .env.local

### **Production (Untuk Deployment):**
- Harus menggunakan database MySQL
- Password di-hash dan disimpan di database
- Environment variables harus diamankan
- SSL/TLS wajib diaktifkan

## Troubleshooting

### **Jika Lupa Password:**
1. Cek file ini untuk password terbaru
2. Reset melalui database jika sudah setup
3. Atau gunakan mock authentication dalam mode development

### **Jika Login Gagal:**
1. Pastikan server berjalan (`npm run dev`)
2. Cek console browser untuk error
3. Periksa network tab untuk response API
4. Pastikan tidak ada typo dalam username/password

---
**⚠️ PENTING:** File ini berisi informasi sensitif. Jangan commit ke repository public atau bagikan ke orang yang tidak berwenang.