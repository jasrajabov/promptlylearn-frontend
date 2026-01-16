import {
  HStack,
  VStack,
  Collapsible,
  Text,
  Icon,
  Progress,
  Heading,
  Button,
  Stat,
} from "@chakra-ui/react";
import { FaBook, FaLayerGroup } from "react-icons/fa";
import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Course } from "../types";
import { ProgressCircleComponent } from "./ProgressCircle";

import { useColorModeValue } from "../components/ui/color-mode";

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
