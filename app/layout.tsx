import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Ugadaika — Pick the podium',description:'Predict the pickleball podium with friends.'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
