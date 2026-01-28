export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Application</h1>
        <p className="text-muted-foreground">Main application dashboard</p>
      </div>
      {children}
    </div>
  );
}
