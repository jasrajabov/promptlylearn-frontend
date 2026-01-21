import React from 'react';
import {
  Box,
  Button,
  HStack,
  Text,
  VStack,
  IconButton,
} from '@chakra-ui/react';
import { X, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useColorModeValue } from './ui/color-mode';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = React.useState(false);

  const bgColor = useColorModeValue('teal.50', 'teal.900');
  const borderColor = useColorModeValue('teal.200', 'teal.700');
  const textColor = useColorModeValue('teal.900', 'teal.50');

  React.useEffect(() => {
    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (!accepted) {
      setDismissed(true);
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isInstallable || dismissed) {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom={4}
      left="50%"
      transform="translateX(-50%)"
      zIndex={1000}
      maxW="500px"
      w={{ base: "90%", sm: "auto" }}
    >
      <Box
        bg={bgColor}
        border="2px solid"
        borderColor={borderColor}
        borderRadius="xl"
        boxShadow="lg"
        p={4}
      >
        <HStack justify="space-between" align="start" gap={3}>
          <VStack align="start" gap={2} flex={1}>
            <HStack gap={2}>
              <Box
                bg={useColorModeValue('white', 'gray.800')}
                p={2}
                borderRadius="md"
              >
                <Download size={24} color="#14b8a6" />
              </Box>
              <Text fontWeight="bold" fontSize="lg" color={textColor}>
                Install PromptlyLearn
              </Text>
            </HStack>
            <Text fontSize="sm" color={textColor}>
              Get quick access and work offline. Install our app for the best experience!
            </Text>
            <HStack gap={2} w="100%">
              <Button
                colorScheme="teal"
                size="sm"
                onClick={handleInstall}
                flex={1}
              >
                Install
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                color={textColor}
              >
                Not now
              </Button>
            </HStack>
          </VStack>
          <IconButton
            aria-label="Close install prompt"
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            color={textColor}
          >
            <X size={20} />
          </IconButton>
        </HStack>
      </Box>
    </Box>
  );
};
