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
    ArrowRight,
    Clock,
    BarChart3,
    Lightbulb,
    Share2,
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

    const coreFeatures = [
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
            icon: Brain,
            title: "Smart Course Generation",
            description:
                "AI analyzes your goals to create perfectly tailored learning paths with optimal progression.",
            color: "#8B5CF6", // Purple
        },
        {
            icon: Map,
            title: "Visual Learning Roadmaps",
            description:
                "See your entire learning journey at a glance with clear progression paths.",
            color: "#10B981", // Green
        },
        {
            icon: FileCheck,
            title: "Intelligent Assessments",
            description:
                "Automatically generated quizzes and knowledge checks for every module.",
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

    const comingSoonFeatures = [
        {
            icon: BarChart3,
            title: "Advanced Analytics",
            description:
                "Detailed insights into your learning patterns, progress trends, and performance metrics.",
            color: "#06B6D4", // Cyan
        },
        {
            icon: Award,
            title: "Gamified Achievements",
            description:
                "Earn badges, maintain streaks, and unlock milestones. Stay motivated throughout your journey.",
            color: "#F59E0B", // Orange
        },
        {
            icon: Share2,
            title: "Course Certificate Sharing",
            description:
                "Showcase your accomplishments with shareable certificates on LinkedIn and social media.",
            color: "#8B5CF6", // Purple
        },
    ];

    const microLearningBenefits = [
        {
            icon: Clock,
            title: "Optimized Time",
            stat: "15-25 min",
            description:
                "Science-backed lesson lengths that match attention span.",
            color: "#3B82F6", // Blue
        },
        {
            icon: Brain,
            title: "Enhanced Retention",
            stat: "2-3x Better",
            description:
                "Spaced repetition improves long-term retention vs marathon sessions.",
            color: "#8B5CF6", // Purple
        },
        {
            icon: Trophy,
            title: "Continuous Progress",
            stat: "Daily Wins",
            description:
                "Regular achievements that build momentum and confidence.",
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
            value: "~20 min",
            label: "Avg Lesson",
        },
        {
            value: "100+",
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
        <Box minH="100vh" position="relative" overflowX="hidden">
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
                py={{ base: 8, md: 16 }}
            >
                {/* Hero Section - More Compact */}
                <MotionBox
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 } as any}
                >
                    <VStack gap={2} mb={8} textAlign="center">
                        <Image
                            src={logo}
                            alt="PromptlyLearn Logo"
                            height={{ base: "140px", md: "180px" }}
                            objectFit="contain"
                            mb={1}
                        />
                        <VStack gap={3} maxW="800px">
                            <Heading
                                fontSize={{ base: "3xl", md: "5xl" }}
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
                                fontSize={{ base: "md", md: "lg" }}
                                lineHeight="1.6"
                                maxW="700px"
                                color={mutedText}
                            >
                                Transform the way you learn with AI-powered courses designed for
                                the modern learner.
                            </Text>
                        </VStack>

                        {/* Stats Bar - Compact */}
                        <SimpleGrid
                            columns={{ base: 2, md: 4 }}
                            gap={3}
                            w="full"
                            maxW="700px"
                            mt={3}
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
                                        p={3}
                                        borderRadius="lg"
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
                                            fontSize="xl"
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

                <VStack align="stretch" gap={12}>
                    {/* Core Features Section */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 } as any}
                    >
                        <VStack gap={4} mb={8}>
                            <Text
                                fontSize="xs"
                                fontWeight="700"
                                color={accentColor}
                                textTransform="uppercase"
                                letterSpacing="wide"
                            >
                                Why Choose Us
                            </Text>
                            <Heading
                                fontSize={{ base: "2xl", md: "3xl" }}
                                fontWeight="800"
                                textAlign="center"
                                maxW="700px"
                            >
                                Everything You Need to Master New Skills
                            </Heading>
                            <Text
                                fontSize="sm"
                                textAlign="center"
                                maxW="600px"
                                color={mutedText}
                                lineHeight="1.6"
                            >
                                A complete learning ecosystem designed for skill mastery and
                                knowledge retention.
                            </Text>
                        </VStack>

                        {/* Core Feature Grid */}
                        <MotionBox
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
                                {coreFeatures.map((item, index) => (
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
                                        <Card.Body p={5}>
                                            <VStack align="start" gap={2.5}>
                                                <Box p={2.5} borderRadius="lg" bg={highlightBg}>
                                                    <item.icon size={22} color={item.color} />
                                                </Box>
                                                <Heading fontSize="md" fontWeight="700">
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

                    {/* Coming Soon Features */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 } as any}
                    >
                        <VStack gap={4} mb={8}>
                            <Text
                                fontSize="xs"
                                fontWeight="700"
                                color="purple.500"
                                textTransform="uppercase"
                                letterSpacing="wide"
                            >
                                Coming Soon
                            </Text>
                            <Heading
                                fontSize={{ base: "2xl", md: "3xl" }}
                                fontWeight="800"
                                textAlign="center"
                            >
                                We're Just Getting Started
                            </Heading>
                        </VStack>
                        <MotionBox
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                                {comingSoonFeatures.map((feature, index) => (
                                    <MotionCard
                                        key={index}
                                        variants={itemVariants}
                                        whileHover={{ y: -4 }}
                                        transition={{ duration: 0.2 } as any}
                                        bg={cardBg}
                                        borderRadius="xl"
                                        borderWidth="1px"
                                        borderColor={borderColor}
                                        position="relative"
                                        overflow="hidden"
                                    >
                                        <Badge
                                            position="absolute"
                                            top={3}
                                            right={3}
                                            colorPalette="purple"
                                            fontSize="xs"
                                            px={2}
                                            py={1}
                                            borderRadius="md"
                                        >
                                            Coming Soon
                                        </Badge>
                                        <Card.Body p={5} pt={8}>
                                            <VStack align="start" gap={2.5}>
                                                <Box p={2.5} borderRadius="lg" bg={highlightBg}>
                                                    <feature.icon size={22} color={feature.color} />
                                                </Box>
                                                <Heading fontSize="md" fontWeight="700">
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
                    </MotionBox>

                    {/* Micro-Learning Benefits Section - Compact */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 } as any}
                    >
                        <VStack gap={4} mb={8}>
                            <Text
                                fontSize="xs"
                                fontWeight="700"
                                color={accentColor}
                                textTransform="uppercase"
                                letterSpacing="wide"
                            >
                                Learning Science
                            </Text>
                            <Heading
                                fontSize={{ base: "2xl", md: "3xl" }}
                                fontWeight="800"
                                textAlign="center"
                                maxW="700px"
                            >
                                The Power of Micro-Learning
                            </Heading>
                            <Text
                                fontSize="sm"
                                textAlign="center"
                                maxW="650px"
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
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
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
                                        <Card.Body p={5}>
                                            <HStack align="start" gap={3}>
                                                <Box
                                                    p={2.5}
                                                    borderRadius="lg"
                                                    bg={highlightBg}
                                                    flexShrink={0}
                                                >
                                                    <benefit.icon size={24} color={benefit.color} />
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

                    {/* CTA Section - Compact */}
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
                            <Card.Body p={{ base: 8, md: 10 }} textAlign="center">
                                <VStack gap={5}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={cardBg}
                                        display="inline-block"
                                    >
                                        <Sparkles size={32} color="#8B5CF6" />
                                    </Box>
                                    <VStack gap={2}>
                                        <Heading
                                            fontSize={{ base: "2xl", md: "3xl" }}
                                            fontWeight="800"
                                            bgGradient={gradientText}
                                            bgClip="text"
                                        >
                                            Start Learning Smarter Today
                                        </Heading>
                                        <Text fontSize="sm" maxW="500px" color={mutedText}>
                                            Join thousands mastering new skills with structured,
                                            science-backed micro-learning.
                                        </Text>
                                    </VStack>
                                    <Button
                                        size="lg"
                                        colorPalette="teal"
                                        height="52px"
                                        px={7}
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
                                            <ArrowRight size={18} />
                                        </HStack>
                                    </Button>
                                    <Text fontSize="xs" color={mutedText}>
                                        No credit card required • Get started in minutes
                                    </Text>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    </MotionBox>

                    {/* Contact Section - Compact */}
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
                            <Card.Body p={8} textAlign="center">
                                <VStack gap={4}>
                                    <Box p={3} borderRadius="xl" bg={highlightBg}>
                                        <Mail size={28} color="#14B8A6" />
                                    </Box>
                                    <Heading fontSize="xl" fontWeight="800">
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
                                        href="mailto:jasurbek@promptlylearn.app"
                                        _hover={{ textDecoration: "none" }}
                                    >
                                        <Button
                                            size="md"
                                            colorPalette="teal"
                                            variant="outline"
                                            borderWidth="1.5px"
                                            px={5}
                                            borderRadius="xl"
                                            _hover={{
                                                bg: highlightBg,
                                                transform: "translateY(-2px)",
                                            }}
                                            transition="all 0.2s"
                                        >
                                            <HStack gap={2}>
                                                <Mail size={16} />
                                                <Text>Get in Touch</Text>
                                            </HStack>
                                        </Button>
                                    </Link>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    </MotionBox>
                </VStack>

                {/* Footer - Compact */}
                <MotionBox
                    mt={12}
                    pt={5}
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