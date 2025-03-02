import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Image,
  Box,
  Button,
  HStack,
  Link,
  useColorModeValue
} from "@chakra-ui/react";
import { MdFileDownload } from "react-icons/md";

interface ImageViewerModalProps {
  selectedImage: string | null;
  onClose: () => void;
  altText?: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  selectedImage,
  onClose,
  altText
}) => {
  if (!selectedImage) return null;

  // Extract filename from URL for display
  const filename = selectedImage.split('/').pop() || 'image';

  return (
    <Modal isOpen={!!selectedImage} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent bg={useColorModeValue("white", "gray.800")} overflow="hidden">
        <ModalHeader>{altText || filename}</ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0}>
          <Box
            position="relative"
            maxH="80vh"
            overflow="auto"
            p={4}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Image
              src={selectedImage}
              alt={altText || filename}
              maxW="100%"
              objectFit="contain"
            />
          </Box>

          <Box p={4} bg={useColorModeValue("gray.50", "gray.700")}>
            <HStack justifyContent="flex-end">
              <Button
                as={Link}
                href={selectedImage}
                download
                leftIcon={<MdFileDownload />}
                colorScheme="blue"
                size="sm"
              >
                Download
              </Button>
            </HStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImageViewerModal;
