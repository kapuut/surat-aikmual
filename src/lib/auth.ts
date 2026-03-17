import { jwtVerify } from 'jose';
import { AuthUser, UserRole, defaultPermissions, RolePermissions } from './types';

export async function verifyAuth(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return payload;
  } catch (error) {
    throw new Error('Token tidak valid');
  }
}

export async function getUser(token: string): Promise<AuthUser | null> {
  try {
    const payload = await verifyAuth(token);
    return {
      id: payload.userId as string,
      username: payload.username as string,
      email: payload.email as string,
      nama: payload.nama as string,
      role: payload.role as UserRole,
      nik: payload.nik as string,
      alamat: payload.alamat as string,
      telepon: payload.telepon as string,
    };
  } catch (error) {
    return null;
  }
}

export function getUserPermissions(role: UserRole): RolePermissions {
  return defaultPermissions[role];
}

export function hasPermission(
  userRole: UserRole, 
  resource: keyof RolePermissions, 
  action: keyof (RolePermissions[keyof RolePermissions])
): boolean {
  const permissions = getUserPermissions(userRole);
  const resourcePermission = permissions[resource];
  return resourcePermission[action] === true;
}

export function getAccessibleRoutes(role: UserRole): string[] {
  const permissions = getUserPermissions(role);
  const routes: string[] = [];

  // Dashboard selalu accessible
  switch (role) {
    case 'admin':
      routes.push('/admin/dashboard');
      break;
    case 'sekretaris':
      routes.push('/sekretaris/dashboard');
      break;
    case 'kepala_desa':
      routes.push('/kepala-desa/dashboard');
      break;
    case 'masyarakat':
      routes.push('/dashboard');
      break;
  }

  // Tambahkan route berdasarkan permission
  if (permissions.suratMasuk.read) routes.push('/admin/surat-masuk');
  if (permissions.suratKeluar.read) routes.push('/admin/surat-keluar');
  if (permissions.permohonan.read) routes.push('/admin/permohonan', '/permohonan');
  if (permissions.templateSurat.read) routes.push('/admin/template-surat');
  if (permissions.laporan.read) routes.push('/admin/laporan');
  if (permissions.approval.read) routes.push('/admin/approval');
  if (permissions.userManagement.read) routes.push('/admin/users');

  return routes;
}

export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'sekretaris':
      return '/sekretaris/dashboard';
    case 'kepala_desa':
      return '/kepala-desa/dashboard';
    case 'masyarakat':
      return '/dashboard';
    default:
      return '/login';
  }
}
