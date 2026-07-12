import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ClientLayout from '@/components/layout/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'APMC Malkapur | कृषी उत्पन्न बाजार समिती, मलकापूर',
  description: 'Official portal of Agricultural Produce Market Committee, Malkapur. Get latest market rates, citizen services, initiatives, and important notices.',
  icons: {
    icon: '/icon.png',
  },
  openGraph: {
    title: 'APMC Malkapur | कृषी उत्पन्न बाजार समिती, मलकापूर',
    description: 'Official portal of Agricultural Produce Market Committee, Malkapur. Get latest market rates, citizen services, initiatives, and important notices.',
    images: ['/logo.png'],
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 flex flex-col`}>
        <LanguageProvider>
          <ClientLayout>{children}</ClientLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}
