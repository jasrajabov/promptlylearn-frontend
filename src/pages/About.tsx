import React from "react";
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Image,
    Button,
    Container,
    SimpleGrid,
    Card,
    Link,
    Badge,
} from "@chakra-ui/react";
import {
    Mail,
    Sparkles,
    TrendingUp,
    Award,
    Brain,
    Database,
    LayoutDashboard,
    Trophy,
    FileCheck,
    Map,
    Boxes,
    ArrowRight,
    Clock,
    BarChart3,
    Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useColorModeValue } from "../components/ui/color-mode";
import promptlyLeanrnLogoDark from "../assets/promptlylearn_logo_dark.svg";
import promptlyLeanrnLogoLight from "../assets/promptlylearn_logo_light.svg";

const MotionBox = motion(Box);
const MotionCard = motion(Card.Root);

const AboutPage: React.FC = () => {
    const logo = useColorModeValue(
        promptlyLeanrnLogoLight,
        promptlyLeanrnLogoDark,
    );
    const accentColor = useColorModeValue("teal.600", "teal.400");
    const cardBg = useColorModeValue("white", "gray.950");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.1)");
    const gradientText = useColorModeValue(
        "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
        "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
    );
    const mutedText = useColorModeValue("gray.600", "gray.400");
    const navigate = useNavigate();

    const whyUs = [
        {
            icon: Database,
            title: "Persistent Learning Library",
            description:
                "Your courses are saved permanently. Build a personal knowledge base that grows with you.",
            color: "#3B82F6", // Blue
        },
        {
            icon: LayoutDashboard,
            title: "Purpose-Built Interface",
            description:
                "Clean, distraction-free design optimized for learning with intuitive navigation.",
            color: "#14B8A6", // Teal
        },
        {
            icon: FileCheck,
            title: "Intelligent Assessments",
            description:
                "Automatically generated quizzes and knowledge checks for every module.",
            color: "#F59E0B", // Orange
        },
        {
            icon: Map,
            title: "Visual Learning Roadmaps",
            description:
                "See your entire learning journey at a glance with clear progression paths.",
            color: "#10B981", // Green
        },
        {
            icon: Boxes,
            title: "Structured Curriculum",
            description:
                "Professionally organized modules with clear objectives and outcomes.",
            color: "#8B5CF6", // Purple
        },
        {
            icon: BarChart3,
            title: "Advanced Analytics",
            description:
                "Detailed insights into your learning patterns and progress trends.",
            color: "#06B6D4", // Cyan
        },
    ];

    const microLearningBenefits = [
        {
            icon: Clock,
            title: "Optimized Time",
            stat: "15-25 min",
            description:
                "Science-backed lesson lengths that match attention span. Learn deeply without fatigue.",
            color: "#3B82F6", // Blue
        },
        {
            icon: Brain,
            title: "Enhanced Retention",
            stat: "2-3x Better",
            description:
                "Spaced repetition dramatically improves long-term retention vs marathon sessions.",
            color: "#8B5CF6", // Purple
        },
        {
            icon: Trophy,
            title: "Continuous Progress",
            stat: "Daily Wins",
            description:
                "Experience regular achievements that build momentum and confidence.",
            color: "#F59E0B", // Orange
        },
        {
            icon: TrendingUp,
            title: "Faster Learning",
            stat: "3x Speed",
            description:
                "Focus on essentials in digestible chunks. Apply knowledge immediately.",
            color: "#10B981", // Green
        },
    ];

    const additionalFeatures = [
        {
            icon: Brain,
            title: "Smart Course Generation",
            description:
                "AI analyzes your goals to create perfectly tailored learning paths with optimal progression.",
            color: "#8B5CF6", // Purple
        },
        {
            icon: Award,
            title: "Gamified Achievements",
            description:
                "Earn badges, maintain streaks, and unlock milestones. Stay motivated throughout your journey.",
            color: "#F59E0B", // Orange
        },
        {
            icon: Lightbulb,
            title: "24/7 AI Companion",
            description:
                "Get instant explanations and guidance. Your personal tutor is always ready to help.",
            color: "#06B6D4", // Cyan
        },
    ];

    const stats = [
        {
            value: "85%",
            label: "Completion Rate",
        },
        {
            value: "3x",
            label: "Faster Learning",
        },
        {
            value: "25 min",
            label: "Avg Lesson",
        },
        {
            value: "10k+",
            label: "Lessons Done",
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
        },
    };

    return (
        <Box minH="100vh" position="relative">
            {/* Subtle background glow */}
            <Box
                position="absolute"
                top="0"
                left="50%"
                transform="translateX(-50%)"
                width="800px"
                height="400px"
                bgGradient="radial(teal.400, transparent)"
                opacity={0.05}
                filter="blur(100px)"
                pointerEvents="none"
            />

            <Container
                maxW="1200px"
                px={{ base: 4, md: 8 }}
                py={{ base: 12, md: 20 }}
            >
                {/* Hero Section */}
                <MotionBox
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 } as any}
                >
                    <VStack gap={3} mb={10} textAlign="center">
                        <Image
                            src={logo}
                            alt="PromptlyLearn Logo"
                            height="200px"          // smaller, more premium
                            objectFit="contain"
                            mb={2}
                        />
                        <VStack gap={4} maxW="800px">
                            <Heading
                                fontSize={{ base: "4xl", md: "6xl" }}
                                fontWeight="900"
                                bgGradient={gradientText}
                                bgClip="text"
                                lineHeight="1.1"
                                letterSpacing="-0.04em"
                            >
                                Master Any Skill
                                <br />
                                Through Micro-Learning
                            </Heading>
                            <Text
                                fontSize={{ base: "lg", md: "xl" }}
                                lineHeight="1.6"
                                maxW="700px"
                                color={mutedText}
                            >
                                Transform the way you learn with AI-powered courses designed for
                                the modern learner.
                            </Text>
                        </VStack>

                        {/* Stats Bar */}
                        <SimpleGrid
                            columns={{ base: 2, md: 4 }}
                            gap={4}
                            w="full"
                            maxW="800px"
                            mt={4}
                        >
                            {stats.map((stat, index) => (
                                <MotionBox
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 } as any}
                                >
                                    <VStack
                                        gap={1}
                                        p={4}
                                        borderRadius="xl"
                                        bg={cardBg}
                                        borderWidth="1px"
                                        borderColor={borderColor}
                                        transition="all 0.2s"
                                        _hover={{
                                            borderColor: accentColor,
                                            transform: "translateY(-2px)",
                                        }}
                                    >
                                        <Text
                                            fontSize="2xl"
                                            fontWeight="800"
                                            bgGradient={gradientText}
                                            bgClip="text"
                                        >
                                            {stat.value}
                                        </Text>
                                        <Text fontSize="xs" fontWeight="600" color={mutedText}>
                                            {stat.label}
                                        </Text>
                                    </VStack>
                                </MotionBox>
                            ))}
                        </SimpleGrid>
                    </VStack>
                </MotionBox>

                <VStack align="stretch" gap={20}>
                    {/* Why PromptlyLearn Section */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 } as any}
                    >
                        <VStack gap={6} mb={12}>
                            <Text
                                fontSize="sm"
                                fontWeight="700"
                                color={accentColor}
                                textTransform="uppercase"
                                letterSpacing="wide"
                            >
                                Why Choose Us
                            </Text>
                            <Heading
                                fontSize={{ base: "3xl", md: "4xl" }}
                                fontWeight="800"
                                textAlign="center"
                                maxW="700px"
                            >
                                More Than Just Another AI Tool
                            </Heading>
                            <Text
                                fontSize="md"
                                textAlign="center"
                                maxW="600px"
                                color={mutedText}
                                lineHeight="1.6"
                            >
                                A complete learning ecosystem designed for skill mastery and
                                knowledge retention.
                            </Text>
                        </VStack>

                        {/* Feature Grid */}
                        <MotionBox
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                                {whyUs.map((item, index) => (
                                    <MotionCard
                                        key={index}
                                        variants={itemVariants}
                                        whileHover={{ y: -4 }}
                                        transition={{ duration: 0.2 } as any}
                                        bg={cardBg}
                                        borderRadius="xl"
                                        borderWidth="1px"
                                        borderColor={borderColor}
                                        overflow="hidden"
                                    >
                                        <Card.Body p={6}>
                                            <VStack align="start" gap={3}>
                                                <Box p={3} borderRadius="lg" bg={highlightBg}>
                                                    <item.icon size={24} color={item.color} />
                                                </Box>
                                                <Heading fontSize="lg" fontWeight="700">
                                                    {item.title}
                                                </Heading>
                                                <Text fontSize="sm" lineHeight="1.6" color={mutedText}>
                                                    {item.description}
                                                </Text>
                                            </VStack>
                                        </Card.Body>
                                    </MotionCard>
                                ))}
                            </SimpleGrid>
                        </MotionBox>
                    </MotionBox>

                    {/* Micro-Learning Benefits Section */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 } as any}
                    >
                        <VStack gap={6} mb={12}>
                            <Text
                                fontSize="sm"
                                fontWeight="700"
                                color={accentColor}
                                textTransform="uppercase"
                                letterSpacing="wide"
                            >
                                Learning Science
                            </Text>
                            <Heading
                                fontSize={{ base: "3xl", md: "4xl" }}
                                fontWeight="800"
                                textAlign="center"
                                maxW="700px"
                            >
                                The Power of Micro-Learning
                            </Heading>
                            <Text
                                fontSize="md"
                                textAlign="center"
                                maxW="700px"
                                color={mutedText}
                                lineHeight="1.6"
                            >
                                Our approach achieves 85% completion by working with your
                                brain's natural learning patterns.
                            </Text>
                        </VStack>

                        <MotionBox
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                {microLearningBenefits.map((benefit, index) => (
                                    <MotionCard
                                        key={index}
                                        variants={itemVariants}
                                        whileHover={{ y: -4 }}
                                        transition={{ duration: 0.2 } as any}
                                        bg={cardBg}
                                        borderRadius="xl"
                                        borderWidth="1px"
                                        borderColor={borderColor}
                                    >
                                        <Card.Body p={6}>
                                            <HStack align="start" gap={4}>
                                                <Box
                                                    p={3}
                                                    borderRadius="lg"
                                                    bg={highlightBg}
                                                    flexShrink={0}
                                                >
                                                    <benefit.icon size={28} color={benefit.color} />
                                                </Box>
                                                <VStack align="start" gap={2} flex={1}>
                                                    <HStack justify="space-between" w="full">
                                                        <Heading fontSize="md" fontWeight="700">
                                                            {benefit.title}
                                                        </Heading>
                                                        <Badge
                                                            colorPalette="teal"
                                                            px={2}
                                                            py={1}
                                                            borderRadius="md"
                                                            fontSize="xs"
                                                            fontWeight="700"
                                                        >
                                                            {benefit.stat}
                                                        </Badge>
                                                    </HStack>
                                                    <Text
                                                        fontSize="sm"
                                                        lineHeight="1.6"
                                                        color={mutedText}
                                                    >
                                                        {benefit.description}
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                        </Card.Body>
                                    </MotionCard>
                                ))}
                            </SimpleGrid>
                        </MotionBox>
                    </MotionBox>

                    {/* Additional Features */}
                    <Box>
                        <VStack gap={4} mb={10}>
                            <Heading
                                fontSize={{ base: "3xl", md: "4xl" }}
                                fontWeight="800"
                                textAlign="center"
                            >
                                Everything You Need
                            </Heading>
                            <Text
                                fontSize="md"
                                textAlign="center"
                                maxW="600px"
                                color={mutedText}
                            >
                                A complete ecosystem to help you achieve your goals faster
                            </Text>
                        </VStack>
                        <MotionBox
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                                {additionalFeatures.map((feature, index) => (
                                    <MotionCard
                                        key={index}
                                        variants={itemVariants}
                                        whileHover={{ y: -4 }}
                                        transition={{ duration: 0.2 } as any}
                                        bg={cardBg}
                                        borderRadius="xl"
                                        borderWidth="1px"
                                        borderColor={borderColor}
                                    >
                                        <Card.Body p={6}>
                                            <VStack align="start" gap={3}>
                                                <Box p={3} borderRadius="lg" bg={highlightBg}>
                                                    <feature.icon size={28} color={feature.color} />
                                                </Box>
                                                <Heading fontSize="lg" fontWeight="700">
                                                    {feature.title}
                                                </Heading>
                                                <Text fontSize="sm" lineHeight="1.6" color={mutedText}>
                                                    {feature.description}
                                                </Text>
                                            </VStack>
                                        </Card.Body>
                                    </MotionCard>
                                ))}
                            </SimpleGrid>
                        </MotionBox>
                    </Box>

                    {/* CTA Section */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 } as any}
                    >
                        <Card.Root
                            borderRadius="2xl"
                            bg={highlightBg}
                            borderWidth="1.5px"
                            borderColor={accentColor}
                        >
                            <Card.Body p={{ base: 10, md: 12 }} textAlign="center">
                                <VStack gap={6}>
                                    <Box
                                        p={4}
                                        borderRadius="xl"
                                        bg={cardBg}
                                        display="inline-block"
                                    >
                                        <Sparkles size={40} color="#8B5CF6" />
                                    </Box>
                                    <VStack gap={3}>
                                        <Heading
                                            fontSize={{ base: "2xl", md: "3xl" }}
                                            fontWeight="800"
                                            bgGradient={gradientText}
                                            bgClip="text"
                                        >
                                            Start Learning Smarter Today
                                        </Heading>
                                        <Text fontSize="md" maxW="500px" color={mutedText}>
                                            Join thousands mastering new skills with structured,
                                            science-backed micro-learning.
                                        </Text>
                                    </VStack>
                                    <Button
                                        size="lg"
                                        colorPalette="teal"
                                        height="56px"
                                        px={8}
                                        fontSize="md"
                                        fontWeight="600"
                                        borderRadius="xl"
                                        onClick={() => {
                                            navigate("/");
                                        }}
                                        bgGradient="linear(to-r, teal.500, cyan.500)"
                                        _hover={{
                                            bgGradient: "linear(to-r, teal.600, cyan.600)",
                                            transform: "translateY(-2px)",
                                            boxShadow: "0 8px 24px rgba(20, 184, 166, 0.25)",
                                        }}
                                        transition="all 0.3s"
                                    >
                                        <HStack gap={2}>
                                            <Text>Create Your First Course</Text>
                                            <ArrowRight size={20} />
                                        </HStack>
                                    </Button>
                                    <Text fontSize="xs" color={mutedText}>
                                        No credit card required • Get started in minutes
                                    </Text>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    </MotionBox>

                    {/* Contact Section */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 } as any}
                    >
                        <Card.Root
                            bg={cardBg}
                            borderRadius="xl"
                            borderWidth="1px"
                            borderColor={borderColor}
                        >
                            <Card.Body p={10} textAlign="center">
                                <VStack gap={5}>
                                    <Box p={4} borderRadius="xl" bg={highlightBg}>
                                        <Mail size={36} color="#14B8A6" />
                                    </Box>
                                    <Heading fontSize="2xl" fontWeight="800">
                                        We'd Love to Hear From You
                                    </Heading>
                                    <Text
                                        fontSize="sm"
                                        maxW="500px"
                                        color={mutedText}
                                        lineHeight="1.6"
                                    >
                                        Have questions or feedback? We're constantly improving and
                                        your input helps shape PromptlyLearn.
                                    </Text>
                                    <Link
                                        href="mailto:hello@promptlylearn.com"
                                        _hover={{ textDecoration: "none" }}
                                    >
                                        <Button
                                            size="md"
                                            colorPalette="teal"
                                            variant="outline"
                                            borderWidth="1.5px"
                                            px={6}
                                            borderRadius="xl"
                                            _hover={{
                                                bg: highlightBg,
                                                transform: "translateY(-2px)",
                                            }}
                                            transition="all 0.2s"
                                        >
                                            <HStack gap={2}>
                                                <Mail size={18} />
                                                <Text>Get in Touch</Text>
                                            </HStack>
                                        </Button>
                                    </Link>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    </MotionBox>
                </VStack>

                {/* Footer */}
                <MotionBox
                    mt={16}
                    pt={6}
                    borderTop="1px"
                    borderColor={borderColor}
                    textAlign="center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 } as any}
                >
                    <Text fontSize="xs" color={mutedText}>
                        © {new Date().getFullYear()} PromptlyLearn • Transforming education
                        through intelligent micro-learning
                    </Text>
                </MotionBox>
            </Container>
        </Box>
    );
};

export default AboutPage;
