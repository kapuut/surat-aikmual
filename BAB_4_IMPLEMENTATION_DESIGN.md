# BAB 4: IMPLEMENTATION (DESIGN)

## 4.2.1 Fitur Login dan Register

### 4.2.1.1 Deskripsi Fitur

Fitur Login dan Register merupakan modul autentikasi yang memungkinkan pengguna untuk:
1. **Login**: Masuk ke sistem dengan username/email dan password
2. **Register**: Mendaftar akun baru sebagai masyarakat dengan validasi identitas

Sistem mendukung dua tipe login:
- **Internal Portal**: Untuk admin, sekretaris, dan kepala desa
- **Public Portal**: Untuk masyarakat umum

---

### 4.2.1.2 Implementation (Design)

#### **Struktur Folder dan File**

```
src/app/
├── actions/
│   └── auth.ts                          ← Business Logic Layer (Service)
│
├── api/
│   └── auth/
│       ├── login/
│       │   └── route.ts                 ← Login API Endpoint
│       └── register/
│           └── route.ts                 ← Register API Endpoint
│
├── login/
│   └── page.tsx                         ← Login UI Page
│
└── register/
    └── page.tsx                         ← Register UI Page
```

**Penjelasan Struktur:**

| Folder/File | Fungsi | Keterangan |
|---|---|---|
| `actions/auth.ts` | Business Logic | Fungsi-fungsi untuk proses autentikasi, validasi data, interaksi dengan database |
| `api/auth/login/route.ts` | Backend API Login | Endpoint POST untuk login, verifikasi password, generate JWT token |
| `api/auth/register/route.ts` | Backend API Register | Endpoint POST untuk registrasi, validasi data, penyimpanan data user ke database |
| `login/page.tsx` | Frontend Login | Tampilan UI form login, komunikasi dengan API login |
| `register/page.tsx` | Frontend Register | Tampilan UI form register, upload dokumen identitas, komunikasi dengan API register |

---

### 4.2.1.3 Deskripsi Kode

#### **A. Service Layer: `src/app/actions/auth.ts`**

**Fungsi:** Menghandle logika autentikasi tingkat tinggi

```typescript
export async function login(username: string, password: string)
```

**Proses:**
1. Query database untuk mencari user berdasarkan username atau email
2. Validasi password menggunakan bcrypt
3. Generate JWT token dengan masa berlaku 1 hari
4. Set cookie untuk session management
5. Update last_login timestamp di database
6. Return data user (id, nama, email, role)

**Keamanan:**
- Password di-hash menggunakan bcrypt
- Token hanya dikirim via HttpOnly cookie (tidak bisa diakses JavaScript)
- Session berakhir setelah 1 hari

---

#### **B. API Endpoint Login: `src/app/api/auth/login/route.ts`**

**Method:** POST

**Input:**
```json
{
  "nik": "string (untuk public/masyarakat)",
  "username": "string (untuk internal/admin)",
  "password": "string",
  "loginType": "internal | public"
}
```

**Portal Masyarakat (Public) - Input:**
```json
{
  "nik": "string (16 digit)",
  "password": "string",
  "loginType": "public"
}
```

**Proses Login:**

1. **Validasi Input**
   - Cek NIK/username dan password tidak kosong
   - Normalize login type (internal atau public)

2. **Pengecekan Database**
   - **Public (Masyarakat)**: Cari user dengan role 'masyarakat' menggunakan **NIK saja** (tidak ada email option)
   - **Internal**: Cari user dengan role admin/sekretaris/kepala_desa menggunakan username atau email

3. **Validasi Status Akun**
   - Public: status harus 'aktif' atau 'active'
   - Internal: status harus 'aktif' atau 'active'
   - Jika belum tervalidasi admin → error 403

4. **Verifikasi Password**
   - Bandingkan password input dengan hash di database
   - Jika tidak cocok → error 401

5. **Validasi Role**
   - Cek apakah role user sesuai dengan tipe login
   - Cegah masyarakat login ke internal dan sebaliknya

6. **Generate Token & Session**
   - Buat JWT token dengan payload: userId, username, email, nama, role
   - Set HTTP-only cookie
   - Update last_login di database

**Output Success (200):**
```json
{
  "message": "Login berhasil",
  "user": {
    "id": "123",
    "username": "user123",
    "email": "user@email.com",
    "nama": "Nama User",
    "role": "masyarakat"
  },
  "token": "jwt_token_here"
}
```

**Output Error:**
- 400: NIK/username atau password kosong
- 401: User tidak ditemukan atau password salah
- 403: Akun belum tervalidasi / role tidak sesuai dengan portal login

---

#### **C. API Endpoint Register: `src/app/api/auth/register/route.ts`**

**Method:** POST

**Input:**
```json
{
  "nama": "string",
  "email": "string",
  "nik": "string (16 digit)",
  "password": "string",
  "alamat": "string",
  "telepon": "string (nomor WhatsApp aktif)"
}
```

**File Upload:**
- `dokumenKTP`: File PDF identitas (KTP)
- `dokumenKK`: File PDF kartu keluarga (KK)

**Proses Register:**

1. **Validasi Semua Field Wajib**
   - Nama, email, NIK, password, alamat, telepon tidak boleh kosong

2. **Validasi Format Data**
   - **NIK**: Harus 16 digit angka
   - **Email**: Format email valid (menggunakan regex)
   - **Telepon**: Format nomor Indonesia (+62, 62, 0, atau 8 diikuti 8-13 digit)

3. **Cek Keunikan Data**
   - Cek NIK tidak terdaftar di database
   - Cek email tidak terdaftar di database

4. **Upload Dokumen Identitas**
   - Simpan file KTP ke `/public/uploads/registrasi-identitas/`
   - Simpan file KK ke `/public/uploads/registrasi-identitas/`
   - Generate nama file: `timestamp-nik-label-originalname`

5. **Hash Password**
   - Password di-hash menggunakan bcrypt sebelum disimpan

6. **Simpan Data ke Database**
   - Insert ke tabel `users` dengan data lengkap
   - Set role = 'masyarakat'
   - Set status = 'nonaktif' (menunggu validasi admin)
   - Insert ke tabel `user_identity_documents` untuk menyimpan path dokumen

7. **Setup WhatsApp Notification (Opsional)**
   - Kirim notifikasi pendaftaran ke nomor WhatsApp yang didaftarkan

**Output Success (201):**
```json
{
  "message": "Registrasi berhasil. Akun Anda sedang menunggu validasi admin",
  "userId": "generated_uuid"
}
```

**Output Error:**
- 400: Field tidak lengkap atau format tidak valid
- 409: NIK atau email sudah terdaftar
- 500: Error saat penyimpanan file atau database

---

### 4.2.1.4 Database Schema (Tabel Users)

```sql
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  nama VARCHAR(100),
  password VARCHAR(255),      -- Hash bcrypt
  nik VARCHAR(20) UNIQUE,
  alamat TEXT,
  telepon VARCHAR(15),
  role ENUM('admin', 'sekretaris', 'kepala_desa', 'masyarakat'),
  status ENUM('aktif', 'nonaktif', 'active', 'inactive'),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_identity_documents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_nik VARCHAR(16) UNIQUE,
  user_id VARCHAR(64),
  dokumen_ktp_path VARCHAR(255),
  dokumen_kk_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

### 4.2.1.5 Flow Diagram

#### **Login Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                   USER LOGIN FORM                           │
│                                                             │
│  Input: username/NIK, password, loginType                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  POST /api/auth/login        │
        │  (route.ts)                  │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Validasi Input              │
        │  - Username/NIK tidak kosong │
        │  - Password tidak kosong     │
        └──────────────┬───────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
         ▼ Valid                      ▼ Invalid
    ┌─────────────┐           ┌──────────────────┐
    │ Query User  │           │ Return Error 400 │
    │ dari DB     │           │ NIK/Pass empty   │
    └──────┬──────┘           └──────────────────┘
           │
         ┌─┴──────────────────────────────┐
         │                                │
         ▼ Found                          ▼ Not Found
    ┌─────────────────┐          ┌──────────────────┐
    │ Cek Status      │          │ Return Error 401 │
    │ Account         │          │ User not found   │
    └──────┬──────────┘          └──────────────────┘
           │
      ┌────┴────────────────────┐
      │                         │
      ▼ Aktif                   ▼ Tidak Aktif
  ┌─────────┐          ┌──────────────────┐
  │ Cek PW  │          │ Return Error 403 │
  │ Bcrypt  │          │ Account not yet  │
  └────┬────┘          │ validated        │
       │               └──────────────────┘
    ┌──┴───────────────────────────┐
    │                              │
    ▼ Valid                        ▼ Invalid
┌─────────────┐           ┌──────────────────┐
│ Cek Role    │           │ Return Error 401 │
│ Sesuai      │           │ Wrong password   │
└─────┬───────┘           └──────────────────┘
      │
   ┌──┴────────────────────────────┐
   │                               │
   ▼ Sesuai                        ▼ Tidak Sesuai
┌──────────────┐         ┌──────────────────────┐
│ Generate JWT │         │ Return Error 403     │
│ + Cookie     │         │ Role not match with  │
└──────┬───────┘         │ login portal type    │
       │                 └──────────────────────┘
       ▼
┌──────────────────────────────────┐
│ Update last_login                │
│ SET Cookie & Return Token        │
│ Return Success + User Data       │
└──────────────────────────────────┘
       │
       ▼
    ┌──────────────────────────────┐
    │  Dashboard (Redirect)        │
    │  - Admin    → Admin Panel    │
    │  - Masyarakat → User Dashboard
    └──────────────────────────────┘
```

#### **Register Flow:**

```
┌──────────────────────────────────┐
│    USER REGISTER FORM            │
│ Nama, Email, NIK, Password,      │
│ Alamat, Telepon + Dokumen        │
└──────────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │  POST /api/auth/register │
    │  (route.ts)              │
    └──────────────┬───────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Validasi Semua Field         │
    │ Wajib diisi                  │
    └──────────────┬───────────────┘
                   │
      ┌────────────┴──────────────┐
      │                           │
      ▼ Valid                     ▼ Invalid
  ┌────────────┐          ┌──────────────────┐
  │ Validasi   │          │ Return Error 400 │
  │ Format:    │          │ Field not valid  │
  │ - NIK      │          └──────────────────┘
  │ - Email    │
  │ - Telepon  │
  └────┬───────┘
       │
      ┌┴─────────────────────────────┐
      │                              │
      ▼ Valid                        ▼ Invalid
  ┌─────────────┐           ┌──────────────────┐
  │ Cek NIK &   │           │ Return Error 400 │
  │ Email       │           │ Invalid format   │
  │ Unik        │           └──────────────────┘
  └──────┬──────┘
         │
   ┌─────┴──────────────────────┐
   │                            │
   ▼ Unik                       ▼ Duplicate
┌─────────────┐         ┌──────────────────┐
│ Upload File │         │ Return Error 409 │
│ KTP & KK    │         │ NIK/Email exists │
└──────┬──────┘         └──────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Hash Password (bcrypt)       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Insert ke Database:          │
│ - users table                │
│ - user_identity_documents    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Send WhatsApp Notification   │
│ (Opsional)                   │
└──────────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ Return Success 201           │
    │ "Akun menunggu validasi"     │
    └──────────────────────────────┘
         │
         ▼
    ┌────────────────────────┐
    │ Login Page             │
    │ (Redirect user login)  │
    └────────────────────────┘
```

---

### 4.2.1.6 Security Implementation

#### **1. Password Security**
- **Hashing**: Menggunakan bcrypt dengan 10 salt rounds
- **Comparison**: Menggunakan bcrypt.compare() untuk mencegah timing attack
- Tidak pernah menyimpan password plain text

#### **2. Session Management**
- **JWT Token**: Masa berlaku 1 hari (86400 detik)
- **HTTP-Only Cookie**: Token disimpan di cookie yang tidak bisa diakses JavaScript
- **Secure Flag**: Cookie hanya dikirim via HTTPS (production)
- **SameSite**: Set ke 'strict' untuk mencegah CSRF attack

#### **3. Input Validation**
- Validasi format NIK (16 digit)
- Validasi format email (regex)
- Validasi format nomor telepon (Indonesia)
- Trim whitespace pada semua input

#### **4. Role-Based Access Control**
- Login type 'internal' hanya untuk admin/sekretaris/kepala_desa
- Login type 'public' hanya untuk masyarakat
- Account status validation (aktif vs nonaktif)

#### **5. Database Security**
- Parameterized queries (prepared statements) untuk mencegah SQL Injection
- Unique constraints untuk NIK, email, username
- Audit trail dengan timestamp (created_at, updated_at, last_login)

---

### 4.2.1.7 Dependencies & Libraries

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",           // Password hashing
    "jsonwebtoken": "^9.0.0",       // JWT token generation
    "mysql2": "^3.0.0",             // Database driver
    "next": "^14.0.0",              // Framework
    "react": "^18.0.0"              // UI Library
  }
}
```

---

### 4.2.1.8 Error Handling

| Error Code | Deskripsi | Penyebab |
|---|---|---|
| 400 | Bad Request | Field tidak lengkap, format tidak valid |
| 401 | Unauthorized | Password salah, user tidak ditemukan |
| 403 | Forbidden | Akun belum tervalidasi, role tidak sesuai |
| 409 | Conflict | NIK atau email sudah terdaftar |
| 500 | Server Error | Error database, file upload, atau sistem |

---

### 4.2.1.9 Testing Scenarios

#### **Login Tests:**

1. ✅ **Successful Login (Internal)**
   - Input: username admin, password benar, loginType: internal
   - Expected: Token generated, user data returned

2. ✅ **Successful Login (Public/Masyarakat)**
   - Input: NIK (16 digit), password benar, loginType: public
   - Expected: Token generated, user data returned

3. ❌ **Failed - Empty Credentials**
   - Input: NIK kosong, password kosong
   - Expected: Error 400 "NIK dan password wajib diisi"

4. ❌ **Failed - User Not Found**
   - Input: NIK tidak ada di database
   - Expected: Error 401 "Akun tidak terdaftar"

5. ❌ **Failed - Wrong Password**
   - Input: NIK benar, password salah
   - Expected: Error 401

6. ❌ **Failed - Invalid NIK Format**
   - Input: NIK bukan 16 digit
   - Expected: Error 400 "Format NIK tidak valid. NIK harus 16 digit angka"

7. ❌ **Failed - Account Not Validated**
   - Input: NIK terdaftar tapi status nonaktif
   - Expected: Error 403 "Akun sudah terdaftar tetapi belum tervalidasi admin"

8. ❌ **Failed - Role Mismatch**
   - Input: Masyarakat mencoba login ke internal portal
   - Expected: Error 403 "Akun ini tidak memiliki akses ke portal internal"

#### **Register Tests:**

1. ✅ **Successful Registration**
   - Input: Semua field valid, dokumen upload
   - Expected: User tersimpan, status nonaktif, redirect login

2. ❌ **Failed - Missing Fields**
   - Input: Salah satu field kosong
   - Expected: Error 400

3. ❌ **Failed - Invalid NIK**
   - Input: NIK bukan 16 digit
   - Expected: Error 400

4. ❌ **Failed - Invalid Email**
   - Input: Format email tidak valid
   - Expected: Error 400

5. ❌ **Failed - Invalid Phone**
   - Input: Format nomor telepon tidak valid
   - Expected: Error 400

6. ❌ **Failed - NIK Already Exists**
   - Input: NIK sudah terdaftar
   - Expected: Error 409

7. ❌ **Failed - Email Already Exists**
   - Input: Email sudah terdaftar
   - Expected: Error 409

---

## Kesimpulan

Fitur Login dan Register diimplementasikan dengan arsitektur yang terpisah antara:
- **Frontend**: Form UI untuk user interaction
- **Backend API**: Endpoint untuk proses bisnis
- **Service Layer**: Business logic reusable
- **Database**: Penyimpanan data user dengan keamanan

Keamanan adalah prioritas utama dengan implementasi bcrypt hashing, JWT authentication, HTTP-only cookies, dan validasi data yang ketat.
