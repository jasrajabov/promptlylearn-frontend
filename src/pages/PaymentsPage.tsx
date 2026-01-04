import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, VStack, HStack, Heading, Text, Button, Card, Badge, Spinner, Alert, Separator, Dialog } from '@chakra-ui/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser } from '../contexts/UserContext';
import { useColorMode } from "../components/ui/color-mode";
import CancellationConfirmation from '../components/CancellationForm';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const VITE_STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

const stripePromise = loadStripe(VITE_STRIPE_PUBLIC_KEY);

// Product data
const products = [
    {
        id: 'free',
        name: 'Free Plan',
        price: '$0',
        priceValue: 0,
        features: ['Basic features', 'Limited course access', 'Community support'],
        badge: null
    },
    {
        id: 'premium',
        name: 'Premium Plan',
        price: '$10',
        priceValue: 1000,
        features: ['Unlimited courses', 'All roadmaps', 'Priority support', '30-day money back guarantee'],
        badge: 'Popular',
        isPremium: true
    }
];

// Step 1: Products Selection
function ProductsStep({ onSelectPlan }: { onSelectPlan: (plan: typeof products[0]) => void }) {
    const [loading, setLoading] = useState(false);
    const [cancellationResponse, setCancellationResponse] = useState<any | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const { user } = useUser();
    const showCancelButton = user?.membership_plan === "premium" && user?.membership_status === "ACTIVE";

    const getButtonLabel = (plan: typeof products[0]) => {
        const activeUntil = Number(user?.membership_active_until ?? 0);
        if ((user?.membership_plan === "premium" && user?.membership_status === "ACTIVE") || activeUntil > Date.now()) {
            return 'Current Plan';
        }
        return plan.isPremium ? 'Choose Plan' : 'Free Plan';
    }

    const handleCancelSubscription = async () => {
        if (!user) return alert("You must be logged in");
        setShowCancelDialog(false); // Close dialog
        try {
            setLoading(true);
            const res = await fetch(`${BACKEND_URL}/payment/cancel-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (!res.ok) throw new Error('Failed to cancel subscription');
            const data = await res.json();
            console.log('Cancellation response:', data);
            setCancellationResponse(data);
        } catch (err) {
            console.error(err);
            alert('Failed to cancel subscription');
        } finally {
            setLoading(false);
        }
    }

    // Show loading spinner
    if (loading) {
        return (
            <VStack minH="400px" justify="center" align="center" gap={4}>
                <Spinner size="xl" color="teal.500" />
                <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                    Processing your request...
                </Text>
            </VStack>
        );
    }

    // Show cancellation confirmation
    if (cancellationResponse) {
        return (
            <VStack gap={6} align="stretch">
                <CancellationConfirmation cancellationResponse={cancellationResponse} />
                <Box textAlign="center">
                    <Button
                        variant="outline"
                        colorScheme="teal"
                        onClick={() => setCancellationResponse(null)}
                    >
                        Back to Plans
                    </Button>
                </Box>
            </VStack>
        );
    }

    // Show products
    return (
        <VStack gap={8} align="stretch">
            <Box textAlign="center">
                <Heading size="2xl" mb={2} bgGradient="to-r" gradientFrom="teal.400" gradientTo="teal.600" bgClip="text">
                    Upgrade to Premium
                </Heading>
                <Text fontSize="lg">
                    Unlock all courses and roadmaps
                </Text>
            </Box>

            <HStack gap={6} align="stretch" flexDir={{ base: 'column', md: 'row' }}>
                {products.map((product) => (
                    <Card.Root
                        key={product.id}
                        flex={1}
                        borderWidth={product.isPremium ? '2px' : '1px'}
                        borderColor={product.isPremium ? 'teal.500' : 'teal.200'}
                        position="relative"
                        bg={product.isPremium ? 'rgba(0, 128, 128, 0.02)' : 'transparent'}
                        _hover={{
                            transform: product.isPremium ? 'translateY(-4px)' : 'none',
                            shadow: product.isPremium ? 'xl' : 'none',
                            borderColor: product.isPremium ? 'teal.600' : 'teal.200',
                        }}
                        transition="all 0.3s ease"
                    >
                        {product.badge && (
                            <Badge
                                position="absolute"
                                top={-3}
                                right={4}
                                colorScheme="teal"
                                fontSize="sm"
                                px={4}
                                py={1}
                                borderRadius="full"
                            >
                                {product.badge}
                            </Badge>
                        )}

                        <Card.Body p={6}>
                            <VStack align="stretch" gap={2}>
                                <Box>
                                    <Text fontSize="md" fontWeight="semibold" mb={2}>
                                        {product.name}
                                    </Text>
                                    <HStack align="baseline">
                                        <Heading size="3xl">
                                            {product.price}
                                        </Heading>
                                        <Text color="teal.600" fontSize="md">/month</Text>
                                    </HStack>
                                </Box>

                                <Separator />

                                <VStack align="stretch" gap={1}>
                                    {product.features.map((feature, idx) => (
                                        <HStack key={idx} align="start">
                                            <Box color="teal.500" fontSize="lg" mt={0.5}>✓</Box>
                                            <Text fontSize="sm">{feature}</Text>
                                        </HStack>
                                    ))}
                                </VStack>

                                <HStack>
                                    <Button
                                        colorScheme={product.isPremium ? 'teal' : 'teal'}
                                        variant={product.isPremium ? 'solid' : 'outline'}
                                        size="md"
                                        onClick={() => onSelectPlan(product)}
                                        disabled={!product.isPremium}
                                        _hover={{
                                            transform: product.isPremium ? 'scale(1.02)' : 'none',
                                        }}
                                        transition="all 0.2s"
                                    >
                                        {getButtonLabel(product)}
                                    </Button>
                                    {showCancelButton && (
                                        <Button
                                            colorScheme="red"
                                            variant="ghost"
                                            size="md"
                                            onClick={() => setShowCancelDialog(true)}
                                            _hover={{
                                                bg: 'red.50',
                                                _dark: { bg: 'red.900/20' }
                                            }}
                                            transition="all 0.2s"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </HStack>
                            </VStack>
                        </Card.Body>
                    </Card.Root>
                ))}
            </HStack>

            <Box textAlign="center" pt={2}>
                <Text fontSize="sm">
                    🔒 Secure payment powered by Stripe
                </Text>
            </Box>

            {/* Cancel Confirmation Dialog */}
            <Dialog.Root open={showCancelDialog} onOpenChange={(e) => setShowCancelDialog(e.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Cancel Subscription?</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack align="stretch" gap={4}>
                                <Text>
                                    Are you sure you want to cancel your premium subscription?
                                </Text>
                                <Box
                                    bg="teal.50"
                                    _dark={{ bg: 'teal.900/20' }}
                                    p={4}
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor="teal.200"

                                >
                                    <Text fontSize="sm" color="teal.900" _dark={{ color: 'teal.100' }}>
                                        <Text as="span" fontWeight="semibold">Note:</Text> You'll retain access to premium features until the end of your current billing period.
                                    </Text>
                                </Box>
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline" colorScheme="gray">
                                    Keep Subscription
                                </Button>
                            </Dialog.ActionTrigger>
                            <Button
                                colorScheme="red"
                                onClick={handleCancelSubscription}
                            >
                                Yes, Cancel
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger />
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </VStack>
    );
}

// Step 2: Payment Form
function CheckoutForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async () => {
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const { error: submitError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/upgrade?success=true',
            },
            redirect: 'if_required',
        });

        if (submitError) {
            setError(submitError.message ?? 'An unexpected error occurred.');
            setProcessing(false);
        } else {
            onSuccess();
        }
    };

    return (
        <VStack gap={6} align="stretch">
            <Box>
                <PaymentElement
                    options={{
                        layout: {
                            type: 'tabs',
                            defaultCollapsed: false,
                        }
                    }}
                />
            </Box>

            {error && (
                <Alert.Root status="error" borderRadius="lg">
                    {/* s<Alert.Icon /> */}
                    <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
            )}

            <Button
                onClick={handleSubmit}
                colorScheme="teal"
                size="lg"
                disabled={!stripe || processing}
                h={14}
                fontSize="lg"
                _hover={{
                    transform: 'scale(1.02)',
                }}
                transition="all 0.2s"
            >
                {processing ? (
                    <HStack>
                        <Spinner size="sm" />
                        <Text>Processing...</Text>
                    </HStack>
                ) : (
                    `Pay $${(amount / 100).toFixed(2)}`
                )}
            </Button>

            <Text textAlign="center" fontSize="sm" >
                Your payment information is encrypted and secure
            </Text>
        </VStack>
    );
}

function PaymentStep({ selectedPlan, onBack, onSuccess }: {
    selectedPlan: typeof products[0];
    onBack: () => void;
    onSuccess: () => void
}) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useUser();
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    React.useEffect(() => {
        if (!user) {
            setError('User not authenticated. Please log in.');
            setLoading(false);
            return;
        }
        fetch(`${BACKEND_URL}/payment/create-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to create subscription');
                return res.json();
            })
            .then(data => {
                setClientSecret(data.client_secret);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message || 'Failed to initialize payment. Please try again.');
                setLoading(false);
            });
    }, [user]);

    const options = clientSecret ? {
        clientSecret,
        appearance: {
            theme: 'flat' as const,
            variables: {
                colorPrimary: '#14b8a6',
                colorBackground: 'transparent',
                colorText: isDark ? '#d1fae5' : '#0f766e',
                colorDanger: '#ef4444',
                fontFamily: 'system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
            },
            rules: {
                '.Input': {
                    backgroundColor: 'transparent',
                    border: isDark ? '1px solid #14b8a6' : '1px solid #99f6e4',
                    boxShadow: 'none',
                    color: isDark ? '#d1fae5' : '#0f766e',
                },
                '.Input:focus': {
                    border: '2px solid #14b8a6',
                    boxShadow: '0 0 0 3px rgba(20, 184, 166, 0.1)',
                },
                '.Tab': {
                    backgroundColor: 'transparent',
                    border: isDark ? '1px solid #14b8a6' : '1px solid #99f6e4',
                    color: isDark ? '#d1fae5' : '#0f766e',
                },
                '.Tab--selected': {
                    backgroundColor: 'rgba(20, 184, 166, 0.15)',
                    border: '2px solid #14b8a6',
                    color: '#14b8a6',
                },
                '.TabLabel': {
                    color: isDark ? '#d1fae5' : '#0f766e',
                },
                '.TabLabel--selected': {
                    color: '#14b8a6',
                },
                '.Label': {
                    color: isDark ? '#d1fae5' : '#0f766e',
                    fontWeight: '500',
                },
                '.Block': {
                    backgroundColor: 'transparent',
                },
                '.PickerItem': {
                    backgroundColor: 'transparent',
                    border: isDark ? '1px solid #14b8a6' : '1px solid #99f6e4',
                },
                '.PickerItem--selected': {
                    backgroundColor: 'rgba(20, 184, 166, 0.15)',
                    border: '2px solid #14b8a6',
                },
                '.PickerItem:hover': {
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                }
            }
        }
    } : undefined;

    return (
        <VStack gap={8} align="stretch">
            <HStack justify="space-between" align="center">
                <Button
                    variant="surface"
                    onClick={onBack}
                    alignContent={"center"}
                    alignItems={"center"}
                    size="md"
                >
                    Back to Plans
                </Button>
            </HStack>

            <Box textAlign="center">
                <Heading size="2xl" mb={2} bgGradient="to-r" gradientFrom="teal.400" gradientTo="teal.600" bgClip="text">
                    Complete Your Purchase
                </Heading>
                <Text fontSize="lg">Subscribe to {selectedPlan.name}</Text>
            </Box>

            <Card.Root bg="transparent" borderWidth="1px" borderColor="gray.200" shadow="lg">
                <Card.Body p={8}>
                    {loading ? (
                        <VStack py={16} gap={4}>
                            <Spinner size="xl" color="teal.500" />
                            <Text >Loading payment form...</Text>
                        </VStack>
                    ) : error ? (
                        <VStack gap={4}>
                            <Alert.Root status="error" borderRadius="lg">
                                {/* <Alert.Icon /> */}
                                <Alert.Title>{error}</Alert.Title>
                            </Alert.Root>
                            <Button onClick={onBack} colorScheme="teal" variant="outline">
                                Go Back
                            </Button>
                        </VStack>
                    ) : (
                        <VStack gap={8} align="stretch">
                            <Box
                                bg="rgba(20, 184, 166, 0.05)"
                                p={6}
                                borderRadius="xl"
                                borderWidth="1px"
                                borderColor="teal.200"
                            >
                                <HStack justify="space-between" align="center">
                                    <VStack align="start" gap={1}>
                                        <Text fontWeight="medium" >Total due today</Text>
                                        <Text fontSize="sm" >Billed monthly</Text>
                                    </VStack>
                                    <Heading size="2xl" color="teal.600">{selectedPlan.price}</Heading>
                                </HStack>
                            </Box>

                            {clientSecret && (
                                <Elements stripe={stripePromise} options={options}>
                                    <CheckoutForm
                                        amount={selectedPlan.priceValue}
                                        onSuccess={onSuccess}
                                    />
                                </Elements>
                            )}
                        </VStack>
                    )}
                </Card.Body>
            </Card.Root>
        </VStack>
    );
}

// Step 3: Success Confirmation
function SuccessStep({ selectedPlan }: { selectedPlan: typeof products[0] }) {
    const navigate = useNavigate();

    // Centered, compact confirmation layout
    return (
        <Box display="flex" justifyContent="center">
            <Box maxW="640px" w="100%" px={4}>
                <VStack gap={6} align="stretch">
                    <Box textAlign="center">
                        <Box
                            w={16}
                            h={16}
                            bg="teal.500"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            mx="auto"
                            mb={4}
                            shadow="md"
                        >
                            <Text fontSize="3xl" color="white">✓</Text>
                        </Box>
                        <Heading size="lg" mb={1} bgGradient="to-r" gradientFrom="teal.400" gradientTo="teal.600" bgClip="text">
                            Welcome to Premium!
                        </Heading>
                        <Text fontSize="md" color="gray.600">
                            Your subscription is now active
                        </Text>
                    </Box>

                    <Card.Root bg="transparent" borderWidth="1px" borderColor="gray.200" shadow="sm" borderRadius="lg" overflow="hidden">
                        <Card.Body p={4}>
                            <VStack gap={3} align="stretch">
                                <HStack justify="space-between" p={2} borderRadius="md">
                                    <Text fontWeight="medium" fontSize="sm">Plan</Text>
                                    <Text fontSize="md" fontWeight="semibold" color="teal.600">{selectedPlan.name}</Text>
                                </HStack>

                                <Separator />

                                <HStack justify="space-between" p={2} borderRadius="md">
                                    <Text fontWeight="medium" fontSize="sm">Amount</Text>
                                    <Text fontSize="md" fontWeight="semibold">{selectedPlan.price}/month</Text>
                                </HStack>

                                <Separator />

                                <HStack justify="space-between" p={2} borderRadius="md">
                                    <Text fontWeight="medium" fontSize="sm">Next billing date</Text>
                                    <Text fontSize="md" fontWeight="semibold">
                                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                </HStack>

                                <Alert.Root status="info" mt={2} borderRadius="md" bg="rgba(20, 184, 166, 0.04)" borderColor="teal.100">
                                    <Alert.Title fontSize="sm">
                                        A confirmation email has been sent to your email address.
                                    </Alert.Title>
                                </Alert.Root>
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <HStack gap={3}>
                        <Button
                            colorScheme="teal"
                            size="md"
                            flex={1}
                            onClick={() => navigate('/my-courses')}
                        >
                            Browse Courses
                        </Button>
                        <Button
                            // variant="outline"
                            colorScheme="teal"
                            size="md"
                            flex={1}
                            onClick={() => navigate('/my-roadmaps')}
                        >
                            Explore Roadmaps
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        </Box>
    );

}

// Main Payment Stepper Component
export default function PaymentStepper() {
    const navigate = useNavigate();
    const { refreshUser } = useUser();
    const [step, setStep] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState<typeof products[0] | null>(null);

    // Check for success parameter in URL
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            // Set the selected plan for display (premium plan)
            setSelectedPlan(products.find(p => p.isPremium) || products[1]);
            setStep(3);
            // Refresh user data to update membership status
            const updateUser = async () => {
                if (refreshUser) {
                    console.log('🔄 Refreshing user after payment success...');
                    await refreshUser();
                }
            };
            updateUser();
        }
    }, [refreshUser]);

    const handleSelectPlan = (plan: typeof products[0]) => {
        setSelectedPlan(plan);
        setStep(2);
    };

    const handlePaymentSuccess = async () => {
        setStep(3);
        // Refresh user data immediately after successful payment
        if (refreshUser) {
            console.log('🔄 Refreshing user after payment confirmation...');
            // Wait a moment for webhook to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            await refreshUser();

            // If still not premium, try again after another delay
            // This handles cases where webhook takes longer
            setTimeout(async () => {
                console.log('🔄 Second refresh attempt...');
                await refreshUser();
            }, 3000);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    return (
        <Container maxW="container.lg" py={16}>
            {/* Progress Indicator */}
            <HStack justify="center" mb={16} gap={2}>
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <VStack gap={2}>
                            <Box
                                w={12}
                                h={12}
                                borderRadius="full"
                                bg={step >= s ? 'teal.500' : 'gray.200'}
                                color={step >= s ? 'white' : 'gray.500'}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                fontWeight="bold"
                                fontSize="lg"
                                transition="all 0.3s"
                                shadow={step === s ? 'lg' : 'none'}
                            >
                                {step > s ? '✓' : s}
                            </Box>
                            <Text
                                fontSize="sm"
                                fontWeight={step >= s ? 'semibold' : 'normal'}
                                color={step >= s ? 'teal.600' : 'gray.500'}
                                display={{ base: 'none', md: 'block' }}
                            >
                                {s === 1 ? 'Select Plan' : s === 2 ? 'Payment' : 'Confirmation'}
                            </Text>
                        </VStack>
                        {s < 3 && (
                            <Box
                                w={16}
                                h={0.5}
                                bg={step > s ? 'teal.500' : 'gray.200'}
                                transition="all 0.3s"
                                mb={8}
                            />
                        )}
                    </React.Fragment>
                ))}
            </HStack>

            {/* Step Content */}
            {step === 1 && <ProductsStep onSelectPlan={handleSelectPlan} />}

            {step === 2 && selectedPlan && (
                <PaymentStep
                    selectedPlan={selectedPlan}
                    onBack={handleBack}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {step === 3 && selectedPlan && (
                <SuccessStep selectedPlan={selectedPlan} />
            )}
        </Container>
    );
}