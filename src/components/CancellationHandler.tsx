import { useState } from 'react';
import { Button, Box, VStack, Spinner, Text, Dialog } from '@chakra-ui/react';
import { useUser } from '../contexts/UserContext';
import CancellationConfirmation from './CancellationConfirmation';

type CancelSubscriptionResponse = {
    status: boolean;
    message: string;
    subscription_id: string;
    cancel_at: number;
    current_period_end: boolean;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type CancellationHandlerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cancellationSuccess: boolean;
    setCancellationSuccess: (success: boolean) => void;
};

export default function CancellationHandler({ open, onOpenChange, cancellationSuccess, setCancellationSuccess }: CancellationHandlerProps) {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [cancellationResponse, setCancellationResponse] = useState<CancelSubscriptionResponse | null>(null);

    const handleCancelSubscription = async () => {
        if (!user) return alert("You must be logged in");

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
            // Don't set cancellationSuccess here yet - wait for dialog close
        } catch (err) {
            console.error(err);
            alert('Failed to cancel subscription');
        } finally {
            setLoading(false);
        }
    }

    const handleCloseDialog = () => {
        if (cancellationResponse) {
            // User is closing after successful cancellation
            setCancellationSuccess(true);
        }
        // Reset local state
        setCancellationResponse(null);
        setLoading(false);
        onOpenChange(false);
    };

    return (
        <Dialog.Root open={open} onOpenChange={(e) => {
            if (!e.open) {
                handleCloseDialog();
            }
        }}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    {loading ? (
                        <Dialog.Body>
                            <VStack minH="400px" justify="center" align="center" gap={4}>
                                <Spinner size="xl" color="teal.500" />
                                <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                                    Processing your request...
                                </Text>
                            </VStack>
                        </Dialog.Body>
                    ) : cancellationResponse ? (
                        <>
                            <Dialog.Header>
                                <Dialog.Title>Subscription Cancelled</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <VStack gap={6} align="stretch">
                                    <CancellationConfirmation cancellationResponse={cancellationResponse} />
                                </VStack>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button
                                    variant="solid"
                                    colorScheme="teal"
                                    onClick={handleCloseDialog}
                                >
                                    Close
                                </Button>
                            </Dialog.Footer>
                        </>
                    ) : (
                        <>
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
                                    <Button onClick={handleCloseDialog} variant="outline" colorScheme="gray">
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
                        </>
                    )}
                    <Dialog.CloseTrigger />
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}