import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, VStack, HStack, Heading, Text, Button, Card, Badge, Spinner, Alert, Separator, Dialog } from '@chakra-ui/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser } from '../contexts/UserContext';
import { useColorMode } from "../components/ui/color-mode";
import CancellationConfirmation from '../components/CancellationConfirmation';
import { Check, ArrowLeft, CreditCard, Shield, Zap, Crown, Calendar, Lock } from 'lucide-react';

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
        setShowCancelDialog(false);
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
            <VStack minH="300px" justify="center" align="center" gap={4}>
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
            <VStack gap={6} align="stretch" maxW="2xl" mx="auto">
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
        <VStack gap={6} align="stretch" maxW="4xl" mx="auto">
            <Box textAlign="center">
                <Heading size="xl" mb={2}>
                    Choose Your Plan
                </Heading>
                <Text fontSize="md" color="gray.600" _dark={{ color: 'gray.400' }}>
                    Unlock all courses and roadmaps
                </Text>
            </Box>

            <HStack gap={4} align="stretch" flexDir={{ base: 'column', md: 'row' }}>
                {products.map((product) => (
                    <Card.Root
                        key={product.id}
                        flex={1}
                        borderWidth={product.isPremium ? '2px' : '1px'}
                        borderColor={product.isPremium ? 'teal.500' : 'gray.200'}
                        position="relative"
                        bg={product.isPremium ? 'rgba(0, 128, 128, 0.02)' : 'transparent'}
                        _hover={{
                            transform: product.isPremium ? 'translateY(-2px)' : 'none',
                            shadow: product.isPremium ? 'lg' : 'none',
                        }}
                        transition="all 0.2s ease"
                    >
                        {product.badge && (
                            <Badge
                                position="absolute"
                                top={-2}
                                right={4}
                                colorScheme="teal"
                                fontSize="xs"
                                px={3}
                                py={1}
                                borderRadius="full"
                            >
                                {product.badge}
                            </Badge>
                        )}

                        <Card.Body p={5}>
                            <VStack align="stretch" gap={3}>
                                <Box>
                                    <HStack mb={2}>
                                        {product.isPremium && <Crown size={18} color="#14b8a6" />}
                                        <Text fontSize="sm" fontWeight="semibold">
                                            {product.name}
                                        </Text>
                                    </HStack>
                                    <HStack align="baseline">
                                        <Heading size="xl">
                                            {product.price}
                                        </Heading>
                                        {product.isPremium && (
                                            <Text color="gray.600" fontSize="sm">/month</Text>
                                        )}
                                    </HStack>
                                </Box>

                                <Separator />

                                <VStack align="stretch" gap={2}>
                                    {product.features.map((feature, idx) => (
                                        <HStack key={idx} align="start" gap={2}>
                                            <Check size={16} color="#14b8a6" style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <Text fontSize="xs">{feature}</Text>
                                        </HStack>
                                    ))}
                                </VStack>

                                <VStack gap={2} pt={2}>
                                    <Button
                                        colorScheme="teal"
                                        variant={product.isPremium ? 'solid' : 'outline'}
                                        size="sm"
                                        w="full"
                                        onClick={() => onSelectPlan(product)}
                                        disabled={!product.isPremium}
                                    >
                                        {getButtonLabel(product)}
                                    </Button>
                                    {showCancelButton && product.isPremium && (
                                        <Button
                                            colorScheme="red"
                                            variant="ghost"
                                            size="sm"
                                            w="full"
                                            onClick={() => setShowCancelDialog(true)}
                                        >
                                            Cancel Subscription
                                        </Button>
                                    )}
                                </VStack>
                            </VStack>
                        </Card.Body>
                    </Card.Root>
                ))}
            </HStack>

            <HStack justify="center" gap={1} fontSize="xs" color="gray.500">
                <Lock size={12} />
                <Text>Secure payment powered by Stripe</Text>
            </HStack>

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
        <VStack gap={4} align="stretch">
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
                <Alert.Root status="error" borderRadius="md" fontSize="sm">
                    <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
            )}

            <Button
                onClick={handleSubmit}
                colorScheme="teal"
                size="md"
                disabled={!stripe || processing}

            >
                <CreditCard size={18} />
                {processing ? (
                    <HStack>
                        <Spinner size="sm" />
                        <Text>Processing...</Text>
                    </HStack>
                ) : (
                    `Pay $${(amount / 100).toFixed(2)}`
                )}
            </Button>

            <HStack justify="center" gap={1} fontSize="xs" color="gray.500">
                <Shield size={12} />
                <Text>Your payment information is encrypted and secure</Text>
            </HStack>
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
        <VStack gap={6} align="stretch" maxW="2xl" mx="auto">
            <Button
                variant="ghost"
                onClick={onBack}
                size="sm"
                alignSelf="flex-start"
            >
                <ArrowLeft size={16} />
                Back to Plans
            </Button>

            <Box textAlign="center">
                <Heading size="lg" mb={1}>
                    Complete Your Purchase
                </Heading>
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                    Subscribe to {selectedPlan.name}
                </Text>
            </Box>

            <Card.Root borderWidth="1px" borderColor="gray.200">
                <Card.Body p={6}>
                    {loading ? (
                        <VStack py={8} gap={3}>
                            <Spinner size="lg" color="teal.500" />
                            <Text fontSize="sm">Loading payment form...</Text>
                        </VStack>
                    ) : error ? (
                        <VStack gap={4}>
                            <Alert.Root status="error" borderRadius="md">
                                <Alert.Title>{error}</Alert.Title>
                            </Alert.Root>
                            <Button onClick={onBack} colorScheme="teal" variant="outline" size="sm">
                                Go Back
                            </Button>
                        </VStack>
                    ) : (
                        <VStack gap={5} align="stretch">
                            <Box
                                bg="rgba(20, 184, 166, 0.05)"
                                p={4}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor="teal.200"
                            >
                                <HStack justify="space-between" align="center">
                                    <VStack align="start" gap={0}>
                                        <Text fontWeight="medium" fontSize="sm">Total due today</Text>
                                        <Text fontSize="xs" color="gray.600">Billed monthly</Text>
                                    </VStack>
                                    <Heading size="xl" color="teal.600">{selectedPlan.price}</Heading>
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

    return (
        <Box display="flex" justifyContent="center">
            <Box maxW="480px" w="100%" px={4}>
                <VStack gap={5} align="stretch">
                    <Box textAlign="center">
                        <Box
                            w={14}
                            h={14}
                            bg="teal.500"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            mx="auto"
                            mb={3}
                        >
                            <Check size={28} color="white" strokeWidth={3} />
                        </Box>
                        <Heading size="lg" mb={1}>
                            Welcome to Premium!
                        </Heading>
                        <Text fontSize="sm" color="gray.600">
                            Your subscription is now active
                        </Text>
                    </Box>

                    <Card.Root borderWidth="1px" borderColor="gray.200">
                        <Card.Body p={4}>
                            <VStack gap={2} align="stretch">
                                <HStack justify="space-between" fontSize="sm">
                                    <Text color="gray.600">Plan</Text>
                                    <Text fontWeight="semibold" color="teal.600">{selectedPlan.name}</Text>
                                </HStack>

                                <Separator />

                                <HStack justify="space-between" fontSize="sm">
                                    <Text color="gray.600">Amount</Text>
                                    <Text fontWeight="semibold">{selectedPlan.price}/month</Text>
                                </HStack>

                                <Separator />

                                <HStack justify="space-between" fontSize="sm">
                                    <HStack gap={1}>
                                        <Calendar size={14} />
                                        <Text color="gray.600">Next billing</Text>
                                    </HStack>
                                    <Text fontWeight="semibold">
                                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                </HStack>

                                <Alert.Root status="info" mt={2} borderRadius="md" bg="rgba(20, 184, 166, 0.04)">
                                    <Alert.Title fontSize="xs">
                                        A confirmation email has been sent to your email address.
                                    </Alert.Title>
                                </Alert.Root>
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <VStack gap={2}>
                        <Button
                            colorScheme="teal"
                            size="sm"
                            w="full"
                            onClick={() => navigate('/my-courses')}

                        >
                            <Zap size={16} />
                            Browse Courses
                        </Button>
                        <Button
                            variant="outline"
                            colorScheme="teal"
                            size="sm"
                            w="full"
                            onClick={() => navigate('/my-roadmaps')}
                        >
                            Explore Roadmaps
                        </Button>
                    </VStack>
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
            setSelectedPlan(products.find(p => p.isPremium) || products[1]);
            setStep(3);
            const updateUser = async () => {
                if (refreshUser) {
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
        if (refreshUser) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await refreshUser();
            setTimeout(async () => {
                await refreshUser();
            }, 3000);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    return (
        <Container maxW="container.xl" py={8}>
            {/* Compact Progress Indicator */}
            <HStack justify="center" mb={8} gap={1}>
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <VStack gap={1}>
                            <Box
                                w={8}
                                h={8}
                                borderRadius="full"
                                bg={step >= s ? 'teal.500' : 'gray.200'}
                                color={step >= s ? 'white' : 'gray.500'}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                fontWeight="semibold"
                                fontSize="sm"
                                transition="all 0.2s"
                            >
                                {step > s ? <Check size={16} /> : s}
                            </Box>
                            <Text
                                fontSize="xs"
                                fontWeight={step >= s ? 'semibold' : 'normal'}
                                color={step >= s ? 'teal.600' : 'gray.500'}
                                display={{ base: 'none', sm: 'block' }}
                            >
                                {s === 1 ? 'Plan' : s === 2 ? 'Payment' : 'Done'}
                            </Text>
                        </VStack>
                        {s < 3 && (
                            <Box
                                w={12}
                                h={0.5}
                                bg={step > s ? 'teal.500' : 'gray.200'}
                                transition="all 0.2s"
                                mb={6}
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