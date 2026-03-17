# 🔐 Update Database dengan Kredensial Admin Baru

## Kredensial Admin Terbaru
- **Username:** `admin`
- **Password:** `adminsurat000`

## Cara Mengupdate Database

### **Metode 1: Menggunakan MySQL Command Line**
```bash
# 1. Masuk ke MySQL
mysql -u root -p

# 2. Jalankan script update
source d:/Semester\ 7/TA/AIKMUAL/si-surat/database/update-admin-credentials.sql

# 3. Atau copy-paste SQL berikut:
USE db_surat;

UPDATE users 
SET 
    username = 'admin',
    password = '$2b$10$z8V9b2R4qmBbYaX3IYJ.2eerp0NLEByFFEcTKpPilrlPQE8ebqtR2',
    nama = 'Administrator',
    email = 'admin@aikmual.com',
    updated_at = NOW()
WHERE id = 1 OR username = 'admin';
```

### **Metode 2: Menggunakan phpMyAdmin**
1. Buka phpMyAdmin di browser: `http://localhost/phpmyadmin`
2. Pilih database `db_surat`
3. Klik tab "SQL"
4. Copy dan paste script dari file `update-admin-credentials.sql`
5. Klik "Go" untuk menjalankan

### **Metode 3: Menggunakan MySQL Workbench**
1. Buka MySQL Workbench
2. Connect ke database lokal
3. Buka file `update-admin-credentials.sql`
4. Execute script

## Verifikasi Update

Setelah menjalankan update, verifikasi dengan query:
```sql
SELECT id, username, nama, email, role, status, created_at, updated_at 
FROM users 
WHERE username = 'admin';
```

Hasil yang diharapkan:
```
id | username | nama          | email              | role  | status
1  | admin    | Administrator | admin@aikmual.com  | admin | aktif
```

## Testing Login

1. **Buka aplikasi:** `http://localhost:3000`
2. **Klik:** Link "Admin"
3. **Login dengan:**
   - Username: `admin`
   - Password: `adminsurat000`

## File yang Sudah Diupdate

✅ `database/update-admin-credentials.sql` - Script update database  
✅ `database/schema.sql` - Schema dengan kredensial baru  
✅ `src/app/api/auth/login/route.ts` - API login  
✅ `src/app/api/auth/change-password/route.ts` - API ubah password  
✅ `.env.local` - Environment variables  

## Keamanan

⚠️ **PENTING:**
- Password `adminsurat000` sudah di-hash dengan bcrypt
- Hash: `$2b$10$z8V9b2R4qmBbYaX3IYJ.2eerp0NLEByFFEcTKpPilrlPQE8ebqtR2`
- Jangan simpan password plain text di database
- Gunakan hash yang sudah disediakan

## Troubleshooting

### **Jika database belum ada:**
1. Jalankan `database/schema.sql` terlebih dahulu
2. Lalu jalankan `database/update-admin-credentials.sql`

### **Jika login gagal:**
1. Pastikan database sudah diupdate
2. Restart aplikasi: `npm run dev`
3. Cek console browser untuk error
4. Pastikan MySQL service berjalan