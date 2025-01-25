import { ChakraProvider, Box, Flex, VStack, Text, Container } from "@chakra-ui/react";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ChakraProvider>
          <Container maxW="container.xl" px={4}>
            <Flex 
              as="nav" 
              py={4} 
              alignItems="center" 
              justifyContent="space-between" 
              flexWrap="wrap" 
              borderBottom="2px solid" 
              borderColor="gray.300" // Customize color as needed
            >
              <Box flexShrink={0} mr={8}>
                {/* Placeholder for logo */}
                <Box w="50px" h="50px" bg="gray.200" display="flex" alignItems="center" justifyContent="center">
                  <Text fontSize="xs">Logo</Text>
                </Box>
              </Box>
              <VStack spacing={1} align="center" flex="1">
                <Text fontSize={["xl", "2xl", "3xl"]} fontWeight="bold" textAlign="center">
                  SWAMIYE SARANAM AYYAPPA
                </Text>
                <Text fontSize={["sm", "md"]} textAlign="center">
                  Uttara Sabarimalai Dharma Saastha Temple, Kharkai Link,
                </Text>
                <Text fontSize={["sm", "md"]} textAlign="center">
                  Bistupur, Jamshedpur-1
                </Text>
              </VStack>
            </Flex>
          </Container>
          <Box as="main">
            {children}
          </Box>
        </ChakraProvider>
      </body>
    </html>
  );
}
