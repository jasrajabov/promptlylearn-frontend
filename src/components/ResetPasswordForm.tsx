// ResetPasswordPage.tsx - New page for password reset
import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Input,
    VStack,
    Text,
    HStack,
    Heading,
    Spinner,
    Card,
    Icon,
    IconButton,
    Image,
} from '@chakra-ui/react';
import { useColorModeValue } from '../components/ui/color-mode';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    AlertCircle,
    Lock,
    Eye,
    EyeOff,
} from 'lucide-react';
import promptlyLearnLogoDark from '../assets/promptlylearn_logo_dark.svg';
import promptlyLearnLogoLight from '../assets/promptlylearn_logo_light.svg';

const MotionCard = motion(Card.Root);
const MotionBox = motion(Box);

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    // Color mode values
    const cardBg = useColorModeValue('white', 'gray.950');
    const inputBg = useColorModeValue('white', 'gray.900');
    const borderColor = useColorModeValue('gray.300', 'gray.600');
    const focusBorderColor = useColorModeValue('teal.500', 'teal.400');
    const mutedText = useColorModeValue('gray.600', 'gray.400');
    const iconColor = useColorModeValue('gray.400', 'gray.500');
    const cardBorderColor = useColorModeValue('gray.200', 'gray.800');
    const errorAlertBg = useColorModeValue('red.50', 'rgba(239, 68, 68, 0.1)');
    const errorAlertBorder = useColorModeValue('red.200', 'red.800');
    const errorAlertIconColor = useColorModeValue('red.500', 'red.400');
    const errorAlertTextColor = useColorModeValue('red.800', 'red.300');
    const successAlertBg = useColorModeValue('green.50', 'rgba(16, 185, 129, 0.1)');
    const successAlertBorder = useColorModeValue('green.200', 'green.800');
    const successAlertIconColor = useColorModeValue('green.500', 'green.400');
    const successAlertTextColor = useColorModeValue('green.800', 'green.300');
    const linkColor = useColorModeValue('teal.600', 'teal.400');
    const strengthBarBg = useColorModeValue('gray.200', 'gray.800');

    const logo = useColorModeValue(promptlyLearnLogoLight, promptlyLearnLogoDark);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validToken, setValidToken] = useState<boolean | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('No reset token provided');
                setValidToken(false);
                return;
            }

            try {
                const response = await fetch(
                    `${BACKEND_URL}/authentication/verify-reset-token?token=${encodeURIComponent(token)}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    }
                );

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || 'Invalid or expired reset token');
                }

                setValidToken(true);
            } catch (err) {
                setValidToken(false);
                setError(err instanceof Error ? err.message : 'Invalid or expired reset token');
            }
        };

        verifyToken();
    }, [token]);

    const getPasswordStrength = (pwd: string) => {
        if (pwd.length === 0) return { strength: 0, label: '', color: 'gray.300' };
        if (pwd.length < 8) return { strength: 25, label: 'Weak', color: 'red.500' };

        let strength = 25;
        if (/[a-z]/.test(pwd)) strength += 15;
        if (/[A-Z]/.test(pwd)) strength += 15;
        if (/\d/.test(pwd)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(pwd)) strength += 15;
        if (pwd.length >= 12) strength += 15;

        if (strength < 50) return { strength, label: 'Weak', color: 'red.500' };
        if (strength < 75) return { strength, label: 'Good', color: 'yellow.500' };
        return { strength, label: 'Strong', color: 'green.500' };
    };

    const passwordStrength = getPasswordStrength(newPassword);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validation
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/authentication/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    new_password: newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'An error occurred');
            }

            setMessage(data.message);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Invalid token state
    if (validToken === false) {
        return (
            <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" py={8} px={4}>
                <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 } as any}
                    maxW="480px"
                    w="full"
                    shadow="2xl"
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor={cardBorderColor}
                    overflow="hidden"
                    bg={cardBg}
                >
                    <Card.Body p={8}>
                        <VStack gap={6} textAlign="center">
                            <Image src={logo} alt="PromptlyLearn Logo" height="80px" objectFit="contain" />
                            <Icon color={errorAlertIconColor} boxSize={12}>
                                <AlertCircle size={48} />
                            </Icon>
                            <Heading size="lg" color={errorAlertTextColor}>
                                Invalid Reset Link
                            </Heading>
                            <Text color={mutedText}>{error}</Text>
                            <Button
                                as="a"
                                onClick={() => navigate("/login")}
                                colorScheme="teal"
                                size="lg"
                                w="full"
                                bgGradient="linear(to-r, teal.500, cyan.500)"
                                _hover={{ bgGradient: 'linear(to-r, teal.600, cyan.600)' }}
                            >
                                Back to Login
                            </Button>
                        </VStack>
                    </Card.Body>
                </MotionCard>
            </Box>
        );
    }

    // Loading state
    if (validToken === null) {
        return (
            <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
                <VStack gap={4}>
                    <Spinner size="xl" color="teal.500" />
                    <Text color={mutedText}>Verifying reset token...</Text>
                </VStack>
            </Box>
        );
    }

    // Valid token - show reset form
    return (
        <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" py={8} px={4}>
            <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 } as any}
                maxW="480px"
                w="full"
                shadow="2xl"
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={cardBorderColor}
                overflow="hidden"
                bg={cardBg}
            >
                <Card.Body p={8}>
                    <VStack gap={6}>
                        <Image src={logo} alt="PromptlyLearn Logo" height="80px" objectFit="contain" />
                        <VStack gap={1}>
                            <Heading size="xl" textAlign="center" fontWeight="900">
                                Reset Your Password
                            </Heading>
                            <Text fontSize="sm" color={mutedText} textAlign="center">
                                Enter your new password below
                            </Text>
                        </VStack>

                        {/* Success Message */}
                        {message && (
                            <MotionBox
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                w="full"
                            >
                                <HStack
                                    p={3}
                                    bg={successAlertBg}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={successAlertBorder}
                                    gap={2}
                                >
                                    <Icon color={successAlertIconColor} flexShrink={0}>
                                        <CheckCircle size={18} />
                                    </Icon>
                                    <Text fontSize="sm" color={successAlertTextColor} fontWeight="medium">
                                        {message}
                                    </Text>
                                </HStack>
                            </MotionBox>
                        )}

                        {/* Error Message */}
                        {error && (
                            <MotionBox
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                w="full"
                            >
                                <HStack
                                    p={3}
                                    bg={errorAlertBg}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={errorAlertBorder}
                                    gap={2}
                                >
                                    <Icon color={errorAlertIconColor} flexShrink={0}>
                                        <AlertCircle size={18} />
                                    </Icon>
                                    <Text fontSize="sm" color={errorAlertTextColor} fontWeight="medium">
                                        {error}
                                    </Text>
                                </HStack>
                            </MotionBox>
                        )}

                        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                            <VStack gap={4} w="full">
                                {/* New Password */}
                                <VStack align="stretch" gap={1.5} w="full">
                                    <HStack>
                                        <Text fontSize="sm" fontWeight="semibold">
                                            New Password
                                        </Text>
                                        <Text fontSize="sm" color="red.500">
                                            *
                                        </Text>
                                    </HStack>
                                    <VStack gap={2} align="stretch">
                                        <HStack
                                            borderWidth="1px"
                                            borderRadius="lg"
                                            borderColor={borderColor}
                                            _focusWithin={{
                                                borderColor: focusBorderColor,
                                                shadow: `0 0 0 1px ${focusBorderColor}`,
                                                bg: inputBg,
                                            }}
                                            bg={inputBg}
                                            h="48px"
                                            px={3}
                                            transition="all 0.2s"
                                        >
                                            <Icon color={iconColor} flexShrink={0}>
                                                <Lock size={18} />
                                            </Icon>
                                            <Input
                                                placeholder="At least 8 characters"
                                                type={showPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                disabled={loading}
                                                required
                                                minLength={8}
                                                border="none"
                                                outline="none"
                                                h="full"
                                                px={2}
                                                bg="transparent"
                                                _focus={{ border: 'none', boxShadow: 'none', bg: 'transparent', outline: 'none' }}
                                                _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                                            />
                                            <IconButton
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                onClick={() => setShowPassword(!showPassword)}
                                                variant="ghost"
                                                size="sm"
                                                minW="auto"
                                                h="auto"
                                                p={1}
                                            >
                                                <Icon color={iconColor}>
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </Icon>
                                            </IconButton>
                                        </HStack>

                                        {/* Password Strength */}
                                        {newPassword && (
                                            <Box>
                                                <HStack justify="space-between" mb={1}>
                                                    <Text fontSize="xs" color={mutedText}>
                                                        Password strength:
                                                    </Text>
                                                    <Text fontSize="xs" fontWeight="bold" color={passwordStrength.color}>
                                                        {passwordStrength.label}
                                                    </Text>
                                                </HStack>
                                                <Box h="2" bg={strengthBarBg} borderRadius="full" overflow="hidden">
                                                    <Box
                                                        h="full"
                                                        bg={passwordStrength.color}
                                                        w={`${passwordStrength.strength}%`}
                                                        transition="all 0.3s"
                                                    />
                                                </Box>
                                            </Box>
                                        )}
                                    </VStack>
                                </VStack>

                                {/* Confirm Password */}
                                <VStack align="stretch" gap={1.5} w="full">
                                    <HStack>
                                        <Text fontSize="sm" fontWeight="semibold">
                                            Confirm Password
                                        </Text>
                                        <Text fontSize="sm" color="red.500">
                                            *
                                        </Text>
                                    </HStack>
                                    <HStack
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        borderColor={borderColor}
                                        _focusWithin={{
                                            borderColor: focusBorderColor,
                                            shadow: `0 0 0 1px ${focusBorderColor}`,
                                            bg: inputBg,
                                        }}
                                        bg={inputBg}
                                        h="48px"
                                        px={3}
                                        transition="all 0.2s"
                                    >
                                        <Icon color={iconColor} flexShrink={0}>
                                            <Lock size={18} />
                                        </Icon>
                                        <Input
                                            placeholder="Confirm your password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={loading}
                                            required
                                            minLength={8}
                                            border="none"
                                            outline="none"
                                            h="full"
                                            px={2}
                                            bg="transparent"
                                            _focus={{ border: 'none', boxShadow: 'none', bg: 'transparent', outline: 'none' }}
                                            _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                                        />
                                        <IconButton
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            variant="ghost"
                                            size="sm"
                                            minW="auto"
                                            h="auto"
                                            p={1}
                                        >
                                            <Icon color={iconColor}>
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </Icon>
                                        </IconButton>
                                    </HStack>
                                </VStack>

                                <Button
                                    type="submit"
                                    colorScheme="teal"
                                    w="full"
                                    disabled={loading || !newPassword || !confirmPassword}
                                    size="lg"
                                    h="48px"
                                    borderRadius="lg"
                                    fontWeight="bold"
                                    bgGradient="linear(to-r, teal.500, cyan.500)"
                                    _hover={{ bgGradient: 'linear(to-r, teal.600, cyan.600)' }}
                                    _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                                    mt={2}
                                >
                                    {loading ? <Spinner size="sm" /> : 'Reset Password'}
                                </Button>

                                <Button
                                    as="a"
                                    onClick={() => navigate("/login")}
                                    variant="ghost"
                                    w="full"
                                    size="md"
                                    color={linkColor}
                                >
                                    Back to Login
                                </Button>
                            </VStack>
                        </form>
                    </VStack>
                </Card.Body>
            </MotionCard>
        </Box>
    );
}