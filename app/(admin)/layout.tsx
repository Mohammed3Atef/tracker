export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground">Admin dashboard and settings</p>
      </div>
      {children}
    </div>
  );
}
