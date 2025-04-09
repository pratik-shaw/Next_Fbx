import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '3D Model Viewer',
  description: 'NextJS application with React Three Fiber to showcase 3D models',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}