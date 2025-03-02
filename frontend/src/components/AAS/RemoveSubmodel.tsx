import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  Text,
  Box,
  Checkbox,
  Divider,
  Badge,
  useDisclosure,
  ButtonGroup,
  HStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";

import { AasService } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";

// Better type definition for submodels
interface Submodel {
  id: string;
  idShort: string;
  description?: Array<{ language: string; text: string }>;
}

interface RemoveSubmodelProps {
  aasId: string;
  submodels: Submodel[];
}

export default function RemoveSubmodel({ aasId, submodels }: RemoveSubmodelProps) {
  const queryClient = useQueryClient();
  const [selectedSubmodels, setSelectedSubmodels] = useState<string[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const showToast = useCustomToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const mutation = useMutation({
    mutationFn: () =>
      Promise.all(
        selectedSubmodels.map((submodelId) =>
          AasService.removeSubmodel({ aasId, submodelId })
        )
      ),
    onSuccess: () => {
      // Invalidate the correct query key for AAS details
      queryClient.invalidateQueries({ queryKey: ["aasDetails", aasId] });
      // Also invalidate the general AAS list query
      queryClient.invalidateQueries({ queryKey: ["aas"] });

      showToast("Success!", "Submodels removed.", "success");
      setSelectedSubmodels([]); // Reset selection
      onClose();
    },
    onError: () => {
      showToast("Error", "Failed to remove submodels.", "error");
    },
  });

  const handleConfirmRemove = () => {
    mutation.mutate();
    setIsConfirmOpen(false);
  };

  return (
    <>
      <Button
        onClick={onOpen}
        variant="danger"
        leftIcon={<DeleteIcon />}
      >
        Remove Submodel
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent
          maxW="800px"
          bg={useColorModeValue("ui.light", "ui.darkSlate")}
        >
          <ModalHeader>Remove Submodels</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4} color="gray.400">
              Select the submodels you want to remove. This action cannot be undone.
            </Text>
            <VStack align="stretch" spacing={3}>
              {submodels.map((sub) => (
                <Box
                  key={sub.id}
                  p={3}
                  borderWidth={1}
                  borderRadius="md"
                  borderColor="gray.600"
                  bg="gray.700"
                >
                  <Checkbox
                    isChecked={selectedSubmodels.includes(sub.id)}
                    onChange={() =>
                      setSelectedSubmodels((prev) =>
                        prev.includes(sub.id)
                          ? prev.filter((id) => id !== sub.id)
                          : [...prev, sub.id]
                      )
                    }
                  >
                    <Box ml={2} width="100%">
                      <HStack spacing={2} flexWrap="wrap" mb={1}>
                        <Text fontWeight="medium" minW="fit-content">{sub.idShort}</Text>
                        <Badge size="sm" colorScheme="gray" fontSize="xs">
                          {sub.id}
                        </Badge>
                      </HStack>
                      <Text
                        fontSize="sm"
                        color="gray.400"
                        noOfLines={2}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        width="100%"
                      >
                        {sub.description?.find((d: any) => d.language === "en")?.text || "No description"}
                      </Text>
                    </Box>
                  </Checkbox>
                </Box>
              ))}
            </VStack>
          </ModalBody>
          <Divider />
          <ModalFooter>
            <ButtonGroup>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => setIsConfirmOpen(true)} // Open confirmation instead of direct mutation
                isLoading={mutation.isPending}
                isDisabled={selectedSubmodels.length === 0}
                leftIcon={<DeleteIcon />}
              >
                Remove Selected
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={useColorModeValue("ui.light", "ui.darkSlate")}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Submodel Removal
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text color="gray.300" mb={4}>
                Removing the selected submodels will delete their instances completely.
                All stored data and references will be permanently lost.
              </Text>
              <Text color="red.300" fontWeight="bold">
                This action cannot be undone.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <ButtonGroup>
                <Button variant="ghost" ref={cancelRef} onClick={() => setIsConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmRemove}
                  isLoading={mutation.isPending}
                >
                  Yes, Remove
                </Button>
              </ButtonGroup>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
