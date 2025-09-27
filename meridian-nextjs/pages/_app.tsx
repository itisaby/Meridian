import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '../contexts/AuthContext'

export default function App({
    Component,
    pageProps: { session, ...pageProps }
}: AppProps) {
    return (
        <SessionProvider session={session}>
            <AuthProvider>
                <Component {...pageProps} />
            </AuthProvider>
        </SessionProvider>
    )
}
