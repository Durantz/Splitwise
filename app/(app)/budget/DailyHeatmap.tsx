"use client";

import { useMemo, useState } from "react";
import { Box, Paper, Text, Group, Stack, Tooltip } from "@mantine/core";
import { DailyStat } from "./server";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function formatEur(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Math.abs(value));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Ritorna un'intensità 0–4 per le uscite (amount < 0).
 * 0 = nessuna spesa / entrata
 * 1–4 = quartili della distribuzione delle uscite
 */
function computeIntensities(
  days: DailyStat[]
): Map<string, { intensity: number; total: number }> {
  const outflows = days.filter((d) => d.total < 0);
  const absValues = outflows
    .map((d) => Math.abs(d.total))
    .sort((a, b) => a - b);

  const q1 = absValues[Math.floor(absValues.length * 0.25)] ?? 0;
  const q2 = absValues[Math.floor(absValues.length * 0.5)] ?? 0;
  const q3 = absValues[Math.floor(absValues.length * 0.75)] ?? 0;

  const result = new Map<string, { intensity: number; total: number }>();
  for (const d of days) {
    let intensity = 0;
    if (d.total < 0) {
      const abs = Math.abs(d.total);
      if (abs <= q1) intensity = 1;
      else if (abs <= q2) intensity = 2;
      else if (abs <= q3) intensity = 3;
      else intensity = 4;
    }
    result.set(d.date, { intensity, total: d.total });
  }
  return result;
}

/**
 * Genera tutti i giorni tra from e to (inclusi) come YYYY-MM-DD.
 */
function generateDays(from: string, to: string): string[] {
  const days: string[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// ------------------------------------------------------------------
// Colori per intensità (rosso, 5 livelli)
// ------------------------------------------------------------------
const INTENSITY_COLORS = [
  "var(--mantine-color-dark-5)", // 0 – nessuna spesa
  "var(--mantine-color-red-9)", // 1 – bassa
  "var(--mantine-color-red-7)", // 2 – media-bassa
  "var(--mantine-color-red-5)", // 3 – media-alta
  "var(--mantine-color-red-3)", // 4 – alta
];

const INTENSITY_COLORS_LIGHT = [
  "var(--mantine-color-gray-2)", // 0
  "var(--mantine-color-red-1)", // 1
  "var(--mantine-color-red-3)", // 2
  "var(--mantine-color-red-5)", // 3
  "var(--mantine-color-red-7)", // 4
];

const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// ------------------------------------------------------------------
// Componente principale
// ------------------------------------------------------------------
export function DailyHeatmap({
  dailyTotals,
  periodFrom,
  periodTo,
}: {
  dailyTotals: DailyStat[];
  periodFrom: string; // ISO string
  periodTo: string; // ISO string
}) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const { weeks, intensityMap, totaleUscite, giornoMax } = useMemo(() => {
    const fromDate = periodFrom.slice(0, 10);
    const toDate = periodTo.slice(0, 10);
    const allDays = generateDays(fromDate, toDate);
    const intensityMap = computeIntensities(dailyTotals);

    // Raggruppa per settimane (Lun–Dom)
    // Troviamo il lunedì precedente al primo giorno
    const firstDay = new Date(fromDate);
    const firstDayOfWeek = firstDay.getDay(); // 0=dom, 1=lun, …
    const offsetToMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const weeks: (string | null)[][] = [];
    let currentWeek: (string | null)[] = Array(offsetToMonday).fill(null);

    for (const day of allDays) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    // Statistiche
    const totaleUscite = dailyTotals
      .filter((d) => d.total < 0)
      .reduce((acc, d) => acc + d.total, 0);

    const giornoMax =
      dailyTotals
        .filter((d) => d.total < 0)
        .sort((a, b) => a.total - b.total)[0] ?? null;

    return { weeks, intensityMap, totaleUscite, giornoMax };
  }, [dailyTotals, periodFrom, periodTo]);

  const CELL = 18;
  const GAP = 3;

  return (
    <Stack gap="md">
      {/* Legenda spesa totale + giorno più costoso */}
      <Group gap="xl">
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            Totale uscite
          </Text>
          <Text size="sm" fw={700} c="red">
            {formatEur(totaleUscite)}
          </Text>
        </Stack>
        {giornoMax && (
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              Giorno più costoso
            </Text>
            <Text size="sm" fw={600}>
              {formatDate(giornoMax.date)} — {formatEur(giornoMax.total)}
            </Text>
          </Stack>
        )}
      </Group>

      {/* Griglia */}
      <Box style={{ overflowX: "auto" }}>
        <Box style={{ display: "inline-flex", gap: GAP }}>
          {/* Etichette giorni della settimana */}
          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              gap: GAP,
              paddingTop: 0,
            }}
          >
            {GIORNI.map((g) => (
              <Box
                key={g}
                style={{
                  height: CELL,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Text size="xs" c="dimmed" w={28} ta="right" pr={4}>
                  {g}
                </Text>
              </Box>
            ))}
          </Box>

          {/* Settimane */}
          {weeks.map((week, wi) => (
            <Box
              key={wi}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: GAP,
              }}
            >
              {week.map((day, di) => {
                if (!day) {
                  return (
                    <Box
                      key={di}
                      style={{ width: CELL, height: CELL, borderRadius: 3 }}
                    />
                  );
                }

                const data = intensityMap.get(day);
                const intensity = data?.intensity ?? 0;
                const total = data?.total ?? 0;
                const isHovered = hoveredDay === day;

                return (
                  <Tooltip
                    key={day}
                    label={
                      <Stack gap={2}>
                        <Text size="xs" fw={600}>
                          {formatDate(day)}
                        </Text>
                        {total !== 0 ? (
                          <Text size="xs" c={total < 0 ? "red.3" : "green.3"}>
                            {total < 0 ? "−" : "+"}
                            {formatEur(total)}
                          </Text>
                        ) : (
                          <Text size="xs" c="dimmed">
                            Nessun movimento
                          </Text>
                        )}
                      </Stack>
                    }
                    withArrow
                    position="top"
                    transitionProps={{ duration: 80 }}
                  >
                    <Box
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        backgroundColor: INTENSITY_COLORS[intensity],
                        cursor: "default",
                        transform: isHovered ? "scale(1.25)" : "scale(1)",
                        transition:
                          "transform 120ms ease, background-color 120ms ease",
                        outline: isHovered
                          ? "2px solid var(--mantine-color-red-4)"
                          : "none",
                        outlineOffset: 1,
                      }}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Legenda colori */}
      <Group gap="xs" align="center">
        <Text size="xs" c="dimmed">
          Meno
        </Text>
        {INTENSITY_COLORS.map((color, i) => (
          <Box
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
        ))}
        <Text size="xs" c="dimmed">
          Di più
        </Text>
      </Group>
    </Stack>
  );
}
