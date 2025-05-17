import { Box, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCircle = motion(Box);

const bounceTransition = {
  y: {
    duration: 0.6,
    repeat: Infinity,
    repeatType: 'reverse',
    ease: 'easeInOut',
  },
};

export default function LoadingScreen({ nome }) {
  return (
    <Box h="100vh" w="100vw" bg="#F7F9FC" display="flex" alignItems="center" justifyContent="center">
      <Box
        bg="white"
        p={10}
        px={12}
        borderRadius="2xl"
        boxShadow="0 8px 30px rgba(0, 0, 0, 0.1)"
      >
        <VStack spacing={6}>
          <Text fontSize="lg" fontWeight="medium" color="gray.600">
            👋 Bem-vindo de volta,
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="blue.700">
            {nome}!
          </Text>

          {/* Loader alternativo */}
            <Box display="flex" gap={4} mt={4}>
              {[0, 1, 2].map((i) => (
                <MotionCircle
                  key={i}
                  w="12px"
                  h="12px"
                  bg="blue.500"
                  borderRadius="full"
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: 'easeInOut',
                    delay: i * 0.3, // espaçamento mais claro entre as bolinhas
                  }}
                />
              ))}
            </Box>

        </VStack>
      </Box>
    </Box>
  );
}
