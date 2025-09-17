import { useState } from "react";
import { Box, Button, Input, VStack, Heading } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const LoginPage = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");

  const handleLogin = () => {
    login(name, "");

    // Redirect back to where user came from (or home)
    const returnTo = (location.state as { returnTo?: string })?.returnTo || "/";
    navigate(returnTo);
  };

  return (
    <Box maxW="400px" mx="auto" mt={20}>
      <Heading mb={6} color="teal.600" textAlign="center">
        Login
      </Heading>
      <VStack gap={4}>
        <Input
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button colorScheme="teal" onClick={handleLogin} disabled={!name}>
          Login
        </Button>
      </VStack>
    </Box>
  );
};

export default LoginPage;
