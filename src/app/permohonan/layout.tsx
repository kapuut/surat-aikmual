import AutoNikForMasyarakat from "@/components/permohonan/AutoNikForMasyarakat";

export default function PermohonanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AutoNikForMasyarakat />
      {children}
    </>
  );
}
