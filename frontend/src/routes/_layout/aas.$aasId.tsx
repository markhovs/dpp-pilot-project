import { useParams, useNavigate, createFileRoute } from "@tanstack/react-router";
import useAasDetails from "../../hooks/useAasDetails";
import { Container, Heading, Text, Button, VStack, Box, Flex, Spacer, HStack, useDisclosure } from "@chakra-ui/react";
import SubmodelItem from "../../components/AAS/SubmodelItem";
import SubmodelActions from "../../components/AAS/SubmodelActions";
import QRCodeModal from "../../components/Common/QRCodeModal";
import { useQueryClient } from "@tanstack/react-query";
import type { UserPublic } from "../../client";
import { FiFileText, FiGrid } from "react-icons/fi";

const AasDetails = () => {
  const { aasId } = useParams({ from: "/aas/$aasId" });
  const { data: aas, isLoading, error } = useAasDetails(aasId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);
  const { isOpen: isQRModalOpen, onOpen: onQRModalOpen, onClose: onQRModalClose } = useDisclosure();

  // Get the full DPP URL including current hostname
  const dppUrl = `${window.location.origin}/dpp/${aasId}`;

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text color="red.500">Error loading AAS data</Text>;

  // Ensure `aas` is treated as an object
  const aasData = aas as Record<string, any>;

  // Debug: Log the data structure
  console.log("AAS data received:", aasData);

  // Better handling of display name data
  const displayName = aasData.displayName?.find((d: any) => d.language === "en")?.text
    || aasData.displayName?.[0]?.text
    || "Unnamed AAS";

  // Improved description extraction logic - handle both array and direct string formats
  let description = "";

  // If description is directly in the root (from API update)
  if (typeof aasData.description === 'string') {
    description = aasData.description;
  }
  // If description is in the nested language array format
  else if (Array.isArray(aasData.description) && aasData.description.length > 0) {
    const englishDesc = aasData.description.find((d: any) => d.language === "en");
    description = englishDesc?.text || aasData.description[0]?.text || "";
  }

  // Extract global asset ID with better fallback
  const globalAssetId = aasData.assetInformation?.globalAssetId || "N/A";

  // Special handling for test template with "urn:default:global" ID
  if (globalAssetId === "urn:default:global" && !description) {
    description = "Test AAS Template for Digital Product Passport demonstration";
  }

  // Debug: Log what we found
  console.log("Extracted description:", description);

  return (
    <Container maxW="full" py={6}>
      <Flex direction="column">
        <Button
          onClick={() => navigate({ to: "/" })}
          colorScheme="blue"
          mb={6}
          alignSelf="flex-start"
          size="md"
        >
          ← Back to Dashboard
        </Button>

        <Flex
          direction={{ base: "column", md: "row" }}
          alignItems={{ base: "flex-start", md: "center" }}
          mb={4}
          gap={3}
        >
          <Heading size="lg">{displayName}</Heading>
          <HStack spacing={2} ml={{ base: 0, md: 4 }}>
            <Button
              as="a"
              href={`/dpp/${aasId}`}
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<FiFileText />}
              colorScheme="teal"
              variant="outline"
              size="sm"
            >
              View Digital Product Passport
            </Button>
            <Button
              onClick={onQRModalOpen}
              leftIcon={<FiGrid />}
              colorScheme="purple"
              variant="outline"
              size="sm"
            >
              QR Code
            </Button>
          </HStack>
        </Flex>

        <Text fontSize="md" color="gray.600" mb={2}>
          Global Asset ID: {globalAssetId}
        </Text>

        {description ? (
          <Text fontSize="md" color="gray.500" mb={6}>
            {description}
          </Text>
        ) : (
          <Text fontSize="md" color="gray.400" mb={6} fontStyle="italic">
            No description available
          </Text>
        )}

        <Box mt={4}>
          <Flex alignItems="center" mb={3}>
            <Heading size="md">Submodels</Heading>
            <Spacer />
            {currentUser?.is_superuser && (
              <SubmodelActions
                aasId={aasId}
                submodels={aasData.submodels || []}
              />
            )}
          </Flex>
        </Box>

        <VStack spacing={4} align="stretch" mt={2}>
          {aasData.submodels?.map((submodel: unknown) => (
            <SubmodelItem
              key={(submodel as any).id}
              submodel={submodel}
              aasId={aasId}
              isSuperUser={currentUser?.is_superuser ?? false}
            />
          ))}
        </VStack>
      </Flex>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={onQRModalClose}
        dppUrl={dppUrl}
        title="Digital Product Passport QR Code"
      />
    </Container>
  );
};

export const Route = createFileRoute("/_layout/aas/$aasId")({
  component: AasDetails,
});

export default AasDetails;
