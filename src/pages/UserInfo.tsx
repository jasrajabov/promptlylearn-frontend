import React, { useState, useEffect, use } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Badge,
    Card,
    Input,
    Button,
    Spinner,
    Dialog,
    Grid,
    Icon,
} from "@chakra-ui/react";
import { toaster as toast } from "../components/ui/toaster";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    CreditCard,
    Calendar,
    Phone,
    Briefcase,
    Building,
    Award,
} from "lucide-react";
import CancellationHandler from "../components/CancellationHandler";
import { useColorModeValue } from "../components/ui/color-mode";

const MotionBox = motion(Box);

interface UserData {
    id: string;
    email: string;
    name: string | null;
    membership_status: string;
    personal_info: {
        phone?: string;
        organization?: string;
        role?: string;
    } | null;
    membership_plan: string;
    membership_active_until: string | null;
    credits: number;
    credits_reset_at: string | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function UserInfoPage() {
    const { user, refreshUser } = useUser();
    const navigate = useNavigate();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit form states
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editOrganization, setEditOrganization] = useState("");
    const [editRole, setEditRole] = useState("");
    const [showCancellationHandler, setShowCancellationHandler] = useState(false);
    const [cancellationSuccess, setCancellationSuccess] = useState(false);

    const cardBg = useColorModeValue("gray.50", "gray.900");

    useEffect(() => {
        if (!user) {
            navigate("/auth");
            return;
        }
        fetchUserData();
    }, [user, navigate]);

    // Separate effect to handle cancellation success
    useEffect(() => {
        if (cancellationSuccess) {
            const refreshData = async () => {
                await refreshUser();
                await fetchUserData(); // Refetch user data to update the UI

                toast.create({
                    title: "Membership cancelled",
                    description: "Your premium membership has been cancelled successfully",
                    type: "success",
                    duration: 3000,
                });

                // Reset the success flag
                setCancellationSuccess(false);
            };

            refreshData();
        }
    }, [cancellationSuccess, refreshUser]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BACKEND_URL}/user/me`, {
                headers: {
                    Authorization: `Bearer ${user?.token}`,
                },
            });
            const data = await response.json();
            setUserData(data);

            // Initialize edit fields
            setEditName(data.name || "");
            setEditPhone(data.personal_info?.phone || "");
            setEditOrganization(data.personal_info?.organization || "");
            setEditRole(data.personal_info?.role || "");
        } catch (error) {
            toast.create({
                title: "Error loading user data",
                description: "Unable to fetch your information",
                type: "error",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch(`${BACKEND_URL}/user/me`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
                body: JSON.stringify({
                    name: editName,
                    personal_info: {
                        phone: editPhone,
                        organization: editOrganization,
                        role: editRole,
                    },
                }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                setUserData(updatedData);
                setIsEditing(false);
                toast.create({
                    title: "Profile updated",
                    description: "Your information has been saved successfully",
                    type: "success",
                    duration: 3000,
                });
            }
        } catch (error) {
            toast.create({
                title: "Error saving",
                description: "Unable to update your information",
                type: "error",
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditName(userData?.name || "");
        setEditPhone(userData?.personal_info?.phone || "");
        setEditOrganization(userData?.personal_info?.organization || "");
        setEditRole(userData?.personal_info?.role || "");
        setIsEditing(false);
    };

    const getMembershipStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "green";
            case "expired":
                return "red";
            case "trial":
                return "blue";
            default:
                return "gray";
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <Container maxW="6xl" py={12}>
                <VStack gap={4}>
                    <Spinner size="xl" color="teal.500" />
                    <Text>Loading your information...</Text>
                </VStack>
            </Container>
        );
    }

    if (!userData) {
        return (
            <Container maxW="6xl" py={12}>
                <Text>Unable to load user data</Text>
            </Container>
        );
    }

    return (
        <Container maxW="6xl" py={12}>
            <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <VStack gap={8} align="stretch">
                    {/* Header */}
                    <HStack justify="space-between" align="center">
                        <Heading size="2xl">My Profile</Heading>
                        {!isEditing ? (
                            <Button colorScheme="teal" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </Button>
                        ) : (
                            <HStack>
                                <Button variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button
                                    colorScheme="teal"
                                    onClick={handleSave}
                                    loading={saving}
                                >
                                    Save Changes
                                </Button>
                            </HStack>
                        )}
                    </HStack>

                    <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
                        {/* Personal Information */}
                        <Card.Root bg={cardBg}>
                            <Card.Body>
                                <VStack align="stretch" gap={6}>
                                    <Heading size="lg">Personal Information</Heading>

                                    {/* Name */}
                                    <HStack align="start">
                                        <Icon fontSize="xl" color="teal.500">
                                            <User />
                                        </Icon>
                                        <Box flex={1}>
                                            <Text fontWeight="semibold" mb={1}>
                                                Name
                                            </Text>
                                            {isEditing ? (
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    placeholder="Enter your name"
                                                />
                                            ) : (
                                                <Text color="gray.600">
                                                    {userData.name || "Not provided"}
                                                </Text>
                                            )}
                                        </Box>
                                    </HStack>

                                    {/* Email */}
                                    <HStack align="start">
                                        <Icon fontSize="xl" color="teal.500">
                                            <Mail />
                                        </Icon>
                                        <Box flex={1}>
                                            <Text fontWeight="semibold" mb={1}>
                                                Email
                                            </Text>
                                            <Text color="gray.600">{userData.email}</Text>
                                        </Box>
                                    </HStack>

                                    {/* Phone */}
                                    <HStack align="start">
                                        <Icon fontSize="xl" color="teal.500">
                                            <Phone />
                                        </Icon>
                                        <Box flex={1}>
                                            <Text fontWeight="semibold" mb={1}>
                                                Phone
                                            </Text>
                                            {isEditing ? (
                                                <Input
                                                    value={editPhone}
                                                    onChange={(e) => setEditPhone(e.target.value)}
                                                    placeholder="Enter your phone number"
                                                    type="tel"
                                                />
                                            ) : (
                                                <Text color="gray.600">
                                                    {userData.personal_info?.phone || "Not provided"}
                                                </Text>
                                            )}
                                        </Box>
                                    </HStack>

                                    {/* Organization */}
                                    <HStack align="start">
                                        <Icon fontSize="xl" color="teal.500">
                                            <Building />
                                        </Icon>
                                        <Box flex={1}>
                                            <Text fontWeight="semibold" mb={1}>
                                                Company/School
                                            </Text>
                                            {isEditing ? (
                                                <Input
                                                    value={editOrganization}
                                                    onChange={(e) => setEditOrganization(e.target.value)}
                                                    placeholder="Enter your company or school"
                                                />
                                            ) : (
                                                <Text color="gray.600">
                                                    {userData.personal_info?.organization ||
                                                        "Not provided"}
                                                </Text>
                                            )}
                                        </Box>
                                    </HStack>

                                    {/* Role */}
                                    <HStack align="start">
                                        <Icon fontSize="xl" color="teal.500">
                                            <Briefcase />
                                        </Icon>
                                        <Box flex={1}>
                                            <Text fontWeight="semibold" mb={1}>
                                                Role/Position
                                            </Text>
                                            {isEditing ? (
                                                <Input
                                                    value={editRole}
                                                    onChange={(e) => setEditRole(e.target.value)}
                                                    placeholder="Enter your role"
                                                />
                                            ) : (
                                                <Text color="gray.600">
                                                    {userData.personal_info?.role || "Not provided"}
                                                </Text>
                                            )}
                                        </Box>
                                    </HStack>
                                </VStack>
                            </Card.Body>
                        </Card.Root>

                        {/* Membership & Credits */}
                        <VStack gap={6} align="stretch">
                            {/* Membership Status */}
                            <Card.Root bg={cardBg}>
                                <Card.Body>
                                    <VStack align="stretch" gap={4}>
                                        <HStack justify="space-between">
                                            <Heading size="md">Membership</Heading>
                                            <Badge
                                                colorPalette={getMembershipStatusColor(
                                                    userData.membership_status
                                                )}
                                                fontSize="sm"
                                                px={3}
                                                py={1}
                                                borderRadius="full"
                                                variant="solid"
                                            >
                                                {userData.membership_status.toUpperCase()}
                                            </Badge>
                                        </HStack>

                                        <HStack align="start">
                                            <Icon fontSize="xl" color="purple.500">
                                                <Award />
                                            </Icon>
                                            <Box>
                                                <Text fontWeight="semibold" mb={1}>
                                                    Plan
                                                </Text>
                                                <Text color="gray.600" textTransform="capitalize">
                                                    {userData.membership_plan}
                                                </Text>
                                            </Box>
                                        </HStack>

                                        <HStack align="start">
                                            <Icon fontSize="xl" color="purple.500">
                                                <Calendar />
                                            </Icon>
                                            <Box>
                                                <Text fontWeight="semibold" mb={1}>
                                                    Active Until
                                                </Text>
                                                <Text color="gray.600">
                                                    {formatDate(userData.membership_active_until)}
                                                </Text>
                                            </Box>
                                        </HStack>
                                        <HStack>
                                            {userData.membership_plan === "premium" && userData.membership_status === "ACTIVE" ? (
                                                <Button onClick={() => setShowCancellationHandler(true)} size="sm" variant="outline">
                                                    Cancel Membership
                                                </Button>
                                            ) : (userData.membership_status !== "ACTIVE" || userData.membership_plan === "free") && (
                                                <Button
                                                    onClick={() => navigate("/upgrade")}
                                                    size="sm"
                                                    colorScheme="teal"
                                                    variant="solid"
                                                >
                                                    Upgrade to Premium
                                                </Button>
                                            )}
                                        </HStack>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>

                            {/* Credits */}
                            <Card.Root bg={cardBg}>
                                <Card.Body>
                                    <VStack align="stretch" gap={4}>
                                        <HStack>
                                            <Icon fontSize="xl" color="teal.600">
                                                <CreditCard />
                                            </Icon>
                                            <Heading size="md">Credits</Heading>
                                        </HStack>
                                        {userData.membership_plan === "free" ? (
                                            <>
                                                <Box>
                                                    <Text fontSize="3xl" fontWeight="bold" color="teal.600">
                                                        {userData.credits}
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.600" mt={1}>
                                                        Available credits
                                                    </Text>
                                                </Box>

                                                <Box>
                                                    <Text fontWeight="semibold" mb={1}>
                                                        Resets On
                                                    </Text>
                                                    <Text color="gray.600" fontSize="sm">
                                                        {formatDate(userData.credits_reset_at)}
                                                    </Text>
                                                </Box>
                                            </>
                                        ) : (
                                            <VStack align="stretch" gap={2}>
                                                <Text color="gray.600">
                                                    Unlimited credits with your {userData.membership_plan} plan.
                                                </Text>
                                                <Text color="gray.600">
                                                    Enjoy all the benefits of premium membership.
                                                </Text>
                                            </VStack>
                                        )}
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        </VStack>
                    </Grid>

                    {/* Account ID */}
                    <Card.Root>
                        <Card.Body>
                            <HStack>
                                <Text fontWeight="semibold">Account ID:</Text>
                                <Text color="gray.600" fontFamily="mono" fontSize="sm">
                                    {userData.id}
                                </Text>
                            </HStack>
                        </Card.Body>
                    </Card.Root>
                </VStack>
            </MotionBox>

            {/* Render cancellation dialog */}
            <CancellationHandler
                open={showCancellationHandler}
                onOpenChange={setShowCancellationHandler}
                cancellationSuccess={cancellationSuccess}
                setCancellationSuccess={setCancellationSuccess}
            />
        </Container>
    );
}