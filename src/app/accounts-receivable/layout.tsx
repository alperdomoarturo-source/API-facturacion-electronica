use client
'use client'

import Sidebar from '@/components/layout/Sidebar'

export default function AccountsReceivableLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  )
}
