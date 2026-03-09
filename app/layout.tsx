import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import type { Metadata } from "next";

const theme = createTheme({
  primaryColor: "dark",
  defaultRadius: "md",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  components: {
    Card: { defaultProps: { withBorder: true, shadow: "xs", radius: "md" } },
    Paper: { defaultProps: { withBorder: true, shadow: "xs", radius: "md" } },
  },
});

export const metadata: Metadata = {
  title: "Split — Spese condivise",
  description: "Gestisci le spese condivise con il tuo gruppo.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="it">
      <body>
        <ColorSchemeScript />
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications position="top-right" />
          <SessionProvider session={session}>{children}</SessionProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
