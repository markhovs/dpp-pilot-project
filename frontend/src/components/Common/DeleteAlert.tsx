import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import React from "react"
import { useForm } from "react-hook-form"

import { UsersService, AasService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"

interface DeleteProps {
  type: "User" | "AAS"
  id: string
  isOpen: boolean
  onClose: () => void
}

const Delete = ({ type, id, isOpen, onClose }: DeleteProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const cancelRef = React.useRef<HTMLButtonElement | null>(null)
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const deleteEntity = async (id: string) => {
    if (type === "User") {
      await UsersService.deleteUser({ userId: id })
    } else if (type === "AAS") {
      await AasService.deleteAas({ aasId: id })
    } else {
      throw new Error(`Unexpected type: ${type}`)
    }
  }

  const mutation = useMutation({
    mutationFn: deleteEntity,
    onSuccess: () => {
      showToast(
        "Success",
        `The ${type.toLowerCase()} was deleted successfully.`,
        "success"
      )
      onClose()
    },
    onError: () => {
      showToast(
        "An error occurred.",
        `An error occurred while deleting the ${type.toLowerCase()}.`,
        "error"
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [type === "User" ? "users" : "aas"],
      })
    },
  })

  const onSubmit = async () => {
    mutation.mutate(id)
  }

  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      leastDestructiveRef={cancelRef}
      size={{ base: "sm", md: "md" }}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <AlertDialogHeader>Delete {type}</AlertDialogHeader>

          <AlertDialogBody>
            {type === "User" && (
              <span>
                This user will be{" "}
                <strong>permanently deleted. </strong>
              </span>
            )}
            {type === "AAS" && (
              <span>
                This AAS and its submodels will be{" "}
                <strong>permanently deleted.</strong>
              </span>
            )}
            Are you sure? You will not be able to undo this action.
          </AlertDialogBody>

          <AlertDialogFooter gap={3}>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>
              Delete
            </Button>
            <Button ref={cancelRef} onClick={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}

export default Delete
