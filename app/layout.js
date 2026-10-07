import { Inter, Arimo, Space_Grotesk, Roboto_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--f-inter' });
const arimo = Arimo({ subsets: ['latin'], weight: ['400', '700'], variable: '--f-arimo' });
const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--f-grotesk' });
const mono = Roboto_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--f-mono' });

export const metadata = {
  title: 'OBJECT 07: AER — LYST / 06 Invitation',
  description:
    'Maison AER reveals Object 07 through a one-night installation, moving image commission and limited runway edition.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${arimo.variable} ${grotesk.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
