import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                {/* Meta tags for better SEO and performance */}
                <meta charSet="utf-8" />
                <meta name="theme-color" content="#1a1a2e" />
                <meta name="description" content="Meridian - Navigate teams to operational excellence with AI-powered cultural guidance" />

                {/* Favicon */}
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/favicon.ico" />

                {/* Fonts */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <body className="bg-dark-200 text-white">
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
