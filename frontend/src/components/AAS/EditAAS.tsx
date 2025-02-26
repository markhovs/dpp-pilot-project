import React from "react"
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
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type AasUpdateAasMetadataData, type AASAssetMetadataUpdate, AasService, type ApiError } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils/core"

interface EditAASProps {
  aas: { id: string; globalAssetId?: string; displayName?: string; description?: string }
  isOpen: boolean
  onClose: () => void
}

const EditAAS: React.FC<EditAASProps> = ({ aas, isOpen, onClose }) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AASAssetMetadataUpdate>({
    mode: "onBlur",
    defaultValues: {
      global_asset_id: aas.globalAssetId || "",
      display_name: aas.displayName || "",
      description: aas.description || "",
    },
  })

  const mutation = useMutation({
    mutationFn: ({ aasId, requestBody }: AasUpdateAasMetadataData) =>
      AasService.updateAasMetadata({ aasId, requestBody }),
    onSuccess: () => {
      showToast("Success!", "AAS updated successfully.", "success")
      onClose()
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

  const onSubmit: SubmitHandler<AASAssetMetadataUpdate> = (data) => {
    // Filter out empty fields so that they are **not sent** if left empty
    const filteredData: AASAssetMetadataUpdate = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "")
    )

    mutation.mutate({ aasId: aas.id, requestBody: filteredData })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>Edit AAS</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <FormLabel htmlFor="globalAssetId">Global Asset ID</FormLabel>
            <Input id="globalAssetId" {...register("global_asset_id")} />
          </FormControl>

          <FormControl mt={4}>
            <FormLabel htmlFor="displayName">Display Name</FormLabel>
            <Input id="displayName" {...register("display_name")} />
          </FormControl>

          <FormControl mt={4}>
            <FormLabel htmlFor="description">Description</FormLabel>
            <Input id="description" {...register("description")} />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
          <Button onClick={onClose} ml={3}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EditAAS
