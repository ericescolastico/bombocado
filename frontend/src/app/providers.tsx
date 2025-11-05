'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider } from 'flowbite-react';
import '@/lib/fontawesome'; // Configurar Font Awesome (deve ser importado em um componente client)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        <AuthProvider>{children}</AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}

