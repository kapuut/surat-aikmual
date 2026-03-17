import InternalLoginPage from '@/components/auth/InternalLoginPage';

export const metadata = {
  title: 'Login Kepala Desa | SI Surat Desa',
};

export default function HeadVillageLoginPage() {
  return <InternalLoginPage variant="kepala_desa" />;
}
