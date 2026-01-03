import React, { useState } from "react";
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
  Collapsible
} from "@chakra-ui/react";
import { FaSun, FaMoon, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useColorModeValue, useColorMode } from "../components/ui/color-mode";
import promptlyLeanrnLogoDark from "../assets/pl-logo-dark.png";
import promptlyLeanrnLogoLight from "../assets/pl-logo-light.png";
import { FaSignInAlt } from "react-icons/fa";
import { type User } from "../types";
import { Badge, Stack } from "@chakra-ui/react"
import { HiAtSymbol, HiStar } from "react-icons/hi"
import { BiSolidCoinStack } from "react-icons/bi";



const NavItem: React.FC<{ label: string; onClick: () => void }> = ({
  label,
  onClick,
}) => {
  const hoverGlow = useColorModeValue(
    "0 0 12px rgba(56, 178, 172, 0.6)",
    "0 0 14px rgba(129, 230, 217, 0.6)"
  );

  return (
    <Button
      size="sm"
      variant="ghost"
      fontWeight="medium"
      onClick={onClick}
      transition="all 0.2s ease"
      _hover={{ boxShadow: hoverGlow, transform: "translateY(-1px)" }}
      borderRadius={100}
    >
      {label}
    </Button>
  );
};

const Header: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentUser = user as User | undefined;
  const logo = useColorModeValue(promptlyLeanrnLogoLight, promptlyLeanrnLogoDark);
  const bg = useColorModeValue("whiteAlpha.800", "blackAlpha.700");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");

  // Show hamburger only on small screens
  const isMobile = useBreakpointValue({ base: true, md: false });
  console.log("Rendering Header. Current user:", currentUser);
  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={100}
      backdropFilter="blur(10px)"
      bg={bg}
      borderBottom="1px solid"
      borderColor={border}
    >
      <Flex
        maxW="1200px"
        mx="auto"
        px={4}
        py={2}
        align="center"
        justify="space-between"
      >
        {/* Left: Logo */}
        <HStack gap={3}>
          <Image
            src={logo}
            alt="AI Course Builder"
            height="40px"
            onClick={() => navigate("/")}
            cursor="pointer"
          />
          {!isMobile && currentUser?.token && (
            <>
              <NavItem label="My Courses" onClick={() => navigate("/my-courses")} />
              <NavItem label="My Tracks" onClick={() => navigate("/my-roadmaps")} />
              <NavItem label="About" onClick={() => navigate("/about")} />
              <NavItem label="Pricing" onClick={() => navigate("/upgrade")} />
            </>
          )}
        </HStack>

        {/* Right: Actions */}
        <HStack gap={2}>
          {!isMobile && (
            <>
              {currentUser ? (
                <HStack align="center" gap={3}>
                  <HStack gap={2} align="center">

                    {currentUser.membership_plan === "free" && (
                      <Text fontSize="sm">
                        Credits: {currentUser.credits ?? 0}
                      </Text>
                    )}

                  </HStack>
                  <Badge alignSelf="center" px={3} py={1} borderRadius="md" colorPalette={user?.membership_plan === "premium" ? "purple" : "yellow"} variant="solid">
                    {currentUser.membership_plan === "premium" ? (
                      <HStack gap={1}>
                        <HiStar />
                        <span>Premium</span>
                      </HStack>
                    ) : (
                      <HStack gap={1}>
                        <BiSolidCoinStack />
                        <span>Freemium</span>
                      </HStack>
                    )}
                  </Badge>

                  <Menu.Root positioning={{ placement: "right-end" }}>
                    <Menu.Trigger rounded="full" focusRing="outside">
                      <Avatar.Root>
                        <Avatar.Fallback name={currentUser.name} />
                        <Avatar.Image src={currentUser.avatar_url || undefined} />
                        <Float placement="bottom-end" offsetX="1" offsetY="1">
                          <Circle
                            bg="green.500"
                            size="8px"
                            outline="0.2em solid"
                            outlineColor="bg"
                          />
                        </Float>
                      </Avatar.Root>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          <Menu.Item value="my-profile">My Profile</Menu.Item>
                          <Menu.Item onSelect={logout} value="logout">Logout</Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                </HStack>
              ) : (
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  <HStack gap={2}>
                    <FaSignInAlt />
                    <span>Login</span>
                  </HStack>
                </Button>
              )}
              <Button size="sm" variant="ghost" borderRadius={100} onClick={toggleColorMode}>
                {colorMode === "light" ? <FaMoon /> : <FaSun />}
              </Button>
            </>
          )}

          {/* Hamburger for mobile */}
          {isMobile && (
            <Button
              aria-label="Menu"

              size="sm"
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <FaBars />
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Mobile Menu */}
      {isMobile && (
        <Collapsible.Root open={isMobileMenuOpen} unmountOnExit>
          <Collapsible.Content >
            <VStack px={4} py={2} gap={2} align="start" bg={bg} borderTop="1px solid" borderColor={border}>
              {currentUser?.token && (
                <>
                  <NavItem label="My Courses" onClick={() => navigate("/my-courses")} />
                  <NavItem label="My Tracks" onClick={() => navigate("/my-roadmaps")} />
                  <NavItem label="About" onClick={() => navigate("/about")} />
                </>
              )}
              {currentUser ? (
                <>
                  <NavItem label="My Profile" onClick={() => navigate("/profile")} />
                  <NavItem label="Logout" onClick={logout} />
                </>
              ) : (
                <NavItem label="Login" onClick={() => navigate("/login")} />
              )}
              <Button size="sm" variant="ghost" onClick={toggleColorMode}>
                {colorMode === "light" ? <FaMoon /> : <FaSun />}
              </Button>
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </Box>
  );
};

export default Header;
