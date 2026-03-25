import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";

export default function ConsultaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div style={{ marginLeft: "var(--sidebar-width)" }}>
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
