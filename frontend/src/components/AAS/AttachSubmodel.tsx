import {
  Button,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Checkbox,
  VStack,
  Text,
  Box,
  Divider,
  Badge,
  useDisclosure,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AddIcon } from "@chakra-ui/icons";
import { type SubmodelTemplate } from "../../types/aas";

import { AasService } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";

interface AttachSubmodelProps {
  aasId: string;
}

export default function AttachSubmodel({ aasId }: AttachSubmodelProps) {
  const queryClient = useQueryClient();
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const showToast = useCustomToast();

  const { data: templates, isLoading } = useQuery<SubmodelTemplate[]>({
    queryKey: ["submodelTemplates"],
    queryFn: async () => {
      const response = await AasService.listTemplates();
      return response as SubmodelTemplate[];
    }
  });

  const mutation = useMutation({
    mutationFn: () => AasService.attachSubmodels({
      aasId,
      requestBody: { template_ids: selectedTemplates }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aas", aasId] });
      showToast("Success!", "Submodels attached.", "success");
      setSelectedTemplates([]);
      onClose();
    },
    onError: () => {
      showToast("Error", "Failed to attach submodels.", "error");
    }
  });

  return (
    <>
      <Button
        onClick={onOpen}
        variant="primary"
        leftIcon={<AddIcon />}
      >
        Attach Submodel
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={useColorModeValue("ui.light", "ui.darkSlate")}>
          <ModalHeader>Attach Submodels</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner />
                <Text mt={2}>Loading templates...</Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={3}>
                {templates?.map((template) => (
                  <Box
                    key={template.template_id}
                    p={3}
                    borderWidth={1}
                    borderRadius="md"
                    borderColor="gray.600"
                    bg="gray.700"
                  >
                    <Checkbox
                      isChecked={selectedTemplates.includes(template.template_id)}
                      onChange={() => setSelectedTemplates((prev) =>
                        prev.includes(template.template_id)
                          ? prev.filter((id) => id !== template.template_id)
                          : [...prev, template.template_id]
                      )}
                    >
                      <VStack align="start" spacing={1} ml={2}>
                        <Text fontWeight="medium">{template.id_short}</Text>
                        <Text fontSize="sm" color="gray.400">
                          {template.description?.['en'] || Object.values(template.description)[0] || 'No description'}
                        </Text>
                        <Badge size="sm" colorScheme="blue">
                          {template.category}
                        </Badge>
                      </VStack>
                    </Checkbox>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <Divider />
          <ModalFooter>
            <ButtonGroup>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => mutation.mutate()}
                isLoading={mutation.isPending}
                isDisabled={selectedTemplates.length === 0}
              >
                Attach Selected
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
