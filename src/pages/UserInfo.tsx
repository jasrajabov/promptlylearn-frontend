import { useState, useEffect } from "react";
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
  Input,
  Button,
  Spinner,
  Grid,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { toaster as toast } from "../components/ui/toaster";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
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
  Users,
  Zap,
  BarChart3,
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

  const cardBg = useColorModeValue("white", "#111111");
  const borderColor = useColorModeValue("#e5e7eb", "#27272a");
  const accentColor = useColorModeValue("#14b8a6", "#2dd4bf");
  const mutedText = useColorModeValue("#6b7280", "#9ca3af");
  const hoverBg = useColorModeValue("#f9fafb", "#1a1a1a");
  const highlightBg = useColorModeValue("#f0fdfa", "#042f2e");
  const iconBg = useColorModeValue("#f0fdfa", "#042f2e");

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
        return "orange";
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
        <Flex justify="center" align="center" h="60vh">
          <VStack gap={3}>
            <Spinner size="xl" color="teal.500" />
            <Text fontSize="sm" color={mutedText} fontWeight="500">
              Loading your profile...
            </Text>
          </VStack>
        </Flex>
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
    <Container maxW="7xl" py={{ base: 6, md: 8 }}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 } as any}
      >
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Flex
            justify="space-between"
            align={{ base: "start", md: "center" }}
            flexDir={{ base: "column", md: "row" }}
            gap={4}
          >
            <HStack gap={3}>
              <Box
                p={2.5}
                borderRadius="10px"
                bg={iconBg}
              >
                <User size={24} color="#14b8a6" />
              </Box>
              <VStack align="start" gap={0}>
                <Text
                  fontSize="xs"
                  color={mutedText}
                  fontWeight="600"
                  letterSpacing="0.5px"
                  textTransform="uppercase"
                >
                  Account Settings
                </Text>
                <Heading
                  fontSize={{ base: "2xl", md: "3xl" }}
                  // fontSize="lg"
                  fontWeight="bold"
                  bgGradient={gradientText}
                  bgClip="text"
                >
                  My Profile
                </Heading>
              </VStack>
              {isAdmin && (
                <Badge
                  colorScheme="teal"
                  px={2.5}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="700"
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
                colorScheme="teal"
                onClick={() => setIsEditing(true)}
                size="sm"
                borderRadius="8px"
                fontWeight="600"
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
                  borderRadius="8px"
                  fontWeight="600"
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="teal"
                  onClick={handleSave}
                  loading={saving}
                  size="sm"
                  borderRadius="8px"
                  fontWeight="600"
                >
                  <CheckCircle size={16} />
                  Save Changes
                </Button>
              </HStack>
            )}
          </Flex>

          {/* Admin Quick Stats */}
          {isAdmin && adminStats && (
            <MotionBox
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 } as any}
            >
              <Box
                bg={cardBg}
                borderRadius="12px"
                borderWidth="1px"
                borderColor={borderColor}
                p={{ base: 4, md: 5 }}
              >
                <Flex justify="space-between" align="center" mb={4}>
                  <HStack gap={2}>
                    <Icon fontSize="xl" color="teal.500">
                      <BarChart3 />
                    </Icon>
                    <Heading size="md" fontWeight="700">Admin Overview</Heading>
                  </HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="teal"
                    onClick={() => navigate("/admin")}
                    borderRadius="8px"
                    fontWeight="600"
                  >
                    Full Dashboard →
                  </Button>
                </Flex>

                <Grid
                  templateColumns={{
                    base: "1fr",
                    sm: "repeat(2, 1fr)",
                    lg: "repeat(4, 1fr)",
                  }}
                  gap={4}
                >
                  {/* Stat Cards */}
                  <Box
                    p={4}
                    borderRadius="10px"
                    bg={useColorModeValue("#eff6ff", "#1e3a8a")}
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
                    }}
                  >
                    <HStack gap={2} mb={2}>
                      <Icon color="blue.500" fontSize="lg">
                        <Database />
                      </Icon>
                      <Text fontSize="xs" fontWeight="600" color={mutedText} textTransform="uppercase">
                        Courses
                      </Text>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700">
                      {adminStats.totalCourses}
                    </Text>
                  </Box>

                  <Box
                    p={4}
                    borderRadius="10px"
                    bg={useColorModeValue("#f0fdf4", "#14532d")}
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.15)",
                    }}
                  >
                    <HStack gap={2} mb={2}>
                      <Icon color="green.500" fontSize="lg">
                        <Users />
                      </Icon>
                      <Text fontSize="xs" fontWeight="600" color={mutedText} textTransform="uppercase">
                        Users
                      </Text>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700">
                      {adminStats.totalUsers.toLocaleString()}
                    </Text>
                  </Box>

                  <Box
                    p={4}
                    borderRadius="10px"
                    bg={useColorModeValue("#faf5ff", "#581c87")}
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(168, 85, 247, 0.15)",
                    }}
                  >
                    <HStack gap={2} mb={2}>
                      <Icon color="purple.500" fontSize="lg">
                        <TrendingUp />
                      </Icon>
                      <Text fontSize="xs" fontWeight="600" color={mutedText} textTransform="uppercase">
                        Active Subs
                      </Text>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700">
                      {adminStats.activeSubscriptions}
                    </Text>
                  </Box>

                  <Box
                    p={4}
                    borderRadius="10px"
                    bg={useColorModeValue("#ecfdf5", "#064e3b")}
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
                    }}
                  >
                    <HStack gap={2} mb={2}>
                      <Icon color="teal.500" fontSize="lg">
                        <Activity />
                      </Icon>
                      <Text fontSize="xs" fontWeight="600" color={mutedText} textTransform="uppercase">
                        System
                      </Text>
                    </HStack>
                    <HStack>
                      <Text fontSize="lg" fontWeight="700">
                        {adminStats.systemHealth}
                      </Text>
                      <CheckCircle size={16} color="#10b981" />
                    </HStack>
                  </Box>
                </Grid>
              </Box>
            </MotionBox>
          )}

          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
            {/* Personal Information */}
            <Box
              bg={cardBg}
              borderRadius="12px"
              borderWidth="1px"
              borderColor={borderColor}
              p={{ base: 4, md: 5 }}
            >
              <VStack align="stretch" gap={4}>
                <HStack gap={2} mb={2}>
                  <Icon fontSize="xl" color="teal.500">
                    <User />
                  </Icon>
                  <Heading size="md" fontWeight="700">Personal Information</Heading>
                </HStack>

                {/* Info Fields */}
                <VStack align="stretch" gap={3}>
                  {/* Name */}
                  <Box>
                    <Text fontSize="xs" fontWeight="600" color={mutedText} mb={2} textTransform="uppercase" letterSpacing="0.5px">
                      Full Name
                    </Text>
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter your name"
                        size="md"
                        borderRadius="8px"
                        borderWidth="1px"
                        _focus={{
                          borderColor: "teal.500",
                          boxShadow: "0 0 0 1px var(--chakra-colors-teal-500)",
                        }}
                      />
                    ) : (
                      <Text fontSize="md" fontWeight="500" p={2.5} borderRadius="8px" bg={hoverBg}>
                        {userData.name || "Not provided"}
                      </Text>
                    )}
                  </Box>

                  {/* Email */}
                  <Box>
                    <Text fontSize="xs" fontWeight="600" color={mutedText} mb={2} textTransform="uppercase" letterSpacing="0.5px">
                      Email Address
                    </Text>
                    <HStack p={2.5} borderRadius="8px" bg={hoverBg}>
                      <Mail size={16} color="#6b7280" />
                      <Text fontSize="md" fontWeight="500" fontFamily="mono">
                        {userData.email}
                      </Text>
                    </HStack>
                  </Box>

                  {/* Phone */}
                  <Box>
                    <Text fontSize="xs" fontWeight="600" color={mutedText} mb={2} textTransform="uppercase" letterSpacing="0.5px">
                      Phone Number
                    </Text>
                    {isEditing ? (
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        type="tel"
                        size="md"
                        borderRadius="8px"
                        borderWidth="1px"
                        _focus={{
                          borderColor: "teal.500",
                          boxShadow: "0 0 0 1px var(--chakra-colors-teal-500)",
                        }}
                      />
                    ) : (
                      <Text fontSize="md" fontWeight="500" p={2.5} borderRadius="8px" bg={hoverBg}>
                        {userData.personal_info?.phone || "Not provided"}
                      </Text>
                    )}
                  </Box>

                  {/* Organization */}
                  <Box>
                    <Text fontSize="xs" fontWeight="600" color={mutedText} mb={2} textTransform="uppercase" letterSpacing="0.5px">
                      Company/School
                    </Text>
                    {isEditing ? (
                      <Input
                        value={editOrganization}
                        onChange={(e) => setEditOrganization(e.target.value)}
                        placeholder="Enter your company or school"
                        size="md"
                        borderRadius="8px"
                        borderWidth="1px"
                        _focus={{
                          borderColor: "teal.500",
                          boxShadow: "0 0 0 1px var(--chakra-colors-teal-500)",
                        }}
                      />
                    ) : (
                      <Text fontSize="md" fontWeight="500" p={2.5} borderRadius="8px" bg={hoverBg}>
                        {userData.personal_info?.organization || "Not provided"}
                      </Text>
                    )}
                  </Box>

                  {/* Role */}
                  <Box>
                    <Text fontSize="xs" fontWeight="600" color={mutedText} mb={2} textTransform="uppercase" letterSpacing="0.5px">
                      Role/Position
                    </Text>
                    {isEditing ? (
                      <Input
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        placeholder="Enter your role"
                        size="md"
                        borderRadius="8px"
                        borderWidth="1px"
                        _focus={{
                          borderColor: "teal.500",
                          boxShadow: "0 0 0 1px var(--chakra-colors-teal-500)",
                        }}
                      />
                    ) : (
                      <Text fontSize="md" fontWeight="500" p={2.5} borderRadius="8px" bg={hoverBg}>
                        {userData.personal_info?.role || "Not provided"}
                      </Text>
                    )}
                  </Box>
                </VStack>
              </VStack>
            </Box>

            {/* Sidebar */}
            <VStack gap={6} align="stretch">
              {/* Membership Status */}
              <Box
                bg={cardBg}
                borderRadius="12px"
                borderWidth="1px"
                borderColor={borderColor}
                p={{ base: 4, md: 5 }}
              >
                <VStack align="stretch" gap={4}>
                  <Flex justify="space-between" align="center">
                    <HStack gap={2}>
                      <Icon fontSize="lg" color={isAdmin ? "teal.500" : "purple.500"}>
                        {isAdmin ? <Shield /> : <Award />}
                      </Icon>
                      <Heading size="sm" fontWeight="700">Membership</Heading>
                    </HStack>
                    <Badge
                      colorScheme={getMembershipStatusColor(userData.membership_status)}
                      fontSize="xs"
                      px={2.5}
                      py={1}
                      borderRadius="full"
                      fontWeight="700"
                    >
                      {userData.membership_status.toUpperCase()}
                    </Badge>
                  </Flex>

                  <Box
                    p={3.5}
                    borderRadius="10px"
                    bg={highlightBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <Text fontSize="xs" fontWeight="600" color={mutedText} mb={2} textTransform="uppercase">
                      Plan Type
                    </Text>
                    <Text fontSize="xl" fontWeight="700" textTransform="capitalize">
                      {isAdmin ? "Admin Access" : userData.membership_plan}
                    </Text>
                  </Box>

                  {!isAdmin && (
                    <Box
                      p={3.5}
                      borderRadius="10px"
                      bg={hoverBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <HStack gap={2} mb={2}>
                        <Calendar size={16} color="#6b7280" />
                        <Text fontSize="xs" fontWeight="600" color={mutedText} textTransform="uppercase">
                          Active Until
                        </Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="600">
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
                      colorScheme="orange"
                      width="full"
                      borderRadius="8px"
                      fontWeight="600"
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
                        colorScheme="teal"
                        variant="solid"
                        width="full"
                        borderRadius="8px"
                        fontWeight="600"
                      >
                        <TrendingUp size={14} />
                        Upgrade to Premium
                      </Button>
                    )
                  )}
                </VStack>
              </Box>

              {/* Credits */}
              {!isAdmin && (
                <Box
                  bg={cardBg}
                  borderRadius="12px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  p={{ base: 4, md: 5 }}
                >
                  <VStack align="stretch" gap={4}>
                    <HStack gap={2}>
                      <Icon fontSize="lg" color="purple.500">
                        <Zap />
                      </Icon>
                      <Heading size="sm" fontWeight="700">Credits</Heading>
                    </HStack>

                    {userData.membership_plan === "free" ? (
                      <>
                        <Box
                          p={4}
                          borderRadius="10px"
                          borderWidth="1px"
                          borderColor={borderColor}
                          textAlign="center"
                        >
                          <Text fontSize="4xl" fontWeight="700" color="purple.500" lineHeight="1">
                            {userData.credits}
                          </Text>
                          <Text fontSize="xs" color={mutedText} mt={2} fontWeight="600" textTransform="uppercase">
                            Available Credits
                          </Text>
                        </Box>

                        <Box
                          p={3}
                          borderRadius="10px"
                          bg={hoverBg}
                          borderWidth="1px"
                          borderColor={borderColor}
                        >
                          <HStack gap={2} mb={2}>
                            <Clock size={16} color="#6b7280" />
                            <Text fontSize="xs" fontWeight="600" color={mutedText} textTransform="uppercase">
                              Resets On
                            </Text>
                          </HStack>
                          <Text fontSize="sm" fontWeight="600">
                            {formatDate(userData.credits_reset_at)}
                          </Text>
                        </Box>
                      </>
                    ) : (
                      <Box
                        p={5}
                        borderRadius="10px"
                        bg={highlightBg}
                        borderWidth="1px"
                        borderColor={borderColor}
                        textAlign="center"
                      >
                        <CheckCircle
                          size={40}
                          style={{ margin: "0 auto", marginBottom: "12px" }}
                          color="#10b981"
                        />
                        <Text fontWeight="700" fontSize="lg" mb={1}>
                          Unlimited Credits
                        </Text>
                        <Text color={mutedText} fontSize="sm" fontWeight="500">
                          Premium benefits active
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Admin Privileges */}
              {isAdmin && (
                <Box
                  bg={cardBg}
                  borderRadius="12px"
                  borderWidth="1px"
                  borderColor="teal.500"
                  p={{ base: 4, md: 5 }}
                >
                  <VStack align="stretch" gap={4}>
                    <HStack gap={2}>
                      <Icon fontSize="lg" color="teal.500">
                        <Shield />
                      </Icon>
                      <Heading size="sm" fontWeight="700">Admin Access</Heading>
                    </HStack>

                    <Box
                      p={3}
                      borderRadius="10px"
                      bg={highlightBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <VStack align="start" gap={2}>
                        <HStack>
                          <CheckCircle size={14} color="#10b981" />
                          <Text fontSize="sm" fontWeight="500">Unlimited Access</Text>
                        </HStack>
                        <HStack>
                          <CheckCircle size={14} color="#10b981" />
                          <Text fontSize="sm" fontWeight="500">User Management</Text>
                        </HStack>
                        <HStack>
                          <CheckCircle size={14} color="#10b981" />
                          <Text fontSize="sm" fontWeight="500">Content Moderation</Text>
                        </HStack>
                        <HStack>
                          <CheckCircle size={14} color="#10b981" />
                          <Text fontSize="sm" fontWeight="500">System Configuration</Text>
                        </HStack>
                      </VStack>
                    </Box>

                    <Button
                      colorScheme="teal"
                      onClick={() => navigate("/admin")}
                      width="full"
                      size="sm"
                      borderRadius="8px"
                      fontWeight="600"
                    >
                      <Settings size={14} />
                      Open Admin Panel
                    </Button>
                  </VStack>
                </Box>
              )}
            </VStack>
          </Grid>

          {/* Account Details */}
          <Box
            bg={cardBg}
            borderRadius="12px"
            borderWidth="1px"
            borderColor={borderColor}
            p={{ base: 4, md: 5 }}
          >
            <VStack align="stretch" gap={4}>
              <Heading size="sm" fontWeight="700">Account Details</Heading>
              <Grid
                templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                gap={3}
              >
                <Box
                  p={3.5}
                  borderRadius="10px"
                  bg={hoverBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Text fontSize="xs" fontWeight="600" color={mutedText} mb={2} textTransform="uppercase">
                    Account ID
                  </Text>
                  <Text fontFamily="mono" fontSize="sm" fontWeight="500">
                    {userData.id}
                  </Text>
                </Box>
                {userData.created_at && (
                  <Box
                    p={3.5}
                    borderRadius="10px"
                    bg={hoverBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <Text fontSize="xs" fontWeight="600" color={mutedText} mb={2} textTransform="uppercase">
                      Member Since
                    </Text>
                    <Text fontSize="sm" fontWeight="500">
                      {formatDate(userData.created_at)}
                    </Text>
                  </Box>
                )}
                {userData.last_login && (
                  <Box
                    p={3.5}
                    borderRadius="10px"
                    bg={hoverBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <Text fontSize="xs" fontWeight="600" color={mutedText} mb={2} textTransform="uppercase">
                      Last Login
                    </Text>
                    <Text fontSize="sm" fontWeight="500">
                      {formatDateTime(userData.last_login)}
                    </Text>
                  </Box>
                )}
              </Grid>
            </VStack>
          </Box>

          {/* Danger Zone */}
          {!isAdmin && (
            <Box
              bg={cardBg}
              borderRadius="12px"
              borderWidth="2px"
              borderColor="orange.500"
              p={{ base: 4, md: 5 }}
            >
              <VStack align="stretch" gap={3}>
                <HStack gap={2}>
                  <Icon fontSize="lg" color="orange.500">
                    <AlertCircle />
                  </Icon>
                  <Heading size="sm" fontWeight="700" color="orange.500">
                    Danger Zone
                  </Heading>
                </HStack>

                <Text fontSize="sm" color={mutedText} fontWeight="500">
                  Once you delete your account, there is no going back. Please be certain.
                </Text>

                <Button
                  colorScheme="orange"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  size="sm"
                  borderRadius="8px"
                  fontWeight="600"
                  alignSelf="start"
                >
                  <Trash2 size={16} />
                  Delete Account
                </Button>
              </VStack>
            </Box>
          )}
        </VStack>
      </MotionBox>

      {/* Modals */}
      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleteSuccess={handleDeleteSuccess}
        userToken={user?.token || ""}
      />

      <CancellationHandler
        open={showCancellationHandler}
        onOpenChange={setShowCancellationHandler}
        cancellationSuccess={cancellationSuccess}
        setCancellationSuccess={setCancellationSuccess}
      />
    </Container>
  );
}