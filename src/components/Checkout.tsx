import React, { useState, useEffect } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
    Box,
    Button,
    Flex,
    Heading,
    VStack,
    Text,
    HStack,
    Spinner,
    Icon,
} from "@chakra-ui/react";
import { FaCheck } from "react-icons/fa";
import { useUser } from "../contexts/UserContext";

interface CheckoutFormProps {
    setPaymentInfo: (p: { [key: string]: any }) => void;
    onPaymentSuccess?: () => void;
}

export function CheckoutForm({ setPaymentInfo, onPaymentSuccess }: CheckoutFormProps): React.ReactElement {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [pollingStatus, setPollingStatus] = useState<string>("");
    const { user, refreshUser } = useUser();

    // Handle return from redirect-based payments (CashApp, Amazon Pay, etc.)
    useEffect(() => {
        if (!stripe) return;

        const clientSecret = new URLSearchParams(window.location.search).get(
            'payment_intent_client_secret'
        );

        if (!clientSecret) return;

        setLoading(true);
        setPollingStatus("Verifying payment...");

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            if (!paymentIntent) {
                setError("Payment verification failed");
                setLoading(false);
                return;
            }

            switch (paymentIntent.status) {
                case "succeeded":
                    console.log("✅ Payment succeeded after redirect!");

                    // Store payment info
                    setPaymentInfo({
                        paymentIntentId: paymentIntent.id,
                        amount: paymentIntent.amount,
                        currency: paymentIntent.currency,
                        status: paymentIntent.status,
                        paidAt: paymentIntent.created,
                    });

                    setSuccess(true);

                    // Wait for membership activation
                    waitForMembershipUpdate().then((activated) => {
                        if (activated) {
                            console.log('🎉 Payment successful and membership activated!');
                            onPaymentSuccess?.();
                        }
                        setLoading(false);

                        // Clean up URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    });
                    break;

                case "processing":
                    setPollingStatus("Your payment is processing...");
                    setLoading(false);
                    break;

                case "requires_payment_method":
                    setError("Payment failed. Please try another payment method.");
                    setLoading(false);
                    // Clean up URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    break;

                default:
                    setError("Something went wrong with your payment.");
                    setLoading(false);
                    break;
            }
        });
    }, [stripe]);

    // Poll until membership is updated
    const waitForMembershipUpdate = async (maxAttempts = 10, interval = 1500) => {
        for (let i = 0; i < maxAttempts; i++) {
            setPollingStatus(`Activating membership... (${i + 1}/${maxAttempts})`);
            console.log(`🔄 Polling attempt ${i + 1}/${maxAttempts}...`);

            // Call refreshUser and get the fresh user data
            const freshUser = await refreshUser();

            // Check if membership is now active
            if (freshUser?.membership_active) {
                console.log('✅ Membership activated!', freshUser.membership_plan);
                setPollingStatus('Membership activated!');
                return true;
            }

            console.log(`⏳ Membership not active yet (plan: ${freshUser?.membership_plan || 'none'}), waiting ${interval}ms...`);

            // Wait before next attempt (but not after the last one)
            if (i < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }

        console.warn('⚠️ Membership not activated after maximum attempts');
        setPollingStatus('');
        return false;
    };

    const handleSubmit = async () => {
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        try {
            // Use current URL as return_url with a query param to track payment completion
            const returnUrl = `${window.location.origin}${window.location.pathname}?payment_complete=true`;

            const intentResult = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: returnUrl,
                },
                redirect: "if_required",
            });

            // If redirect happened, this code won't execute
            // If no redirect (card payment), continue with normal flow
            if (intentResult.error) {
                setError(intentResult.error.message || "Payment failed");
                setLoading(false);
                return;
            }

            // Store payment info
            setPaymentInfo({
                paymentIntentId: intentResult.paymentIntent?.id,
                amount: intentResult.paymentIntent?.amount,
                currency: intentResult.paymentIntent?.currency,
                status: intentResult.paymentIntent?.status,
                paidAt: intentResult.paymentIntent?.created,
            });

            setSuccess(true);

            // Wait for backend webhook to process and update membership
            const membershipActivated = await waitForMembershipUpdate();

            if (membershipActivated) {
                console.log('🎉 Payment successful and membership activated!');
                // Call the callback to move to next step if provided
                onPaymentSuccess?.();
            } else {
                console.warn('⚠️ Payment succeeded but membership activation is delayed');
                // You might want to show a message to the user here
            }

            setLoading(false);
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            console.error(err);
            setLoading(false);
            setPollingStatus('');
        }
    };

    console.log("user", user);

    // Show success state if membership is active
    if (success && user?.membership_active) {
        return (
            <VStack gap={6} py={8}>
                <Flex
                    w={16}
                    h={16}
                    bg="green.100"
                    rounded="full"
                    align="center"
                    justify="center"
                >
                    <Icon fontSize="2xl" color="green.600">
                        <FaCheck />
                    </Icon>
                </Flex>
                <VStack gap={2}>
                    <Heading size="xl" color="gray.900">Welcome to Premium!</Heading>
                    <Text color="gray.600">Your subscription is now active.</Text>
                    <Text fontSize="sm" color="gray.500">
                        Plan: <strong>{user.membership_plan}</strong>
                    </Text>
                </VStack>
            </VStack>
        );
    }

    return (
        <VStack gap={6}>
            <Box w="full" borderRadius="lg" p={4} borderWidth="1px" borderColor="gray.200">
                <PaymentElement />
            </Box>

            {error && (
                <Box w="full" bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="lg" p={4}>
                    <Text color="red.800" fontSize="sm">{error}</Text>
                </Box>
            )}

            {pollingStatus && (
                <Box w="full" bg="blue.50" borderWidth="1px" borderColor="blue.200" borderRadius="lg" p={4}>
                    <HStack gap={2}>
                        <Spinner size="sm" color="blue.600" />
                        <Text color="blue.800" fontSize="sm">{pollingStatus}</Text>
                    </HStack>
                </Box>
            )}

            <Button
                onClick={handleSubmit}
                colorScheme="blue"
                size="lg"
                w="full"
                disabled={!stripe || loading}
            >
                {loading ? (
                    <HStack gap={2}>
                        <Spinner size="sm" />
                        <Text>Processing...</Text>
                    </HStack>
                ) : (
                    "Complete Subscription"
                )}
            </Button>

            <Text fontSize="xs" color="gray.500" textAlign="center">
                🔒 Secure payment powered by Stripe. Your payment information is encrypted.
            </Text>
        </VStack>
    );
}