import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
    label: string
    href?: string
    icon?: string
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center space-x-2 text-sm text-gray-300 mb-6">
            <Link href="/dashboard" className="flex items-center space-x-1 hover:text-white transition-colors">
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                    {item.href ? (
                        <Link href={item.href} className="hover:text-white transition-colors">
                            {item.icon && <span className="mr-1">{item.icon}</span>}
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-400">
                            {item.icon && <span className="mr-1">{item.icon}</span>}
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    )
}
