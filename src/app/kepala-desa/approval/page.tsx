import { redirect } from "next/navigation";

export default function KepalaDesaApprovalPage() {
  // Route compatibility: menu/alur kini disatukan di Permohonan Warga.
  redirect("/kepala-desa/permohonan");
}
