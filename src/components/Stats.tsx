import { HStack, VStack, Collapsible, Text, Icon, Progress } from "@chakra-ui/react";
import { FaBook, FaClock, FaTasks, FaLayerGroup } from "react-icons/fa";
import { motion } from "framer-motion";
import type { Course } from "../types";

import { useColorModeValue } from "../components/ui/color-mode"
import { BiCollapse } from "react-icons/bi";

interface StatsProps {
    courseState: Course;
}

const MotionText = motion(Text);

export const Stats = ({ courseState }: StatsProps) => {
    if (!courseState) return null;

    const totalLessons = courseState.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
    const estimatedTime = courseState.modules.reduce((sum, m) => sum + (m.estimatedTime || 15), 0);
    const completedModules = courseState.modules.filter((m) => m.status === "COMPLETED").length;
    const totalModules = courseState.modules.length;
    const completedPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

    const statsData = [
        { label: "Modules", value: totalModules, icon: FaLayerGroup },
        { label: "Lessons", value: totalLessons, icon: FaBook },
        { label: "Time", value: `${estimatedTime} min`, icon: FaClock },
        { label: "Completed", value: completedModules, icon: FaTasks, isProgress: true, progress: completedPercentage },
    ];

    const cardBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");

    return (
        <Collapsible.Root defaultOpen>
            <Collapsible.Trigger>
                <Text fontSize="xl" color="teal.500" fontWeight="bold" mb={4} cursor="pointer">
                    {courseState.title}
                </Text>
            </Collapsible.Trigger>
            <Collapsible.Content>
                <HStack gap={3} wrap="wrap">
                    {statsData.map((stat, idx) => (
                        <VStack
                            key={idx}
                            p={3}
                            borderRadius="md"
                            bg={cardBg}
                            border="1px solid"
                            borderColor={borderColor}
                            shadow="sm"
                            minW="120px"
                            align="start"
                            gap={1}
                            _hover={{ shadow: "md", transform: "scale(1.03)", transition: "0.2s" }}
                        >
                            <HStack gap={2}>
                                <Icon
                                    as={stat.icon}
                                    boxSize={4}
                                    color={stat.label === "Completed" ? "green.500" : "teal.500"}
                                />
                                <Text fontSize="xs" fontWeight="semibold" color={stat.label === "Completed" ? "green.500" : "gray.500"}>
                                    {stat.label}
                                </Text>
                            </HStack>

                            <MotionText
                                key={stat.value}
                                fontSize="lg"
                                fontWeight="bold"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                {stat.value}
                            </MotionText>

                            {stat.isProgress && (
                                <Progress.Root value={stat.progress} size="xs" width="100%" borderRadius="sm">
                                    <Progress.Range><Progress.Track bg="green.500" /></Progress.Range>

                                </Progress.Root>
                            )}
                        </VStack>
                    ))}
                </HStack>
            </Collapsible.Content>

        </Collapsible.Root>
    );
};
