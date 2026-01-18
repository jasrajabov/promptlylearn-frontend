import React, { useState, useEffect } from "react";
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
  Grid,
  Icon,
  Stack,
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
  Shield,
  Activity,
  Clock,
  TrendingUp,
  Database,
  Settings,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import CancellationHandler from "../components/CancellationHandler";
import { useColorModeValue } from "../components/ui/color-mode";
import DeleteAccountDialog from "../components/DeleteAccountDialog";

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
  isAdmin?: boolean;
  role?: string;
  created_at?: string;
  last_login?: string;
}

interface AdminStats {
  totalCourses: number;
  totalUsers: number;
  activeSubscriptions: number;
  systemHealth: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function UserInfoPage() {
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editOrganization, setEditOrganization] = useState("");
  const [editRole, setEditRole] = useState("");
  const [showCancellationHandler, setShowCancellationHandler] = useState(false);
  const [cancellationSuccess, setCancellationSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const cardBg = useColorModeValue("white", "gray.950");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const accentColor = useColorModeValue("teal.600", "teal.400");
  const adminAccentColor = useColorModeValue("red.600", "red.400");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.900");
  const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.1)");
  const adminHighlightBg = useColorModeValue("red.50", "rgba(239, 68, 68, 0.1)");

  const gradientText = useColorModeValue(
    "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
    "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
  );

  const isAdmin =
    (userData as any)?.isAdmin ||
    (userData as any)?.role === "ADMIN" ||
    (userData as any)?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchUserData();
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [user, navigate, isAdmin]);

  useEffect(() => {
    if (cancellationSuccess) {
      const refreshData = async () => {
        await refreshUser();
        await fetchUserData();

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

  const fetchAdminStats = async () => {
    try {
      setAdminStats({
        totalCourses: 156,
        totalUsers: 2847,
        activeSubscriptions: 432,
        systemHealth: "Excellent",
      });
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    }
  };

  const handleDeleteSuccess = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Container maxW="7xl" py={12}>
        <VStack gap={3}>
          <Spinner size="lg" color="teal.500" />
          <Text fontSize="sm" color={mutedText}>
            Loading your information...
          </Text>
        </VStack>
      </Container>
    );
  }

  if (!userData) {
    return (
      <Container maxW="7xl" py={12}>
        <Text>Unable to load user data</Text>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 } as any}
      >
        <VStack gap={5} align="stretch">
          {/* Header with Admin Badge */}
          <Stack
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            gap={3}
          >
            <HStack gap={2.5}>
              <Heading
                fontSize={{ base: "2xl", md: "4xl" }}
                fontWeight="900"
                bgGradient={gradientText}
                bgClip="text"
                lineHeight="2.05"
                letterSpacing="-0.04em"
                maxW="1000px"
              >
                My Profile
              </Heading>
              {isAdmin && (
                <Badge
                  colorPalette="red"
                  variant="solid"
                  px={2.5}
                  py={1}
                  borderRadius="full"
                  fontSize="2xs"
                  fontWeight="bold"
                >
                  <HStack gap={1}>
                    <Shield size={12} />
                    <Text>ADMIN</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>
            {!isEditing ? (
              <Button
                colorPalette={isAdmin ? "red" : "teal"}
                onClick={() => setIsEditing(true)}
                size="sm"
                borderRadius="lg"
              >
                <Settings size={16} />
                Edit Profile
              </Button>
            ) : (
              <HStack gap={2}>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  size="sm"
                  borderRadius="lg"
                >
                  Cancel
                </Button>
                <Button
                  colorPalette={isAdmin ? "red" : "teal"}
                  onClick={handleSave}
                  loading={saving}
                  size="sm"
                  borderRadius="lg"
                >
                  <CheckCircle size={16} />
                  Save Changes
                </Button>
              </HStack>
            )}
          </Stack>

          {/* Admin Quick Stats */}
          {isAdmin && adminStats && (
            <MotionBox
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 } as any}
            >
              <Card.Root
                bg={cardBg}
                borderWidth="2px"
                borderColor={adminAccentColor}
                borderRadius="xl"
                boxShadow="0 4px 12px rgba(239, 68, 68, 0.1)"
              >
                <Card.Body p={5}>
                  <VStack align="stretch" gap={4}>
                    <HStack justify="space-between">
                      <HStack gap={2}>
                        <Icon fontSize="xl" color={adminAccentColor}>
                          <Activity />
                        </Icon>
                        <Heading size="md">Admin Dashboard</Heading>
                      </HStack>
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette="red"
                        onClick={() => navigate("/admin")}
                        borderRadius="lg"
                      >
                        Full Dashboard →
                      </Button>
                    </HStack>

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        sm: "repeat(2, 1fr)",
                        lg: "repeat(4, 1fr)",
                      }}
                      gap={3}
                    >
                      <Box
                        p={4}
                        borderRadius="lg"
                        bg={adminHighlightBg}
                        borderWidth="2px"
                        borderColor={borderColor}
                        transition="all 0.2s"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                          borderColor: adminAccentColor,
                        }}
                      >
                        <HStack gap={2} mb={2}>
                          <Icon color="blue.500" fontSize="lg">
                            <Database />
                          </Icon>
                          <Text fontSize="2xs" fontWeight="bold" color={mutedText}>
                            TOTAL COURSES
                          </Text>
                        </HStack>
                        <Text fontSize="2xl" fontWeight="bold">
                          {adminStats.totalCourses}
                        </Text>
                      </Box>

                      <Box
                        p={4}
                        borderRadius="lg"
                        bg={adminHighlightBg}
                        borderWidth="2px"
                        borderColor={borderColor}
                        transition="all 0.2s"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                          borderColor: adminAccentColor,
                        }}
                      >
                        <HStack gap={2} mb={2}>
                          <Icon color="purple.500" fontSize="lg">
                            <User />
                          </Icon>
                          <Text fontSize="2xs" fontWeight="bold" color={mutedText}>
                            TOTAL USERS
                          </Text>
                        </HStack>
                        <Text fontSize="2xl" fontWeight="bold">
                          {adminStats.totalUsers.toLocaleString()}
                        </Text>
                      </Box>

                      <Box
                        p={4}
                        borderRadius="lg"
                        bg={adminHighlightBg}
                        borderWidth="2px"
                        borderColor={borderColor}
                        transition="all 0.2s"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                          borderColor: adminAccentColor,
                        }}
                      >
                        <HStack gap={2} mb={2}>
                          <Icon color="green.500" fontSize="lg">
                            <TrendingUp />
                          </Icon>
                          <Text fontSize="2xs" fontWeight="bold" color={mutedText}>
                            ACTIVE SUBS
                          </Text>
                        </HStack>
                        <Text fontSize="2xl" fontWeight="bold">
                          {adminStats.activeSubscriptions}
                        </Text>
                      </Box>

                      <Box
                        p={4}
                        borderRadius="lg"
                        bg={adminHighlightBg}
                        borderWidth="2px"
                        borderColor={borderColor}
                        transition="all 0.2s"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                          borderColor: adminAccentColor,
                        }}
                      >
                        <HStack gap={2} mb={2}>
                          <Icon color="teal.500" fontSize="lg">
                            <Activity />
                          </Icon>
                          <Text fontSize="2xs" fontWeight="bold" color={mutedText}>
                            SYSTEM HEALTH
                          </Text>
                        </HStack>
                        <HStack>
                          <Text fontSize="lg" fontWeight="bold">
                            {adminStats.systemHealth}
                          </Text>
                          <CheckCircle size={16} color="green" />
                        </HStack>
                      </Box>
                    </Grid>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </MotionBox>
          )}

          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={5}>
            {/* Personal Information */}
            <Card.Root
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="xl"
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
            >
              <Card.Body p={5}>
                <VStack align="stretch" gap={4}>
                  <HStack gap={2}>
                    <Icon
                      fontSize="xl"
                      color={isAdmin ? adminAccentColor : accentColor}
                    >
                      <User />
                    </Icon>
                    <Heading size="md">Personal Information</Heading>
                  </HStack>

                  {/* Name */}
                  <Box
                    p={3.5}
                    borderRadius="lg"
                    bg={hoverBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={
                      !isEditing
                        ? {
                          bg: isAdmin ? adminHighlightBg : highlightBg,
                          borderColor: isAdmin
                            ? adminAccentColor
                            : accentColor,
                        }
                        : {}
                    }
                  >
                    <HStack align="start" gap={3}>
                      <Icon
                        fontSize="lg"
                        color={isAdmin ? adminAccentColor : accentColor}
                        mt={0.5}
                      >
                        <User />
                      </Icon>
                      <Box flex={1}>
                        <Text
                          fontWeight="bold"
                          mb={1.5}
                          fontSize="2xs"
                          color={mutedText}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Full Name
                        </Text>
                        {isEditing ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter your name"
                            size="sm"
                            borderRadius="lg"
                            borderWidth="2px"
                            _focus={{
                              borderColor: isAdmin
                                ? adminAccentColor
                                : accentColor,
                            }}
                          />
                        ) : (
                          <Text fontSize="sm" fontWeight="medium">
                            {userData.name || "Not provided"}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </Box>

                  {/* Email */}
                  <Box
                    p={3.5}
                    borderRadius="lg"
                    bg={hoverBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={{
                      bg: isAdmin ? adminHighlightBg : highlightBg,
                      borderColor: isAdmin ? adminAccentColor : accentColor,
                    }}
                  >
                    <HStack align="start" gap={3}>
                      <Icon
                        fontSize="lg"
                        color={isAdmin ? adminAccentColor : accentColor}
                        mt={0.5}
                      >
                        <Mail />
                      </Icon>
                      <Box flex={1}>
                        <Text
                          fontWeight="bold"
                          mb={1.5}
                          fontSize="2xs"
                          color={mutedText}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Email Address
                        </Text>
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          fontFamily="mono"
                        >
                          {userData.email}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>

                  {/* Phone */}
                  <Box
                    p={3.5}
                    borderRadius="lg"
                    bg={hoverBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={
                      !isEditing
                        ? {
                          bg: isAdmin ? adminHighlightBg : highlightBg,
                          borderColor: isAdmin
                            ? adminAccentColor
                            : accentColor,
                        }
                        : {}
                    }
                  >
                    <HStack align="start" gap={3}>
                      <Icon
                        fontSize="lg"
                        color={isAdmin ? adminAccentColor : accentColor}
                        mt={0.5}
                      >
                        <Phone />
                      </Icon>
                      <Box flex={1}>
                        <Text
                          fontWeight="bold"
                          mb={1.5}
                          fontSize="2xs"
                          color={mutedText}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Phone Number
                        </Text>
                        {isEditing ? (
                          <Input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="Enter your phone number"
                            type="tel"
                            size="sm"
                            borderRadius="lg"
                            borderWidth="2px"
                            _focus={{
                              borderColor: isAdmin
                                ? adminAccentColor
                                : accentColor,
                            }}
                          />
                        ) : (
                          <Text fontSize="sm" fontWeight="medium">
                            {userData.personal_info?.phone || "Not provided"}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </Box>

                  {/* Organization */}
                  <Box
                    p={3.5}
                    borderRadius="lg"
                    bg={hoverBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={
                      !isEditing
                        ? {
                          bg: isAdmin ? adminHighlightBg : highlightBg,
                          borderColor: isAdmin
                            ? adminAccentColor
                            : accentColor,
                        }
                        : {}
                    }
                  >
                    <HStack align="start" gap={3}>
                      <Icon
                        fontSize="lg"
                        color={isAdmin ? adminAccentColor : accentColor}
                        mt={0.5}
                      >
                        <Building />
                      </Icon>
                      <Box flex={1}>
                        <Text
                          fontWeight="bold"
                          mb={1.5}
                          fontSize="2xs"
                          color={mutedText}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Company/School
                        </Text>
                        {isEditing ? (
                          <Input
                            value={editOrganization}
                            onChange={(e) =>
                              setEditOrganization(e.target.value)
                            }
                            placeholder="Enter your company or school"
                            size="sm"
                            borderRadius="lg"
                            borderWidth="2px"
                            _focus={{
                              borderColor: isAdmin
                                ? adminAccentColor
                                : accentColor,
                            }}
                          />
                        ) : (
                          <Text fontSize="sm" fontWeight="medium">
                            {userData.personal_info?.organization ||
                              "Not provided"}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </Box>

                  {/* Role */}
                  <Box
                    p={3.5}
                    borderRadius="lg"
                    bg={hoverBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={
                      !isEditing
                        ? {
                          bg: isAdmin ? adminHighlightBg : highlightBg,
                          borderColor: isAdmin
                            ? adminAccentColor
                            : accentColor,
                        }
                        : {}
                    }
                  >
                    <HStack align="start" gap={3}>
                      <Icon
                        fontSize="lg"
                        color={isAdmin ? adminAccentColor : accentColor}
                        mt={0.5}
                      >
                        <Briefcase />
                      </Icon>
                      <Box flex={1}>
                        <Text
                          fontWeight="bold"
                          mb={1.5}
                          fontSize="2xs"
                          color={mutedText}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Role/Position
                        </Text>
                        {isEditing ? (
                          <Input
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            placeholder="Enter your role"
                            size="sm"
                            borderRadius="lg"
                            borderWidth="2px"
                            _focus={{
                              borderColor: isAdmin
                                ? adminAccentColor
                                : accentColor,
                            }}
                          />
                        ) : (
                          <Text fontSize="sm" fontWeight="medium">
                            {userData.personal_info?.role || "Not provided"}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </Box>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Sidebar */}
            <VStack gap={5} align="stretch">
              {/* Membership Status */}
              <Card.Root
                bg={cardBg}
                borderWidth="2px"
                borderColor={isAdmin ? adminAccentColor : accentColor}
                borderRadius="xl"
                boxShadow={
                  isAdmin
                    ? "0 4px 12px rgba(239, 68, 68, 0.1)"
                    : "0 4px 12px rgba(20, 184, 166, 0.1)"
                }
              >
                <Card.Body p={5}>
                  <VStack align="stretch" gap={4}>
                    <HStack justify="space-between">
                      <HStack gap={2}>
                        <Icon
                          fontSize="lg"
                          color={isAdmin ? adminAccentColor : "purple.500"}
                        >
                          {isAdmin ? <Shield /> : <Award />}
                        </Icon>
                        <Heading size="sm">Membership</Heading>
                      </HStack>
                      <Badge
                        colorPalette={getMembershipStatusColor(
                          userData.membership_status,
                        )}
                        fontSize="2xs"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        variant="solid"
                        fontWeight="bold"
                      >
                        {userData.membership_status.toUpperCase()}
                      </Badge>
                    </HStack>

                    <Box
                      p={3}
                      borderRadius="lg"
                      bg={isAdmin ? adminHighlightBg : highlightBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <HStack gap={2} mb={1}>
                        <Icon
                          fontSize="md"
                          color={isAdmin ? adminAccentColor : "purple.500"}
                        >
                          {isAdmin ? <Shield /> : <Award />}
                        </Icon>
                        <Text
                          fontWeight="bold"
                          fontSize="2xs"
                          color={mutedText}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Plan Type
                        </Text>
                      </HStack>
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        textTransform="capitalize"
                        ml={6}
                      >
                        {isAdmin ? "Admin" : userData.membership_plan}
                      </Text>
                    </Box>

                    {!isAdmin && (
                      <Box
                        p={3}
                        borderRadius="lg"
                        bg={highlightBg}
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <HStack gap={2} mb={1}>
                          <Icon fontSize="md" color="purple.500">
                            <Calendar />
                          </Icon>
                          <Text
                            fontWeight="bold"
                            fontSize="2xs"
                            color={mutedText}
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Active Until
                          </Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium" ml={6}>
                          {formatDate(userData.membership_active_until)}
                        </Text>
                      </Box>
                    )}

                    {!isAdmin &&
                      userData.membership_plan === "premium" &&
                      userData.membership_status === "ACTIVE" ? (
                      <Button
                        onClick={() => setShowCancellationHandler(true)}
                        size="sm"
                        variant="outline"
                        colorPalette="red"
                        width="full"
                        borderRadius="lg"
                      >
                        <AlertCircle size={14} />
                        Cancel Membership
                      </Button>
                    ) : (
                      !isAdmin &&
                      (userData.membership_status !== "ACTIVE" ||
                        userData.membership_plan === "free") && (
                        <Button
                          onClick={() => navigate("/upgrade")}
                          size="sm"
                          colorPalette="teal"
                          variant="solid"
                          width="full"
                          borderRadius="lg"
                        >
                          <TrendingUp size={14} />
                          Upgrade to Premium
                        </Button>
                      )
                    )}
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Credits */}
              {!isAdmin && (
                <Card.Root
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="xl"
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
                >
                  <Card.Body p={5}>
                    <VStack align="stretch" gap={4}>
                      <HStack gap={2}>
                        <Icon fontSize="lg" color={accentColor}>
                          <CreditCard />
                        </Icon>
                        <Heading size="sm">Credits</Heading>
                      </HStack>

                      {userData.membership_plan === "free" ? (
                        <>
                          <Box
                            p={4}
                            borderRadius="lg"
                            bg={highlightBg}
                            borderWidth="2px"
                            borderColor={accentColor}
                            textAlign="center"
                          >
                            <Text
                              fontSize="4xl"
                              fontWeight="bold"
                              color={accentColor}
                              lineHeight="1"
                            >
                              {userData.credits}
                            </Text>
                            <Text
                              fontSize="2xs"
                              color={mutedText}
                              mt={2}
                              fontWeight="bold"
                              textTransform="uppercase"
                              letterSpacing="wider"
                            >
                              Available Credits
                            </Text>
                          </Box>

                          <Box
                            p={3}
                            borderRadius="lg"
                            bg={hoverBg}
                            borderWidth="1px"
                            borderColor={borderColor}
                          >
                            <HStack gap={2} mb={1}>
                              <Icon fontSize="md" color={accentColor}>
                                <Clock />
                              </Icon>
                              <Text
                                fontWeight="bold"
                                fontSize="2xs"
                                color={mutedText}
                                textTransform="uppercase"
                                letterSpacing="wider"
                              >
                                Resets On
                              </Text>
                            </HStack>
                            <Text fontSize="sm" fontWeight="medium" ml={6}>
                              {formatDate(userData.credits_reset_at)}
                            </Text>
                          </Box>
                        </>
                      ) : (
                        <Box
                          p={4}
                          borderRadius="lg"
                          bg={highlightBg}
                          borderWidth="2px"
                          borderColor={accentColor}
                          textAlign="center"
                        >
                          <CheckCircle
                            size={40}
                            style={{ margin: "0 auto", marginBottom: "12px" }}
                            color="#14B8A6"
                          />
                          <Text fontWeight="bold" fontSize="md" mb={1}>
                            Unlimited Credits
                          </Text>
                          <Text
                            color={mutedText}
                            fontSize="xs"
                            fontWeight="medium"
                          >
                            Premium benefits active
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Admin Privileges */}
              {isAdmin && (
                <Card.Root
                  bg={cardBg}
                  borderWidth="2px"
                  borderColor={adminAccentColor}
                  borderRadius="xl"
                  boxShadow="0 4px 12px rgba(239, 68, 68, 0.1)"
                >
                  <Card.Body p={5}>
                    <VStack align="stretch" gap={4}>
                      <HStack gap={2}>
                        <Icon fontSize="lg" color={adminAccentColor}>
                          <Shield />
                        </Icon>
                        <Heading size="sm">Admin Privileges</Heading>
                      </HStack>

                      <Box
                        p={3}
                        borderRadius="lg"
                        bg={adminHighlightBg}
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <VStack align="start" gap={2}>
                          <HStack>
                            <CheckCircle size={14} color="green" />
                            <Text fontSize="xs" fontWeight="medium">
                              Unlimited Access
                            </Text>
                          </HStack>
                          <HStack>
                            <CheckCircle size={14} color="green" />
                            <Text fontSize="xs" fontWeight="medium">
                              User Management
                            </Text>
                          </HStack>
                          <HStack>
                            <CheckCircle size={14} color="green" />
                            <Text fontSize="xs" fontWeight="medium">
                              Content Moderation
                            </Text>
                          </HStack>
                          <HStack>
                            <CheckCircle size={14} color="green" />
                            <Text fontSize="xs" fontWeight="medium">
                              System Configuration
                            </Text>
                          </HStack>
                        </VStack>
                      </Box>

                      <Button
                        colorPalette="red"
                        variant="solid"
                        onClick={() => navigate("/admin")}
                        width="full"
                        size="sm"
                        borderRadius="lg"
                      >
                        <Settings size={14} />
                        Open Admin Panel
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}
            </VStack>
          </Grid>

          {/* Account Details */}
          <Card.Root
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="xl"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
          >
            <Card.Body p={5}>
              <VStack align="stretch" gap={4}>
                <Heading size="sm">Account Details</Heading>
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                  gap={3}
                >
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={hoverBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={{
                      bg: isAdmin ? adminHighlightBg : highlightBg,
                      borderColor: isAdmin ? adminAccentColor : accentColor,
                    }}
                  >
                    <Text
                      fontWeight="bold"
                      fontSize="2xs"
                      color={mutedText}
                      mb={1.5}
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Account ID
                    </Text>
                    <Text fontFamily="mono" fontSize="xs" fontWeight="medium">
                      {userData.id}
                    </Text>
                  </Box>
                  {userData.created_at && (
                    <Box
                      p={3}
                      borderRadius="lg"
                      bg={hoverBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      transition="all 0.2s"
                      _hover={{
                        bg: isAdmin ? adminHighlightBg : highlightBg,
                        borderColor: isAdmin ? adminAccentColor : accentColor,
                      }}
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="2xs"
                        color={mutedText}
                        mb={1.5}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Member Since
                      </Text>
                      <Text fontSize="xs" fontWeight="medium">
                        {formatDate(userData.created_at)}
                      </Text>
                    </Box>
                  )}
                  {userData.last_login && (
                    <Box
                      p={3}
                      borderRadius="lg"
                      bg={hoverBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      transition="all 0.2s"
                      _hover={{
                        bg: isAdmin ? adminHighlightBg : highlightBg,
                        borderColor: isAdmin ? adminAccentColor : accentColor,
                      }}
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="2xs"
                        color={mutedText}
                        mb={1.5}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Last Login
                      </Text>
                      <Text fontSize="xs" fontWeight="medium">
                        {formatDateTime(userData.last_login)}
                      </Text>
                    </Box>
                  )}
                </Grid>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Danger Zone */}
          {!isAdmin && (
            <Card.Root
              bg={cardBg}
              borderWidth="2px"
              borderColor="red.500"
              borderRadius="xl"
              boxShadow="0 4px 12px rgba(239, 68, 68, 0.1)"
            >
              <Card.Body p={5}>
                <VStack align="stretch" gap={3}>
                  <HStack gap={2}>
                    <Icon fontSize="lg" color="red.500">
                      <AlertCircle />
                    </Icon>
                    <Heading size="sm" color="red.500">
                      Danger Zone
                    </Heading>
                  </HStack>

                  <Text fontSize="sm" color={mutedText}>
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </Text>

                  <Button
                    colorPalette="red"
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                    size="sm"
                    borderRadius="lg"
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </Button>
                </VStack>
              </Card.Body>
            </Card.Root>
          )}
        </VStack>
      </MotionBox>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleteSuccess={handleDeleteSuccess}
        userToken={user?.token || ""}
      />

      {/* Cancellation Dialog */}
      <CancellationHandler
        open={showCancellationHandler}
        onOpenChange={setShowCancellationHandler}
        cancellationSuccess={cancellationSuccess}
        setCancellationSuccess={setCancellationSuccess}
      />
    </Container>
  );
}