import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Flex,
  Image,
  Link,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { DppService } from "../client";
import DPPViewer from "../components/DPP/DPPViewer";

export const Route = createFileRoute("/dpp/$id")({
  component: PublicDPPExplorer,
  // Use TanStack Router's meta functionality instead of react-helmet-async
  meta: ({ params }) => [
    { title: `Digital Product Passport - ${params.id}` },
    { name: "description", content: "Digital Product Passport with sustainability and technical information" }
  ],
});

function PublicDPPExplorer() {
  const { id } = useParams({ from: "/dpp/$id" });
  const bgColor = useColorModeValue("white", "gray.800");

  const { data: dpp, isLoading, error } = useQuery({
    queryKey: ['dpp', id],
    queryFn: async () => {
      return await DppService.downloadCompleteDpp({
        aasId: id,
        includeRaw: false
      });
    },
    enabled: !!id,
    retry: 1
  });

  return (
    <Container maxW="1200px" py={8}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Digital Product Passport
            </Heading>
            {dpp && (
              <Text color="gray.500">
                Generated: {new Date(dpp.generated_at).toLocaleString()}
              </Text>
            )}
          </Box>

          {/* Logo */}
          <Link href="/" _hover={{ opacity: 0.8 }}>
            <Image
              src="/logo.png"
              alt="Application Logo"
              height="50px"
              objectFit="contain"
              fallbackSrc="https://via.placeholder.com/150x50?text=Logo"
            />
          </Link>
        </Flex>

        {isLoading ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" mb={4} />
            <Text>Loading Digital Product Passport...</Text>
          </Box>
        ) : error ? (
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="md"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Error Loading DPP
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              Failed to load the Digital Product Passport. It may not exist or the data may be incomplete.
              <Text mt={2}>
                Error details: {(error as Error).message}
              </Text>
            </AlertDescription>
          </Alert>
        ) : dpp ? (
          <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg={bgColor}
            boxShadow="sm"
          >
            <DPPViewer dpp={dpp} />
          </Box>
        ) : null}

        <Box mt={6} textAlign="center" fontSize="sm" color="gray.500">
          <Text>© 2023 Digital Product Passport Platform</Text>
        </Box>
      </VStack>
    </Container>
  );
}
