"use client";

import { Select } from "@mantine/core";
import { useRouter, usePathname } from "next/navigation";
import type { GroupDTO } from "@/types";

interface Props {
  groups: GroupDTO[];
  activeGroupId: string;
}

export default function GroupSelector({ groups, activeGroupId }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  if (groups.length <= 1) return null;

  return (
    <Select
      size="xs"
      value={activeGroupId}
      data={groups.map((g) => ({ value: g.id, label: `${g.emoji} ${g.name}` }))}
      onChange={(val) => {
        if (val) router.push(`${pathname}?groupId=${val}`);
      }}
      w={180}
      styles={{ input: { fontWeight: 500 } }}
    />
  );
}
