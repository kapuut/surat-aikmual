# Database Setup Instructions

## Issue: "Unknown column 'nik' in 'field list'"

This error occurs because the existing database doesn't have the new columns (`nik`, `alamat`, `telepon`) that were added for the role-based authentication system.

## ✅ Recommended Solution for Your Existing Database

Since you already have data in your database, use the **SAFE MIGRATION** approach:

### Option 1: Automated Safe Migration (Recommended)

1. **Run the safe migration script:**
   ```sql
   -- Execute: database/migration-safe.sql
   ```

   This script will:
   - ✅ Keep your existing admin user and data
   - ✅ Add missing columns (`nik`, `alamat`, `telepon`)
   - ✅ Update role enum to support 4 new roles
   - ✅ Add 3 new default users (sekretaris, kepala_desa, masyarakat)
   - ✅ Verify migration success

### Option 2: Manual Step-by-Step Migration

If you prefer to run commands one by one:

1. **Execute the manual migration:**
   ```sql
   -- Execute: database/migration-manual.sql
   ```

   Or run these commands step by step in your phpMyAdmin:

   ```sql
   -- Add missing columns
   ALTER TABLE users ADD COLUMN nik VARCHAR(16) NULL;
   ALTER TABLE users ADD COLUMN alamat TEXT NULL;
   ALTER TABLE users ADD COLUMN telepon VARCHAR(15) NULL;

   -- Update role enum
   ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff', 'sekretaris', 'kepala_desa', 'masyarakat') NOT NULL;

   -- Insert new users (password: 123456 for all)
   INSERT INTO users (username, password, nama, email, role, nik, alamat, telepon) VALUES 
   ('sekretaris', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sekretaris Desa', 'sekretaris@desa.go.id', 'sekretaris', '1234567890123456', 'Kantor Desa', '081234567890'),
   ('kepala_desa', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kepala Desa', 'kepaladesa@desa.go.id', 'kepala_desa', '1234567890123457', 'Kantor Desa', '081234567891'),
   ('masyarakat', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Warga Desa', 'masyarakat@example.com', 'masyarakat', '1234567890123458', 'RT 01 RW 01 Desa Contoh', '081234567892');
   ```

### Option 3: Complete Reset (⚠️ Will Delete Existing Data)

Only use this if you don't need existing data:

1. Run the main users.sql file:
   ```sql
   -- Execute: database/users.sql
   ```

This will drop and recreate the users table with the correct structure and default users.

## 🚀 After Migration - Default Users

After running the migration, you'll have these users available:

| Username     | Password | Role         | Access Level     |
|-------------|----------|--------------|------------------|
| admin       | admin    | admin        | Full system access |
| sekretaris  | 123456   | sekretaris   | Document management |
| kepala_desa | 123456   | kepala_desa  | Approval & reports |
| masyarakat  | 123456   | masyarakat   | Submit requests   |

## 🧪 Testing the Role-Based System

1. **Start your Next.js application:**
   ```bash
   npm run dev
   ```

2. **Test each user role:**
   - Go to `http://localhost:3000/login`
   - Try logging in with each user above
   - Verify that each role shows different dashboard content
   - Check that menu items are filtered based on permissions

3. **Expected Results:**
   - **Admin**: Full access to all features
   - **Sekretaris**: Document management, user management
   - **Kepala Desa**: Approvals, reports, limited user management
   - **Masyarakat**: Submit requests, view own submissions

## 🔧 Configuration Check

Make sure your database connection in `src/lib/db.ts` matches your MySQL setup:

```typescript
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_db_user',
  password: 'your_db_password',
  database: 'db_surat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

## 🎯 What's New in Your System

After migration, your system now includes:

✅ **4 User Roles** with specific permissions
✅ **Role-based Dashboard** layouts
✅ **Professional UI** without emojis
✅ **Modern Landing Page** with service cards
✅ **Secure Authentication** with JWT tokens
✅ **Dynamic Navigation** based on user permissions
✅ **User Management** interface for admins

## 🆘 Troubleshooting

If you still get errors after migration:

1. **Check if migration was successful:**
   ```sql
   DESCRIBE users;
   ```
   You should see columns: id, username, password, nama, email, role, nik, alamat, telepon, created_at

2. **Verify new users were added:**
   ```sql
   SELECT username, role FROM users;
   ```

3. **Check role enum values:**
   ```sql
   SHOW COLUMNS FROM users LIKE 'role';
   ```

4. **Common issues:**
   - If you still get column errors, restart your Next.js application
   - If ENUM errors occur, your MySQL version might need the alternative approach
   - Make sure your database connection is properly configured