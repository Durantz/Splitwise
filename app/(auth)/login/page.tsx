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
} from "@mantine/core";
import { IconBrandGoogle, IconAlertCircle } from "@tabler/icons-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <Center h="100vh" bg="gray.0">
      <Stack align="center" gap="xl" w={360} px="md">
        <Stack align="center" gap="xs">
          <ThemeIcon size={52} radius="xl" color="dark" variant="filled">
            <span style={{ fontSize: 24 }}>💸</span>
          </ThemeIcon>
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

        <Text size="xs" c="dimmed">
          Nessun dato condiviso con terze parti.
        </Text>
      </Stack>
    </Center>
  );
}
