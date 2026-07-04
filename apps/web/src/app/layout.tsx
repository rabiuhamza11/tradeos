import './globals.css';
export const metadata = { title: 'TradeOS — AI Trading Platform', description: 'Enterprise AI-powered trading platform' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className="dark"><body className="bg-tradeos-dark text-white antialiased">{children}</body></html>);
}
