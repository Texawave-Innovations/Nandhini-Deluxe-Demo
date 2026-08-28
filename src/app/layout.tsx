import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Nandhini Deluxe HRMS Demo - Phase 1 ERP Architecture</title>
        <meta name="description" content="Enterprise Human Resources Management System for Nandhini Deluxe Group" />
        <link rel="icon" type="image/jpeg" href="/Logo.jpg" />
        <link rel="shortcut icon" type="image/jpeg" href="/Logo.jpg" />
        <link rel="apple-touch-icon" href="/Logo.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}

