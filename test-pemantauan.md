# Testing Fitur Pemantauan User

## Langkah Testing:

### 1. Pastikan Server Berjalan
```bash
npm run dev
```
Server akan berjalan di `http://localhost:3001` (atau port lain jika 3000 sudah terpakai)

### 2. Login sebagai Admin
- Buka browser: `http://localhost:3001/admin/login`
- Username: `admin`
- Password: `adminsurat000`
- Klik Login

### 3. Akses Halaman Pemantauan User
- Setelah login berhasil, klik menu **"Pemantauan User"** di sidebar (bagian Pengaturan)
- Atau akses langsung: `http://localhost:3001/admin/pemantauan-user`

### 4. Yang Akan Terlihat:
✅ **Card Statistik (3 cards)**:
   - Total User Aktif: Jumlah semua user dengan status 'aktif'
   - User Online: User yang login dalam 30 menit terakhir (dengan dot hijau beranimasi)
   - User Offline: User yang tidak login atau login > 30 menit yang lalu

✅ **Filter**:
   - Filter by Role: All, Administrator, Sekretaris, Kepala Desa, Masyarakat
   - Filter by Status: All, Online, Offline

✅ **Tabel User** dengan kolom:
   - Status (Online/Offline dengan indicator visual)
   - Username
   - Nama
   - Email
   - Role (dengan badge warna)
   - Login Terakhir (format: 14 Okt 2025, 10:30)
   - Waktu (relatif: "5 menit yang lalu")

✅ **Auto-refresh**: Data otomatis refresh setiap 30 detik

### 5. Testing Skenario:

#### Skenario 1: User Online
1. Login sebagai admin di tab/browser pertama
2. Buka tab baru, login sebagai `sekretaris` (password: `sekretaris000`)
3. Kembali ke tab admin, buka halaman Pemantauan User
4. Kedua user (admin dan sekretaris) harus muncul dengan status **Online** (dot hijau)

#### Skenario 2: User Offline
1. Tunggu 30 menit tanpa aktivitas
2. Refresh halaman Pemantauan User
3. User tersebut akan berubah status menjadi **Offline** (dot abu-abu)

#### Skenario 3: Filter
1. Pilih filter "Administrator" → Hanya user dengan role admin yang tampil
2. Pilih filter "Online" → Hanya user yang aktif dalam 30 menit terakhir

### 6. Troubleshooting

#### Error "Unauthorized" / "Forbidden"
- Pastikan sudah login sebagai admin
- Cek cookie `auth-token` di Developer Tools → Application → Cookies

#### Data tidak muncul / Empty table
- Cek console browser (F12) untuk error
- Cek terminal server untuk log:
  - "=== Active Users API Called ==="
  - "Token found: true"
  - "Decoded user role: admin"
  - "Users fetched: X"

#### "Failed to fetch users data"
- Pastikan database MySQL running
- Cek koneksi database di `.env`:
  ```
  MYSQL_HOST=localhost
  MYSQL_USER=root
  MYSQL_PASSWORD=your_password
  MYSQL_DATABASE=db_surat
  ```
- Pastikan tabel `users` memiliki kolom `last_login`

### 7. Database Check
Untuk memastikan kolom `last_login` ada dan ter-update:

```sql
-- Check struktur tabel
DESCRIBE users;

-- Check data users dan last_login
SELECT id, username, nama, role, last_login, status 
FROM users;

-- Update manual last_login untuk testing
UPDATE users 
SET last_login = NOW() 
WHERE username = 'admin';
```

### 8. Expected Results

✅ User yang baru login < 30 menit: **Status ONLINE** (dot hijau berkedip)
✅ User yang login > 30 menit / tidak pernah login: **Status OFFLINE** (dot abu-abu)
✅ Total User Aktif: Semua user dengan status 'aktif'
✅ Auto-refresh: Data ter-update otomatis setiap 30 detik
✅ Real-time indicator: Dot hijau pada user online
✅ Filter berfungsi: Filter role dan status bekerja
✅ Time display: Menampilkan waktu relatif seperti "5 menit yang lalu"

## API Endpoint Details

**URL**: `/api/admin/active-users`
**Method**: GET
**Auth**: Required (Admin only)
**Cookie**: `auth-token`

**Response Format**:
```json
{
  "success": true,
  "users": [
    {
      "id": "admin-001",
      "username": "admin",
      "nama": "Administrator Sistem",
      "email": "admin@desa.go.id",
      "role": "admin",
      "status": "aktif",
      "lastLogin": "2025-10-14T10:30:00.000Z",
      "createdAt": "2025-10-01T08:00:00.000Z",
      "updatedAt": "2025-10-14T10:30:00.000Z",
      "isOnline": true
    }
  ],
  "totalActive": 1,
  "totalUsers": 4
}
```

## Notes

- User dianggap **Online** jika `last_login` dalam **30 menit** terakhir
- Kolom `last_login` di-update setiap kali user berhasil login
- Auto-refresh menggunakan `setInterval` setiap 30 detik
- Halaman ini **HANYA** bisa diakses oleh role **admin**
