import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FiEdit, FiTrash, FiEye } from "react-icons/fi"

import EditUser from "../Admin/EditUser"
import EditItem from "../Items/EditItem"
import EditAAS from "../AAS/EditAAS"
import Delete from "./DeleteAlert"

// Define a flexible type for ActionsMenu props
interface ActionsMenuProps<T extends { id: string }> {
  type: "User" | "Item" | "AAS" // Extend as needed
  value: T
  disabled?: boolean
}

// Map entity types to their respective Edit components
const editComponents: Record<ActionsMenuProps<any>["type"], React.FC<any> | undefined> = {
  User: EditUser,
  Item: EditItem,
  AAS: EditAAS,
}

const ActionsMenu = <T extends { id: string }>({ type, value, disabled }: ActionsMenuProps<T>) => {
  const editModal = useDisclosure()
  const deleteModal = useDisclosure()

  const EditComponent = editComponents[type] // Now TypeScript recognizes it can be undefined

  return (
    <>
      <Menu>
        <MenuButton
          isDisabled={disabled}
          as={Button}
          rightIcon={<BsThreeDotsVertical />}
          variant="unstyled"
        />
        <MenuList>
          {type === "AAS" && (
            <MenuItem
              as={Link}
              to={`/aas/${value.id}`}
              icon={<FiEye fontSize="16px" />}
            >
              View Instance
            </MenuItem>
          )}
          {EditComponent && (
            <MenuItem onClick={editModal.onOpen} icon={<FiEdit fontSize="16px" />}>
              Edit {type}
            </MenuItem>
          )}
          <MenuItem
            onClick={deleteModal.onOpen}
            icon={<FiTrash fontSize="16px" />}
            color="ui.danger"
          >
            Delete {type}
          </MenuItem>
        </MenuList>

        {/* Render correct Edit component dynamically */}
        {EditComponent && (
          <EditComponent
            isOpen={editModal.isOpen}
            onClose={editModal.onClose}
            {...(type === "User"
              ? { user: value }
              : type === "Item"
              ? { item: value }
              : { aas: value })}
          />
        )}

        {/* Render Delete Modal */}
        <Delete
          type={type}
          id={value.id}
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
        />
      </Menu>
    </>
  )
}

export default ActionsMenu
