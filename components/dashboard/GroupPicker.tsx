"use client";

import { Select } from "@mantine/core";
import { useRouter, usePathname } from "next/navigation";
import type { GroupDTO } from "@/types";

interface Props {
  groups: GroupDTO[];
  activeGroupId: string;
}

export default function GroupPicker({ groups, activeGroupId }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  if (groups.length <= 1) return null;

  return (
    <Select
      size="xs"
      radius="md"
      w={160}
      value={activeGroupId}
      onChange={(val) => val && router.push(`${pathname}?group=${val}`)}
      data={groups.map((g) => ({ value: g.id, label: `${g.emoji} ${g.name}` }))}
      styles={{ input: { fontWeight: 500 } }}
    />
  );
}
