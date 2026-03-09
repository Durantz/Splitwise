import { Paper, Stack, Text, Group, Box } from "@mantine/core";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  color?: "green" | "red" | "default";
  large?: boolean;
  accent?: boolean;
}

export default function KpiCard({ label, value, sub, icon, color, large, accent }: KpiCardProps) {
  const valueColor =
    color === "green"
      ? "var(--mantine-color-green-7)"
      : color === "red"
      ? "var(--mantine-color-red-6)"
      : accent
      ? "white"
      : "var(--mantine-color-dark-9)";

  return (
    <Paper
      p={large ? "xl" : "md"}
      radius="lg"
      withBorder={!accent}
      shadow="none"
      style={
        accent
          ? { background: "var(--mantine-color-dark-8)", border: "none" }
          : { background: "white" }
      }
    >
      <Stack gap={large ? "sm" : "xs"}>
        <Group justify="space-between" align="center">
          <Text
            size="xs"
            tt="uppercase"
            fw={500}
            style={{ letterSpacing: "0.05em" }}
            c={accent ? "dark.3" : "dimmed"}
          >
            {label}
          </Text>
          {icon && <Box style={{ fontSize: large ? 20 : 16, lineHeight: 1 }}>{icon}</Box>}
        </Group>

        <Text
          fw={600}
          style={{
            fontSize: large ? "var(--mantine-font-size-xl)" : "var(--mantine-font-size-lg)",
            letterSpacing: "-0.02em",
            color: valueColor,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </Text>

        {sub && (
          <Text size="xs" c={accent ? "dark.3" : "dimmed"}>
            {sub}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
