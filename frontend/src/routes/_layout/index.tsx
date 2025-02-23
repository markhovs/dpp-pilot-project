import {
  Container,
  Heading,
  SkeletonText,
  Text,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  IconButton,
  VStack,
  Box,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { FiEye } from "react-icons/fi";

import { AasService, type UserPublic } from "../../client"
import ActionsMenu from "../../components/Common/ActionsMenu"
import Navbar from "../../components/Common/Navbar"
import AddAAS from "../../components/AAS/AddAAS"

type AasItem = {
  id: string
  assetInformation?: { globalAssetId?: string }
  displayName?: { text: string; language: string }[]
  description?: { text: string; language: string }[]
  submodels?: { keys: { type: string; value: string }[]; type: string }[]
}

type AasActionMenuType = {
  id: string
  globalAssetId: string
  displayName: string
  description: string
  submodelCount: number
}

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function getAasQueryOptions() {
  return {
    queryFn: async (): Promise<AasActionMenuType[]> => {
      const response = (await AasService.listAllAas()) as AasItem[]

      if (!Array.isArray(response)) {
        console.error("Invalid response format:", response)
        return []
      }

      return response.map((aas) => ({
        id: aas.id,
        globalAssetId: aas.assetInformation?.globalAssetId ?? "N/A",
        displayName:
          aas.displayName?.find((d) => d.language === "en")?.text ?? "Unnamed AAS",
        description:
          aas.description?.find((d) => d.language === "en")?.text ?? "No Description",
        submodelCount: aas.submodels?.length ?? 0,
      }))
    },
    queryKey: ["aas"],
  }
}

function AasTable() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);
  const { data: aasList, isPending } = useQuery<AasActionMenuType[]>(
    getAasQueryOptions()
  )

  return (
    <TableContainer>
      <Table size={{ base: "sm", md: "md" }}>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Global Asset ID</Th>
            <Th>Display Name</Th>
            <Th>Submodels</Th>
            <Th>{currentUser?.is_superuser ? 'Actions' : 'View'}</Th>
          </Tr>
        </Thead>
        {isPending ? (
          <Tbody>
            <Tr>
              {new Array(5).fill(null).map((_, index) => (
                <Td key={index}>
                  <SkeletonText noOfLines={1} paddingBlock="16px" />
                </Td>
              ))}
            </Tr>
          </Tbody>
        ) : (
<Tbody>
  {aasList?.map((aas) => (
    <Tr key={aas.id} _hover={{ bg: "transparent" }} _focus={{ outline: "none" }}>
      <Td isTruncated maxWidth="300px">
        <Text
          as={Link}
          to={`/aas/${aas.id}`}
          _hover={{ textDecoration: "underline", color: "blue.500" }}
        >
          {aas.id}
        </Text>
      </Td>
      <Td isTruncated maxWidth="200px">{aas.globalAssetId}</Td>
      <Td isTruncated maxWidth="200px">{aas.displayName}</Td>
      <Td>{aas.submodelCount}</Td>
      <Td>
        {currentUser?.is_superuser ? (
          <ActionsMenu type="AAS" value={aas} />
        ) : (
          <IconButton
            as={Link}
            to={`/aas/${aas.id}`}
            icon={<FiEye />}
            aria-label="View Instance"
            variant="ghost"
            size="sm"
          />
        )}
      </Td>
    </Tr>
  ))}
</Tbody>
        )}
      </Table>
    </TableContainer>
  )
}

function Dashboard() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);

  return (
    <Container maxW="full">
      <VStack align="stretch" spacing={8}>
        <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
          AAS Management
        </Heading>

        <Box>
          {currentUser?.is_superuser && <Navbar type="AAS" addModalAs={AddAAS} />}
          <Box mt={6}>
            <AasTable />
          </Box>
        </Box>
      </VStack>
    </Container>
  );
}
