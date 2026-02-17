import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Flex,
  HStack,
  VStack,
  Button,
  Avatar,
  Menu,
  Portal,
  Circle,
  Image,
  Box,
  Text,
  useBreakpointValue,
  Float,
  IconButton,
} from "@chakra-ui/react";
import {
  FaSun,
  FaMoon,
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useColorModeValue, useColorMode } from "../components/ui/color-mode";
import promptlyLeanrnLogoDark from "../assets/promptlylearn_logo_dark.svg";
import promptlyLeanrnLogoLight from "../assets/promptlylearn_logo_light.svg";
import { FaSignInAlt } from "react-icons/fa";
import { type User } from "../types";
import { Badge } from "@chakra-ui/react";
import { HiStar } from "react-icons/hi";
import { BiSolidCoinStack } from "react-icons/bi";
import { BookOpen, Map, Shield } from "lucide-react";

const NavItem: React.FC<{
  label: string;
  onClick: () => void;
  active?: boolean;
  icon?: React.ReactNode;
  isMobile?: boolean;
}> = ({ label, onClick, active = false, icon, isMobile = false }) => {
  const hoverBg = useColorModeValue("gray.100", "gray.800");
  const activeColor = useColorModeValue("teal.600", "teal.400");
  const activeBg = useColorModeValue("teal.50", "teal.900/20");
  const textColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Button
      size={isMobile ? "md" : "sm"}
      variant="ghost"
      fontWeight={active ? "semibold" : "medium"}
      onClick={onClick}
      bg={active ? activeBg : "transparent"}
      color={active ? activeColor : textColor}
      _hover={{ bg: active ? activeBg : hoverBg }}
      borderRadius="lg"
      justifyContent={isMobile ? "flex-start" : "center"}
      px={3}
      w={isMobile ? "100%" : "auto"}
      transition="all 0.2s"
    >
      <HStack gap={2}>
        {icon}
        <Text>{label}</Text>
      </HStack>
    </Button>
  );
};

const Header: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentUser = user as User | undefined;

  const logo = useColorModeValue(
    promptlyLeanrnLogoLight,
    promptlyLeanrnLogoDark,
  );
  const bg = useColorModeValue("white", "gray.950");
  const border = useColorModeValue("gray.200", "gray.700");
  const mobileMenuBg = useColorModeValue("white", "black");
  const cardBg = useColorModeValue("gray.50", "gray.900");
  const subTextColor = useColorModeValue("gray.600", "gray.400");

  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Memoized admin check
  const isAdmin = useMemo(() =>
    (currentUser as any)?.isAdmin ||
    (currentUser as any)?.role === "ADMIN" ||
    (currentUser as any)?.role === "SUPER_ADMIN",
    [currentUser]
  );

  // Optimized navigation handler
  const handleNavClick = useCallback((path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const isActive = useCallback((path: string) =>
    location.pathname === path,
    [location.pathname]
  );

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isMobileMenuOpen]);

  return (
    <>
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={1000}
        borderBottom="1px solid"
        borderColor={border}
        boxShadow="sm"
        bg={bg}
        backdropFilter="blur(10px)"
      >
        <Flex
          maxW="1400px"
          mx="auto"
          px={{ base: 4, md: 6 }}
          py={3}
          align="center"
          justify="space-between"
        >
          {/* Left: Logo & Nav */}
          <HStack gap={{ base: 3, md: 6 }} flex={1}>
            <Image
              src={logo}
              alt="PromptlyLearn"
              height={{ base: "36px", md: "40px" }}
              onClick={() => handleNavClick("/")}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ transform: "scale(1.05)", opacity: 0.8 }}
            />

            {!isMobile && (
              <HStack gap={1} ml={2}>
                <NavItem
                  label="Home"
                  onClick={() => handleNavClick("/")}
                  active={isActive("/")}
                />
                <NavItem
                  label="About"
                  onClick={() => handleNavClick("/about")}
                  active={isActive("/about")}
                />
                {currentUser?.token && (
                  <>
                    <NavItem
                      label="Courses"
                      onClick={() => handleNavClick("/my-courses")}
                      active={isActive("/my-courses")}
                      icon={<BookOpen size={14} />}
                    />
                    <NavItem
                      label="Tracks"
                      onClick={() => handleNavClick("/my-roadmaps")}
                      active={isActive("/my-roadmaps")}
                      icon={<Map size={14} />}
                    />
                    {isAdmin && (
                      <NavItem
                        label="Admin"
                        onClick={() => handleNavClick("/admin")}
                        active={isActive("/admin")}
                        icon={<Shield size={14} />}
                      />
                    )}
                  </>
                )}
              </HStack>
            )}
          </HStack>

          {/* Right: User Actions */}
          <HStack gap={{ base: 2, md: 3 }}>
            {!isMobile && (
              <>
                {currentUser ? (
                  <HStack gap={2}>
                    {/* Credits Display */}
                    {currentUser.membership_plan === "free" && !isAdmin && (
                      <Badge
                        colorPalette="gray"
                        variant="outline"
                        px={2.5}
                        py={1.5}
                        borderRadius="lg"
                        fontSize="xs"
                        fontWeight="600"
                        borderWidth="1px"
                      >
                        <HStack gap={1.5}>
                          <BiSolidCoinStack size={14} />
                          <Text fontWeight="700">{currentUser.credits ?? 0}</Text>
                          <Text fontSize="2xs" color={subTextColor}>
                            • Daily reset
                          </Text>
                        </HStack>
                      </Badge>
                    )}

                    {/* Membership Badge */}
                    <Badge
                      colorPalette={
                        isAdmin
                          ? "red"
                          : currentUser.membership_plan === "premium"
                            ? "purple"
                            : "teal"
                      }
                      variant="subtle"
                      px={2.5}
                      py={1}
                      borderRadius="lg"
                      fontSize="xs"
                      fontWeight="600"
                    >
                      <HStack gap={1.5}>
                        {isAdmin ? (
                          <>
                            <Shield size={12} />
                            <Text>Admin</Text>
                          </>
                        ) : currentUser.membership_plan === "premium" ? (
                          <>
                            <HiStar size={12} />
                            <Text>Pro</Text>
                          </>
                        ) : (
                          <Text>Free</Text>
                        )}
                      </HStack>
                    </Badge>

                    {/* User Menu */}
                    <Menu.Root positioning={{ placement: "bottom-end" }}>
                      <Menu.Trigger asChild>
                        <Box
                          cursor="pointer"
                          transition="all 0.2s"
                          _hover={{ opacity: 0.8 }}
                        >
                          <Avatar.Root
                            size="sm"
                            borderWidth="2px"
                            borderColor="transparent"
                            _hover={{ borderColor: "teal.400" }}
                          >
                            <Avatar.Fallback fontSize="xs" fontWeight="600">
                              {currentUser?.name?.[0]?.toUpperCase() ?? "?"}
                            </Avatar.Fallback>
                            <Avatar.Image
                              src={currentUser?.avatar_url || undefined}
                            />
                            <Float placement="bottom-end" offsetX="0" offsetY="0">
                              <Circle
                                bg="green.400"
                                size="10px"
                                outline="2px solid"
                                outlineColor={bg}
                              />
                            </Float>
                          </Avatar.Root>
                        </Box>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content minW="220px" borderRadius="xl">
                            <Box
                              px={3}
                              py={2.5}
                              borderBottomWidth="1px"
                              borderColor={border}
                            >
                              <Text fontSize="sm" fontWeight="600">
                                {currentUser.name}
                              </Text>
                              <Text fontSize="xs" color={subTextColor} >
                                {currentUser.email}
                              </Text>
                            </Box>
                            <Menu.Item
                              value="profile"
                              onClick={() => navigate("/user-info")}
                            >
                              <HStack gap={2}>
                                <FaUser size={14} />
                                <Text>Profile</Text>
                              </HStack>
                            </Menu.Item>
                            {isAdmin && (
                              <Menu.Item
                                value="admin"
                                onClick={() => navigate("/admin")}
                              >
                                <HStack gap={2}>
                                  <Shield size={14} />
                                  <Text>Admin</Text>
                                </HStack>
                              </Menu.Item>
                            )}
                            <Menu.Separator />
                            <Menu.Item
                              value="logout"
                              onClick={logout}
                              color="red.500"
                            >
                              <HStack gap={2}>
                                <FaSignOutAlt size={14} />
                                <Text>Logout</Text>
                              </HStack>
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </HStack>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/login")}
                    fontWeight="600"
                    borderRadius="lg"
                    px={4}
                  >
                    <HStack gap={2}>
                      <FaSignInAlt size={13} />
                      <Text>Login</Text>
                    </HStack>
                  </Button>
                )}

                {/* Theme Toggle */}
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={toggleColorMode}
                  aria-label="Toggle theme"
                  borderRadius="lg"
                >
                  {colorMode === "light" ? (
                    <FaMoon size={14} />
                  ) : (
                    <FaSun size={14} />
                  )}
                </IconButton>
              </>
            )}

            {/* Mobile Hamburger */}
            {isMobile && (
              <IconButton
                size="md"
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Open menu"
                borderRadius="lg"
              >
                <FaBars size={20} />
              </IconButton>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Mobile Slide-in Menu - Simple Overlay */}
      {isMobile && isMobileMenuOpen && (
        <>
          {/* Slide-in Menu - Full Screen */}
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            w="100vw"
            h="100vh"
            bg={mobileMenuBg}
            zIndex={1001}
            overflowY="auto"
          >
            {/* Menu Header */}
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderBottom="1px solid"
              borderColor={border}
            >
              <Text fontSize="lg" fontWeight="bold">Menu</Text>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <FaTimes size={18} />
              </IconButton>
            </Flex>

            <VStack align="stretch" gap={0} p={4}>
              {/* User Info Section */}
              {currentUser && (
                <>
                  <Box
                    p={4}
                    bg={cardBg}
                    borderRadius="xl"
                    mb={4}
                  >
                    <HStack gap={3} mb={3}>
                      <Avatar.Root size="lg">
                        <Avatar.Fallback fontSize="lg" fontWeight="600">
                          {currentUser?.name?.[0]?.toUpperCase() ?? "?"}
                        </Avatar.Fallback>
                        <Avatar.Image
                          src={currentUser?.avatar_url || undefined}
                        />
                      </Avatar.Root>
                      <VStack gap={0.5} align="start" flex={1}>
                        <Text fontSize="md" fontWeight="bold">
                          {currentUser?.name}
                        </Text>
                        <Text fontSize="xs" color={subTextColor} >
                          {currentUser?.email}
                        </Text>
                      </VStack>
                    </HStack>

                    <VStack gap={2} align="stretch">
                      <HStack gap={2} flexWrap="wrap">
                        <Badge
                          size="sm"
                          colorPalette={
                            isAdmin
                              ? "red"
                              : currentUser.membership_plan === "premium"
                                ? "purple"
                                : "teal"
                          }
                          variant="subtle"
                          px={3}
                          py={1.5}
                        >
                          <HStack gap={1.5}>
                            {isAdmin ? (
                              <>
                                <Shield size={14} />
                                <Text fontWeight="600">Admin</Text>
                              </>
                            ) : currentUser.membership_plan === "premium" ? (
                              <>
                                <HiStar size={14} />
                                <Text fontWeight="600">Pro</Text>
                              </>
                            ) : (
                              <Text fontWeight="600">Free</Text>
                            )}
                          </HStack>
                        </Badge>

                        {currentUser.membership_plan === "free" && !isAdmin && (
                          <Badge
                            size="sm"
                            colorPalette="gray"
                            variant="outline"
                            px={3}
                            py={1.5}
                          >
                            <HStack gap={1.5}>
                              <BiSolidCoinStack size={14} />
                              <Text fontWeight="700">
                                {currentUser.credits ?? 0}
                              </Text>
                              <Text fontWeight="600" color={subTextColor}>
                                credits
                              </Text>
                            </HStack>
                          </Badge>
                        )}
                      </HStack>

                      {currentUser.membership_plan === "free" && !isAdmin && (
                        <Text fontSize="xs" color={subTextColor} fontStyle="italic">
                          Credits reset daily at login
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </>
              )}

              {/* Navigation Links */}
              <VStack gap={1} align="stretch" mb={4}>
                <NavItem
                  label="Home"
                  onClick={() => handleNavClick("/")}
                  active={isActive("/")}
                  isMobile
                />
                <NavItem
                  label="About"
                  onClick={() => handleNavClick("/about")}
                  active={isActive("/about")}
                  isMobile
                />
                {currentUser?.token && (
                  <>
                    <NavItem
                      label="My Courses"
                      onClick={() => handleNavClick("/my-courses")}
                      active={isActive("/my-courses")}
                      icon={<BookOpen size={16} />}
                      isMobile
                    />
                    <NavItem
                      label="My Tracks"
                      onClick={() => handleNavClick("/my-roadmaps")}
                      active={isActive("/my-roadmaps")}
                      icon={<Map size={16} />}
                      isMobile
                    />
                    {isAdmin && (
                      <NavItem
                        label="Admin Panel"
                        onClick={() => handleNavClick("/admin")}
                        active={isActive("/admin")}
                        icon={<Shield size={16} />}
                        isMobile
                      />
                    )}
                  </>
                )}
              </VStack>

              {/* User Actions */}
              {currentUser ? (
                <VStack gap={2} align="stretch" mb={4}>
                  <Button
                    size="md"
                    variant="ghost"
                    onClick={() => handleNavClick("/user-info")}
                    justifyContent="flex-start"
                    w="full"
                  >
                    <HStack gap={2}>
                      <FaUser size={14} />
                      <Text>My Profile</Text>
                    </HStack>
                  </Button>
                  <Button
                    size="md"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    justifyContent="flex-start"
                    w="full"
                  >
                    <HStack gap={2}>
                      <FaSignOutAlt size={14} />
                      <Text>Logout</Text>
                    </HStack>
                  </Button>
                </VStack>
              ) : (
                <Button
                  size="lg"
                  onClick={() => handleNavClick("/login")}
                  w="full"
                  variant="solid"
                  colorPalette="teal"
                  borderRadius="lg"
                  mb={4}
                >
                  <HStack gap={2}>
                    <FaSignInAlt />
                    <Text fontWeight="600">Login</Text>
                  </HStack>
                </Button>
              )}

              {/* Theme Toggle */}
              <Button
                size="md"
                variant="outline"
                onClick={toggleColorMode}
                w="full"
                borderRadius="lg"
              >
                <HStack gap={2}>
                  {colorMode === "light" ? (
                    <>
                      <FaMoon size={14} />
                      <Text>Dark Mode</Text>
                    </>
                  ) : (
                    <>
                      <FaSun size={14} />
                      <Text>Light Mode</Text>
                    </>
                  )}
                </HStack>
              </Button>
            </VStack>
          </Box>
        </>
      )}
    </>
  );
};

export default Header;