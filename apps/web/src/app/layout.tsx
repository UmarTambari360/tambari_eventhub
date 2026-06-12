import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../providers/auth-provider';
import { ThemeProvider } from '../providers/theme-provider';

export const metadata: Metadata = {
  title: {
    default: "EventHub — Nigeria's Event Ticketing Platform",
    template: '%s | EventHub',
  },
  description:
    'Discover and book tickets for the best events in Nigeria. Music, Tech, Arts, Culture, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('eventhub-theme');
                  var resolved = saved === 'dark' ? 'dark'
                    : saved === 'light' ? 'light'
                    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  if (resolved === 'dark') document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
