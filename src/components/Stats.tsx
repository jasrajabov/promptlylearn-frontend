import { useEffect, useState } from "react";
import { HStack, Stat, StatLabel, Icon } from "@chakra-ui/react";
import { FaBook, FaClock, FaTasks, FaLayerGroup } from "react-icons/fa";
import type { Course } from "../types";

interface StatsProps {
    courseState: Course;
}

export const Stats = ({ courseState }: StatsProps) => {
    const [totalLessons, setTotalLessons] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState(0);
    const [completedModules, setCompletedModules] = useState(0);

    useEffect(() => {
        const lessons = courseState?.modules?.reduce(
            (sum, m) => sum + (m.lessons?.length || 0),
            0
        );
        setTotalLessons(lessons);

        const time = courseState?.modules?.reduce(
            (sum, m) => sum + (m.estimatedTime || 15),
            0
        );
        setEstimatedTime(time);

        const completed = courseState?.modules?.filter(
            (m) => m.status === "complete"
        ).length;
        setCompletedModules(completed);
    }, [courseState]);

    const statsData = [
        {
            label: "Modules",
            value: courseState.modules.length,
            icon: FaLayerGroup,
            color: "blue.500",
            bgColor: "blue.50",
            darkBg: "blue.900",
        },
        {
            label: "Lessons",
            value: totalLessons,
            icon: FaBook,
            color: "purple.500",
            bgColor: "purple.50",
            darkBg: "purple.900",
        },
        {
            label: "Time",
            value: `${estimatedTime} min`,
            icon: FaClock,
            color: "orange.500",
            bgColor: "orange.50",
            darkBg: "orange.900",
        },
        {
            label: "Completed",
            value: completedModules,
            icon: FaTasks,
            color: "green.500",
            bgColor: "green.50",
            darkBg: "green.900",
        },
    ];

    return (
        <HStack gap={3} wrap="wrap">
            {statsData.map((stat, idx) => (
                <Stat.Root
                    key={idx}
                    p={2}
                    borderRadius="sm"
                    shadow="sm"
                    bg={stat.bgColor}
                    _dark={{ bg: stat.darkBg }}
                    borderWidth="1px"
                    borderColor="gray.200"
                    _hover={{ shadow: "md", transform: "scale(1.02)", transition: "0.2s" }}
                    flex="1"
                    minW="10px"
                >
                    <HStack mb={1} gap={1}>
                        <Icon as={stat.icon} boxSize={4} color={stat.color} />
                        <StatLabel fontSize="xs" color={stat.color}>
                            {stat.label}
                        </StatLabel>
                        <Stat.ValueText fontSize="lg">{stat.value}</Stat.ValueText>
                    </HStack>

                </Stat.Root>
            ))}
        </HStack>
    );
};
