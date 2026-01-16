import React, { useState } from "react";
import {
  Box,
  Heading,
  VStack,
  Text,
  HStack,
  Stack,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { FaCheck } from "react-icons/fa";

const PRODUCTS = [
  {
    id: "prod_monthly",
    name: "Monthly Plan",
    price: 29,
    description: "Billed monthly • Cancel anytime",
    features: ["Full platform access", "Priority support", "Cancel anytime"],
  },
  {
    id: "prod_yearly",
    name: "Yearly Plan",
    price: 290,
    description: "Billed yearly • Save 20%",
    badge: "Best Value",
    features: ["Full platform access", "Priority support", "2 months free"],
  },
];

export function PaymentProducts(): React.ReactElement {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  return (
    <Box p={8}>
      <Stack direction={{ base: "column", md: "row" }} gap={4}>
        {PRODUCTS.map((product) => (
          <Box
            key={product.id}
            as="button"
            onClick={() => setSelectedProduct(product.id)}
            flex={1}
            position="relative"
            textAlign="left"
            p={6}
            borderRadius="xl"
            borderWidth="2px"
            borderColor={
              selectedProduct === product.id ? "teal.600" : "gray.200"
            }
            // bg={selectedProduct === product.id ? "blue.50" : "white"}
            _hover={{
              borderColor:
                selectedProduct === product.id ? "teal.600" : "gray.300",
              shadow: "sm",
            }}
            transition="all 0.2s"
          >
            {product.badge && (
              <Badge
                position="absolute"
                top={4}
                right={4}
                colorScheme="green"
                size="sm"
              >
                {product.badge}
              </Badge>
            )}

            <VStack align="start" gap={4}>
              <Box>
                <Heading size="lg" mb={1}>
                  {product.name}
                </Heading>
                <HStack gap={1}>
                  <Text fontSize="3xl" fontWeight="bold">
                    ${product.price}
                  </Text>
                  <Text color="gray.600">
                    / {product.id.includes("monthly") ? "month" : "year"}
                  </Text>
                </HStack>
              </Box>

              <VStack align="start" gap={2}>
                {product.features.map((feature, idx) => (
                  <HStack key={idx} gap={2}>
                    <Icon color="blue.600" fontSize="lg">
                      <FaCheck />
                    </Icon>
                    <Text fontSize="sm">{feature}</Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Box>
        ))}
      </Stack>

      {selectedProduct && (
        <Box mt={6} pt={6} borderTopWidth="1px" borderColor="gray.200">
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Continue to payment details
          </Text>
        </Box>
      )}
    </Box>
  );
}
