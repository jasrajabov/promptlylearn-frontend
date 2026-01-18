import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import { Zap, Brain, Sparkles, Rocket, Lightbulb, Target, TrendingUp } from "lucide-react";

interface LogoProps {
    size?: "sm" | "md" | "lg" | "xl";
    variant?: "default" | "icon" | "text";
}

// ============================================
// DESIGN 1: Neural Network / Brain AI
// Modern, tech-forward, AI-focused
// ============================================
export function NeuralLogo({ size = "md", variant = "default" }: LogoProps) {
    const gradientBg = useColorModeValue(
        "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
        "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
    );

    const sizeMap = {
        sm: { icon: 18, text: "lg", gap: 2 },
        md: { icon: 24, text: "2xl", gap: 2.5 },
        lg: { icon: 32, text: "4xl", gap: 3 },
        xl: { icon: 40, text: "5xl", gap: 3.5 },
    };

    const cfg = sizeMap[size];

    if (variant === "icon") {
        return (
            <Box position="relative" w={cfg.icon * 2.2} h={cfg.icon * 2.2}>
                {/* Outer glow ring */}
                <Box
                    position="absolute"
                    inset={-2}
                    borderRadius="2xl"
                    bgGradient={gradientBg}
                    opacity={0.2}
                    filter="blur(8px)"
                />

                {/* Main circle */}
                <Box
                    position="absolute"
                    inset={0}
                    bgGradient={gradientBg}
                    borderRadius="2xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 8px 32px rgba(20, 184, 166, 0.4)"
                >
                    <Brain size={cfg.icon} color="white" strokeWidth={2.5} />
                </Box>

                {/* Neural nodes */}
                <Box position="absolute" top={1} right={1} w={2} h={2} bg="cyan.400" borderRadius="full" />
                <Box position="absolute" bottom={1} left={1} w={2} h={2} bg="teal.300" borderRadius="full" />
            </Box>
        );
    }

    return (
        <HStack gap={cfg.gap} align="center">
            <Box position="relative">
                <Box
                    p={2}
                    bgGradient={gradientBg}
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 4px 16px rgba(20, 184, 166, 0.3)"
                >
                    <Brain size={cfg.icon} color="white" strokeWidth={2.5} />
                </Box>
                <Box position="absolute" top={-1} right={-1} w={2.5} h={2.5} bg="cyan.400" borderRadius="full" />
            </Box>

            <Text
                fontSize={cfg.text}
                fontWeight="900"
                bgGradient={gradientBg}
                bgClip="text"
                lineHeight="1"
                letterSpacing="-0.03em"
            >
                PromptlyLearn
            </Text>
        </HStack>
    );
}

// ============================================
// DESIGN 2: Geometric Minimalist
// Clean, professional, sophisticated
// ============================================
export function GeometricLogo({ size = "md", variant = "default" }: LogoProps) {
    const gradientBg = useColorModeValue(
        "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
        "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
    );

    const sizeMap = {
        sm: { size: 24, text: "lg", gap: 2 },
        md: { size: 32, text: "2xl", gap: 2.5 },
        lg: { size: 42, text: "4xl", gap: 3 },
        xl: { size: 52, text: "5xl", gap: 3.5 },
    };

    const cfg = sizeMap[size];

    if (variant === "icon") {
        return (
            <Box position="relative" w={cfg.size} h={cfg.size}>
                {/* Hexagon shape */}
                <svg width={cfg.size} height={cfg.size} viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0D9488" />
                            <stop offset="50%" stopColor="#14B8A6" />
                            <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                    </defs>

                    {/* Outer hexagon */}
                    <path
                        d="M50 5 L90 30 L90 70 L50 95 L10 70 L10 30 Z"
                        fill="url(#hexGrad)"
                        opacity="0.15"
                    />

                    {/* Inner hexagon */}
                    <path
                        d="M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z"
                        fill="url(#hexGrad)"
                    />

                    {/* Center accent */}
                    <circle cx="50" cy="50" r="12" fill="white" opacity="0.9" />
                    <text x="50" y="58" fontSize="24" fontWeight="900" fill="#0D9488" textAnchor="middle">
                        P
                    </text>
                </svg>
            </Box>
        );
    }

    return (
        <HStack gap={cfg.gap} align="center">
            <Box position="relative" w={cfg.size * 0.8} h={cfg.size * 0.8}>
                <svg width={cfg.size * 0.8} height={cfg.size * 0.8} viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="hexGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0D9488" />
                            <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M50 10 L85 35 L85 65 L50 90 L15 65 L15 35 Z"
                        fill="url(#hexGrad2)"
                    />
                    <circle cx="50" cy="50" r="15" fill="white" opacity="0.95" />
                    <text x="50" y="60" fontSize="28" fontWeight="900" fill="#0D9488" textAnchor="middle">
                        P
                    </text>
                </svg>
            </Box>

            <VStack gap={0} align="start">
                <Text
                    fontSize={cfg.text}
                    fontWeight="900"
                    bgGradient={gradientBg}
                    bgClip="text"
                    lineHeight="0.85"
                    letterSpacing="-0.03em"
                >
                    Promptly
                </Text>
                <Text
                    fontSize={cfg.text}
                    fontWeight="900"
                    color={useColorModeValue("gray.800", "gray.200")}
                    lineHeight="0.85"
                    letterSpacing="-0.03em"
                >
                    Learn
                </Text>
            </VStack>
        </HStack>
    );
}

// ============================================
// DESIGN 3: Rocket Launch / Growth
// Dynamic, energetic, achievement-focused
// ============================================
export function RocketLogo({ size = "md", variant = "default" }: LogoProps) {
    const gradientBg = useColorModeValue(
        "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
        "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
    );

    const sizeMap = {
        sm: { icon: 18, text: "lg", gap: 2 },
        md: { icon: 24, text: "2xl", gap: 2.5 },
        lg: { icon: 32, text: "4xl", gap: 3 },
        xl: { icon: 40, text: "5xl", gap: 3.5 },
    };

    const cfg = sizeMap[size];

    if (variant === "icon") {
        return (
            <Box position="relative" w={cfg.icon * 2} h={cfg.icon * 2}>
                {/* Flame trail */}
                <Box
                    position="absolute"
                    bottom={0}
                    left="50%"
                    transform="translateX(-50%)"
                    w={cfg.icon * 1.2}
                    h={cfg.icon * 1.5}
                    bgGradient="linear(to-t, orange.400, yellow.300, transparent)"
                    borderRadius="full"
                    filter="blur(8px)"
                    opacity={0.6}
                />

                {/* Main rocket circle */}
                <Box
                    position="absolute"
                    inset={0}
                    bgGradient={gradientBg}
                    borderRadius="2xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 8px 32px rgba(20, 184, 166, 0.4)"
                >
                    <Rocket size={cfg.icon} color="white" strokeWidth={2.5} />
                </Box>

                {/* Sparkles */}
                <Box position="absolute" top={0} right={0} w={2} h={2} bg="yellow.400" borderRadius="full" />
                <Box position="absolute" top={2} right={4} w={1.5} h={1.5} bg="cyan.300" borderRadius="full" />
            </Box>
        );
    }

    return (
        <HStack gap={cfg.gap} align="center">
            <Box position="relative">
                <Box
                    p={2}
                    bgGradient={gradientBg}
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 4px 16px rgba(20, 184, 166, 0.3)"
                >
                    <Rocket size={cfg.icon} color="white" strokeWidth={2.5} />
                </Box>
                <Box position="absolute" top={-1} right={-1} w={2} h={2} bg="yellow.400" borderRadius="full" />
            </Box>

            <HStack gap={0.5} align="baseline">
                <Text
                    fontSize={cfg.text}
                    fontWeight="900"
                    bgGradient={gradientBg}
                    bgClip="text"
                    lineHeight="1"
                    letterSpacing="-0.03em"
                >
                    Promptly
                </Text>
                <Text
                    fontSize={cfg.text}
                    fontWeight="900"
                    color={useColorModeValue("gray.800", "gray.200")}
                    lineHeight="1"
                    letterSpacing="-0.03em"
                >
                    Learn
                </Text>
            </HStack>
        </HStack>
    );
}

// ============================================
// DESIGN 4: Lightbulb Moment / Innovation
// Creative, inspiring, idea-focused
// ============================================
export function LightbulbLogo({ size = "md", variant = "default" }: LogoProps) {
    const gradientBg = useColorModeValue(
        "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
        "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
    );

    const sizeMap = {
        sm: { icon: 18, text: "lg", gap: 2 },
        md: { icon: 24, text: "2xl", gap: 2.5 },
        lg: { icon: 32, text: "4xl", gap: 3 },
        xl: { icon: 40, text: "5xl", gap: 3.5 },
    };

    const cfg = sizeMap[size];

    if (variant === "icon") {
        return (
            <Box position="relative" w={cfg.icon * 2.2} h={cfg.icon * 2.2}>
                {/* Glow effect */}
                <Box
                    position="absolute"
                    inset={-2}
                    borderRadius="full"
                    bgGradient="radial(yellow.300, transparent)"
                    opacity={0.3}
                />

                {/* Main circle */}
                <Box
                    position="absolute"
                    inset={0}
                    bgGradient={gradientBg}
                    borderRadius="2xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 8px 32px rgba(20, 184, 166, 0.4)"
                >
                    <Lightbulb size={cfg.icon} color="white" fill="white" strokeWidth={2} />
                </Box>

                {/* Light rays */}
                <Box position="absolute" top={-1} left="50%" w={1} h={3} bg="yellow.400" transform="translateX(-50%)" />
                <Box position="absolute" top={1} right={0} w={3} h={1} bg="yellow.400" />
                <Box position="absolute" top={1} left={0} w={3} h={1} bg="yellow.400" />
            </Box>
        );
    }

    return (
        <HStack gap={cfg.gap} align="center">
            <Box position="relative">
                <Box
                    position="absolute"
                    inset={-1}
                    borderRadius="xl"
                    bgGradient="radial(yellow.200, transparent)"
                    opacity={0.4}
                />
                <Box
                    p={2}
                    bgGradient={gradientBg}
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 4px 16px rgba(20, 184, 166, 0.3)"
                >
                    <Lightbulb size={cfg.icon} color="white" fill="white" strokeWidth={2} />
                </Box>
            </Box>

            <Text
                fontSize={cfg.text}
                fontWeight="900"
                bgGradient={gradientBg}
                bgClip="text"
                lineHeight="1"
                letterSpacing="-0.03em"
            >
                PromptlyLearn
            </Text>
        </HStack>
    );
}

// ============================================
// DESIGN 5: Target / Precision Learning
// Professional, goal-oriented, focused
// ============================================
export function TargetLogo({ size = "md", variant = "default" }: LogoProps) {
    const gradientBg = useColorModeValue(
        "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
        "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
    );

    const sizeMap = {
        sm: { size: 24, text: "lg", gap: 2 },
        md: { size: 32, text: "2xl", gap: 2.5 },
        lg: { size: 42, text: "4xl", gap: 3 },
        xl: { size: 52, text: "5xl", gap: 3.5 },
    };

    const cfg = sizeMap[size];

    if (variant === "icon") {
        return (
            <Box position="relative" w={cfg.size} h={cfg.size}>
                <svg width={cfg.size} height={cfg.size} viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="targetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0D9488" />
                            <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                    </defs>

                    {/* Outer ring */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#targetGrad)" strokeWidth="3" opacity="0.3" />

                    {/* Middle ring */}
                    <circle cx="50" cy="50" r="32" fill="none" stroke="url(#targetGrad)" strokeWidth="4" opacity="0.6" />

                    {/* Inner circle */}
                    <circle cx="50" cy="50" r="20" fill="url(#targetGrad)" />

                    {/* Center dot */}
                    <circle cx="50" cy="50" r="8" fill="white" />

                    {/* Arrow */}
                    <path d="M70 30 L80 20 L75 25 L80 30 Z" fill="#FCD34D" />
                </svg>
            </Box>
        );
    }

    return (
        <HStack gap={cfg.gap} align="center">
            <Box position="relative" w={cfg.size * 0.7} h={cfg.size * 0.7}>
                <svg width={cfg.size * 0.7} height={cfg.size * 0.7} viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="targetGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0D9488" />
                            <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#targetGrad2)" strokeWidth="4" opacity="0.4" />
                    <circle cx="50" cy="50" r="28" fill="none" stroke="url(#targetGrad2)" strokeWidth="5" opacity="0.7" />
                    <circle cx="50" cy="50" r="16" fill="url(#targetGrad2)" />
                    <circle cx="50" cy="50" r="6" fill="white" />
                </svg>
            </Box>

            <Text
                fontSize={cfg.text}
                fontWeight="900"
                bgGradient={gradientBg}
                bgClip="text"
                lineHeight="1"
                letterSpacing="-0.03em"
            >
                PromptlyLearn
            </Text>
        </HStack>
    );
}

// ============================================
// DESIGN 6: Upward Trend / Progress
// Growth-focused, data-driven, achievement
// ============================================
export function TrendLogo({ size = "md", variant = "default" }: LogoProps) {
    const gradientBg = useColorModeValue(
        "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
        "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
    );

    const sizeMap = {
        sm: { icon: 18, text: "lg", gap: 2 },
        md: { icon: 24, text: "2xl", gap: 2.5 },
        lg: { icon: 32, text: "4xl", gap: 3 },
        xl: { icon: 40, text: "5xl", gap: 3.5 },
    };

    const cfg = sizeMap[size];

    if (variant === "icon") {
        return (
            <Box position="relative" w={cfg.icon * 2} h={cfg.icon * 2}>
                <Box
                    position="absolute"
                    inset={0}
                    bgGradient={gradientBg}
                    borderRadius="2xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 8px 32px rgba(20, 184, 166, 0.4)"
                >
                    <TrendingUp size={cfg.icon} color="white" strokeWidth={2.5} />
                </Box>
                <Box position="absolute" top={-1} right={-1} w={2.5} h={2.5} bg="green.400" borderRadius="full" />
            </Box>
        );
    }

    return (
        <HStack gap={cfg.gap} align="center">
            <Box position="relative">
                <Box
                    p={2}
                    bgGradient={gradientBg}
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 4px 16px rgba(20, 184, 166, 0.3)"
                >
                    <TrendingUp size={cfg.icon} color="white" strokeWidth={2.5} />
                </Box>
                <Box position="absolute" top={-1} right={-1} w={2} h={2} bg="green.400" borderRadius="full" />
            </Box>

            <Text
                fontSize={cfg.text}
                fontWeight="900"
                bgGradient={gradientBg}
                bgClip="text"
                lineHeight="1"
                letterSpacing="-0.03em"
            >
                PromptlyLearn
            </Text>
        </HStack>
    );
}