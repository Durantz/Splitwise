"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Center,
  Stack,
  Title,
  Text,
  Button,
  Paper,
  ThemeIcon,
  Alert,
  Group,
  Anchor,
} from "@mantine/core";
import { IconBrandGoogle, IconAlertCircle } from "@tabler/icons-react";
import Image from "next/image";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <Center h="100vh">
      <Stack align="center" gap="xl" w={360} px="md">
        <Stack align="center" gap="xs">
          <Image
            src="/web-app-manifest-192x192.png"
            alt="Splitwise"
            width={22}
            height={22}
          />
          <Title order={2} fw={600} ta="center">
            Split
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Gestisci le spese condivise con il tuo gruppo, senza stress.
          </Text>
        </Stack>

        {error === "not_allowed" && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            w="100%"
          >
            Il tuo account non è autorizzato ad accedere.
          </Alert>
        )}

        <Paper w="100%" p="xl" radius="md" withBorder>
          <Stack gap="md">
            <Text size="sm" c="dimmed" ta="center">
              Accedi per continuare
            </Text>
            <Button
              leftSection={<IconBrandGoogle size={16} />}
              variant="default"
              size="md"
              fullWidth
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              Continua con Google
            </Button>
          </Stack>
        </Paper>

        <Group gap="xs" justify="center">
          <Text size="xs" c="dimmed">
            Nessun dato condiviso con terze parti.
          </Text>
          <Text size="xs" c="dimmed">
            ·
          </Text>
          <Anchor
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            c="dimmed"
          >
            Privacy Policy Google
          </Anchor>
        </Group>
      </Stack>
    </Center>
  );
}
