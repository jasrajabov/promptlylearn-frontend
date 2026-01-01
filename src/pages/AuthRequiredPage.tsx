import React, { useEffect } from "react";
import { Box, Heading, Text, Button, VStack, HStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const AuthRequiredPage: React.FC = () => {
    const { user } = useUser();
    console.log("AuthRequiredPage rendered, user:", user);
    const navigate = useNavigate();

    useEffect(() => {
        // if already authenticated, send user back to home
        if (user) navigate("/", { replace: true });
    }, [user, navigate]);

    return (
        <Box minH="70vh" display="flex" alignItems="center" justifyContent="center" px={4}>
            <VStack gap={6} textAlign="center" maxW="720px" w="100%">
                <Heading size="lg">Authentication required</Heading>
                <Text color="gray.500">
                    You need to be signed in to access this page. Please sign in or create an account to continue.
                </Text>

                <HStack gap={4}>
                    <Button colorScheme="teal" onClick={() => navigate("/login")}>
                        Login Page
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("/")}>
                        Back to home
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
};

export default AuthRequiredPage;