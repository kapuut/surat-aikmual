export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout khusus untuk halaman login yang tidak menggunakan auth check
  return (
    <div>
      {children}
    </div>
  );
}
