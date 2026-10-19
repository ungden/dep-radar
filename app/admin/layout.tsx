/** The desk has its own frame (app/admin/admin-desk.tsx) and colours (.admin-theme in globals.css). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-theme min-h-dvh">{children}</div>
}
