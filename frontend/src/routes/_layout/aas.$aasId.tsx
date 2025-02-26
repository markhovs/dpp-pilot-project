import { useParams, useNavigate, createFileRoute } from "@tanstack/react-router";
import useAasDetails from "../../hooks/useAasDetails";
import { Container, Heading, Text, Button, VStack, Box } from "@chakra-ui/react";
import SubmodelItem from "../../components/AAS/SubmodelItem";
import SubmodelActions from "../../components/AAS/SubmodelActions";
import { useQueryClient } from "@tanstack/react-query";
import type { UserPublic } from "../../client";

const AasDetails = () => {
  const { aasId } = useParams({ from: "/aas/$aasId" });
  const { data: aas, isLoading, error } = useAasDetails(aasId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text color="red.500">Error loading AAS data</Text>;

  // Ensure `aas` is treated as an object
  const aasData = aas as Record<string, any>;

  return (
    <Container maxW="full" py={6}> {/* Added padding for better spacing */}
      <Button onClick={() => navigate({ to: "/" })} colorScheme="blue" mb={6}>
        ← Back to Dashboard
      </Button>

      <Heading size="lg" mb={2}>{aasData.displayName?.[0]?.text ?? "Unnamed AAS"}</Heading>
      <Text fontSize="md" color="gray.600" mb={2}>
        Global Asset ID: {aasData.assetInformation?.globalAssetId ?? "N/A"}
      </Text>

      {aasData.description?.[0]?.text && (
        <Text fontSize="md" color="gray.500" mb={6}>
          {aasData.description[0].text}
        </Text>
      )}

      <Box>
        <Heading size="md" display="inline-block">Submodels</Heading>
        {currentUser?.is_superuser && (
          <SubmodelActions
            aasId={aasId}
            submodels={aasData.submodels || []}
          />
        )}
      </Box>

      <VStack spacing={4} align="stretch" mt={4}>
        {/* Fix: Explicitly type `submodel` as `unknown` or `any` */}
        {aasData.submodels?.map((submodel: unknown) => (
          <SubmodelItem
            key={(submodel as any).id}
            submodel={submodel}
            aasId={aasId}
            isSuperUser={currentUser?.is_superuser ?? false}
          />
        ))}
      </VStack>
    </Container>
  );
};

export const Route = createFileRoute("/_layout/aas/$aasId")({
  component: AasDetails,
});

export default AasDetails;
