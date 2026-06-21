import './globals.css'
import { Inter } from 'next/font/google'
import Script from 'next/script' // ✨ 이거 추가

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '오행식탁',
  description: '오행식탁 웹 애플리케이션',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* ✨ 카카오맵 스크립트 추가 (autoload=false가 핵심입니다!) */}
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services,clusterer&autoload=false`}
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}