import {
  HStack,
  VStack,
  Stat,
} from "@chakra-ui/react";
import React from "react";
import { ProgressCircleComponent } from "./ProgressCircle";


interface StatItem {
  label: string;
  progress: number;
}
interface StatsProps {
  stats: StatItem[];
  size?: "sm" | "md" | "lg" | "xl";
}

export const Stats = ({
  stats,
  size = "xl",
}: StatsProps): React.ReactElement | null => {
  if (!stats) return null;

  return (
    <HStack gap={3} wrap="wrap">
      {stats.map((stat, idx) => (
        <VStack key={idx} p={3}>
          <Stat.Root>
            <Stat.Label>{stat.label}</Stat.Label>
            {/* <Stat.Value>{stat.value}</Stat.Value> */}
          </Stat.Root>
          {stat.progress !== undefined && (
            <ProgressCircleComponent size={size} value={stat.progress} />
          )}
        </VStack>
      ))}
    </HStack>
  );
};
