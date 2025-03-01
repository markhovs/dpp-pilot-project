import {
  Box, Text, Link, Image, VStack, HStack, Icon, Button, useColorModeValue
} from "@chakra-ui/react";
import {
  MdFileDownload, MdOpenInNew, MdPictureAsPdf, MdImage, MdOutlineDescription,
  MdSlideshow, MdVideoLibrary, MdAudioFile, MdOutlineStickyNote2
} from "react-icons/md";
import { getFileType } from "../../../utils/dpp";

interface FileRendererProps {
  fileUrl: string;
  contentType?: string;
  caption?: string;
  thumbnail?: string;
  onViewPdf?: (url: string) => void;
  onViewImage?: (url: string) => void;
  onViewDocument?: (doc: any) => void;
}

const FileRenderer: React.FC<FileRendererProps> = ({
  fileUrl,
  contentType,
  caption,
  thumbnail,
  onViewPdf,
  onViewImage,
  onViewDocument
}) => {
  if (!fileUrl) return null;

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const fileType = getFileType(fileUrl, contentType);
  const fileName = fileUrl.split('/').pop() || "file";

  // Get appropriate icon based on file type
  const getFileIcon = () => {
    switch (fileType) {
      case 'pdf': return MdPictureAsPdf;
      case 'image': return MdImage;
      case 'document': return MdOutlineDescription;
      case 'spreadsheet': return MdOutlineStickyNote2;
      case 'presentation': return MdSlideshow;
      case 'video': return MdVideoLibrary;
      case 'audio': return MdAudioFile;
      default: return MdOutlineStickyNote2;
    }
  };

  // Handle file click based on file type
  const handleFileClick = (e: React.MouseEvent) => {
    e.preventDefault();

    switch (fileType) {
      case 'pdf':
        if (onViewPdf) onViewPdf(fileUrl);
        break;
      case 'image':
        if (onViewImage) onViewImage(fileUrl);
        break;
      default:
        if (onViewDocument) {
          onViewDocument({
            file: fileUrl,
            contentType,
            title: caption || fileName
          });
        } else {
          // Fallback to open in new tab if no handler provided
          window.open(fileUrl, '_blank');
        }
        break;
    }
  };

  // Display thumbnails for images
  const shouldShowThumbnail = thumbnail || (fileType === 'image' && fileUrl);

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
      bg={cardBg}
      overflow="hidden"
      position="relative"
    >
      {/* Thumbnail area */}
      {shouldShowThumbnail ? (
        <Box
          height="120px"
          position="relative"
          overflow="hidden"
          cursor="pointer"
          onClick={handleFileClick}
        >
          <Image
            src={thumbnail || fileUrl}
            alt={caption || fileName}
            objectFit="cover"
            width="100%"
            height="100%"
          />
          {fileType !== 'image' && (
            <Box
              position="absolute"
              top="0"
              right="0"
              bg="blackAlpha.700"
              color="white"
              py={1}
              px={2}
              borderBottomLeftRadius="md"
            >
              <Icon as={getFileIcon()} />
            </Box>
          )}
        </Box>
      ) : (
        <Box
          height="80px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={useColorModeValue("gray.50", "gray.700")}
        >
          <Icon as={getFileIcon()} fontSize="3xl" />
        </Box>
      )}

      {/* File information */}
      <VStack spacing={1} p={3} align="stretch">
        <Text fontWeight="medium" noOfLines={1}>{caption || fileName}</Text>

        <HStack spacing={2} mt={1}>
          <Button
            size="xs"
            variant="outline"
            leftIcon={<MdOpenInNew />}
            flex={1}
            onClick={handleFileClick} // Fixing this to directly use the handler
          >
            View
          </Button>

          <Button
            as={Link}
            href={fileUrl}
            download={fileName}
            size="xs"
            variant="solid"
            colorScheme="blue"
            leftIcon={<MdFileDownload />}
          >
            Download
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default FileRenderer;
