import React, { useState } from "react"
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Checkbox,
  VStack,
  Box,
  Text,
  Collapse,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { type SubmodelTemplate } from "../../types/aas"
import { getTemplateDescription } from "../../utils/aas"

import {
  type AASAssetCreateFromTemplatesRequest,
  AasService,
  type ApiError,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils/core"

interface AddAASProps {
  isOpen: boolean
  onClose: () => void
}

const AddAAS: React.FC<AddAASProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<AASAssetCreateFromTemplatesRequest>({
    mode: "onBlur",
    defaultValues: {
      template_ids: [],
      asset_data: {
        global_asset_id: "",
        display_name: "",
        description: "",
      },
    },
  })

  // Fetch available submodel templates
  const { data: templates, isLoading } = useQuery<SubmodelTemplate[]>({
    queryKey: ["submodelTemplates"],
    queryFn: async () => {
      const response = await AasService.listTemplates()
      return response as SubmodelTemplate[]
    },
  })

  const mutation = useMutation({
    mutationFn: (data: AASAssetCreateFromTemplatesRequest) =>
      AasService.createAas({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "AAS created successfully.", "success")
      onClose()
      setSelectedTemplates([]) // Reset selected templates
      queryClient.invalidateQueries({ queryKey: ["aas"] }) // Refresh AAS list
    },
    onError: (err: unknown) => {
      if ((err as ApiError).status) {
        handleError(err as ApiError, showToast)
      } else {
        console.error("Unexpected error:", err)
        showToast("Error", "An unexpected error occurred.", "error")
      }
    },
  })

  const onSubmit: SubmitHandler<AASAssetCreateFromTemplatesRequest> = (data) => {
    const filteredData: AASAssetCreateFromTemplatesRequest = {
      template_ids: selectedTemplates, // Attach selected templates
      asset_data: Object.fromEntries(
        Object.entries(data.asset_data || {}).filter(([_, value]) => value !== "")
      ), // Only send filled fields
    }
    mutation.mutate(filteredData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        bg={useColorModeValue("ui.light", "ui.darkSlate")}
      >
        <ModalHeader>Add AAS</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {/* Global Asset ID */}
          <FormControl>
            <FormLabel htmlFor="global_asset_id">Global Asset ID</FormLabel>
            <Input id="global_asset_id" {...register("asset_data.global_asset_id")} />
          </FormControl>

          {/* Display Name */}
          <FormControl mt={4}>
            <FormLabel htmlFor="display_name">Display Name</FormLabel>
            <Input id="display_name" {...register("asset_data.display_name")} />
          </FormControl>

          {/* Description */}
          <FormControl mt={4}>
            <FormLabel htmlFor="description">Description</FormLabel>
            <Input id="description" {...register("asset_data.description")} />
          </FormControl>

          {/* Submodel Templates Selection */}
          <FormControl mt={6}>
            <FormLabel>Submodel Templates</FormLabel>
            {isLoading ? (
              <Text>Loading templates...</Text>
            ) : (
              <VStack align="stretch" spacing={2}>
                {templates?.map((template) => (
                  <Box key={template.template_id} p={2} borderWidth="1px" borderRadius="md">
                    <Checkbox
                      isChecked={selectedTemplates.includes(template.template_id)}
                      onChange={(e) => {
                        setSelectedTemplates((prev) =>
                          e.target.checked
                            ? [...prev, template.template_id]
                            : prev.filter((id) => id !== template.template_id)
                        )
                      }}
                    >
                      {template.id_short}
                    </Checkbox>
                    <IconButton
                      aria-label="Expand Details"
                      size="xs"
                      icon={expandedTemplate === template.template_id ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      onClick={() => setExpandedTemplate(prev =>
                        prev === template.template_id ? null : template.template_id
                      )}
                      variant="ghost"
                      ml={2}
                    />
                    <Collapse in={expandedTemplate === template.template_id}>
                      <Box mt={2} pl={4}>
                        <Text fontSize="sm">
                          <strong>Category:</strong> {template.category}
                        </Text>
                        <Text fontSize="sm">
                          <strong>Template:</strong> {template.template_name}
                        </Text>
                        <Text fontSize="sm">
                          <strong>Description:</strong> {getTemplateDescription(template.description)}
                        </Text>
                      </Box>
                    </Collapse>
                  </Box>
                ))}
              </VStack>
            )}
          </FormControl>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
          >
            Save
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AddAAS
