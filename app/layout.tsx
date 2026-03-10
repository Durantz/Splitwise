import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import { theme } from "@/lib/theme";
import type { Metadata, Viewport, MetadataRoute } from "next";

export const metadata: Metadata = {
  title: "Splitwise — Spese condivise",
  description: "Gestisci le spese condivise con il tuo gruppo.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Splitwise",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="it" {...mantineHtmlProps}>
      <head>
        <meta name="apple-mobile-web-app-title" content="Splitwise" />
      </head>
      <body>
        <ColorSchemeScript defaultColorScheme="auto" />
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <Notifications position="top-right" />
          <SessionProvider session={session}>{children}</SessionProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
