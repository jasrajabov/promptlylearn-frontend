// ForgotPasswordForm.tsx - Chakra UI v3
import { useState, type FormEvent } from 'react';
import {
    Box,
    Button,
    Input,
    Stack,
    Text,
    Heading,
    Link,
    Alert,
} from '@chakra-ui/react';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/authentication/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'An error occurred');
            }

            setMessage(data.message);
            setEmail('');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            maxW="400px"
            mx="auto"
            mt={10}
            p={8}
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="md"
            bg="white"
        >
            <Stack gap={4}>
                <Heading size="lg" textAlign="center">
                    Forgot Password
                </Heading>

                <Text fontSize="sm" color="gray.600">
                    Enter your email address and we'll send you a link to reset your password.
                </Text>

                <form onSubmit={handleSubmit}>
                    <Stack gap={4}>
                        <Box>
                            <Text fontSize="sm" fontWeight="medium" mb={1}>
                                Email Address
                            </Text>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your-email@example.com"
                                size="lg"
                                required
                                disabled={loading}
                            />
                        </Box>

                        {message && (
                            <Alert.Root status="success">
                                <Alert.Indicator />
                                <Alert.Title>{message}</Alert.Title>
                            </Alert.Root>
                        )}

                        {error && (
                            <Alert.Root status="error">
                                <Alert.Indicator />
                                <Alert.Title>{error}</Alert.Title>
                            </Alert.Root>
                        )}

                        <Button
                            type="submit"
                            colorScheme="teal"
                            size="lg"
                            width="full"
                            loading={loading}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </Stack>
                </form>

                <Box textAlign="center" mt={4}>
                    <Link href="/login" color="teal.500" fontSize="sm">
                        Back to Login
                    </Link>
                </Box>
            </Stack>
        </Box>
    );
}