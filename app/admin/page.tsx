import Link from "next/link"
import { ArrowLeft, Settings, BarChart3, Users, FileText, Package } from "lucide-react"
import * as motion from "motion/react-client"

export default function AdminPage() {
  const stats = [
    { label: "Sản phẩm", icon: Package, count: "—" },
    { label: "KOL/KOC", icon: Users, count: "—" },
    { label: "Bài viết", icon: FileText, count: "—" },
    { label: "Lượt truy cập", icon: BarChart3, count: "—" },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Về trang chủ
          </Link>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800 text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-6">
              <Settings className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4">
              Admin Panel
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              Trang quản trị đang được phát triển. Các tính năng quản lý sản phẩm, KOL, bài viết và thống kê sẽ sớm được ra mắt.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 text-center"
              >
                <stat.icon className="h-6 w-6 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">{stat.count}</div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
