import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dppUrl: string;
  title?: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, dppUrl, title = "Digital Product Passport" }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  // Function to download QR code as PNG
  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `dpp-qrcode-${new Date().getTime()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} py={2}>
            <Box
              p={4}
              bg={bgColor}
              borderRadius="md"
              boxShadow="sm"
              display="flex"
              justifyContent="center"
            >
              <QRCodeCanvas
                id="qr-code"
                value={dppUrl}
                size={200}
                level="H"
                includeMargin={true}
              />
            </Box>
            <Text color={textColor} fontSize="sm" textAlign="center">
              Scan this QR code to access the Digital Product Passport directly on your mobile device
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={downloadQRCode}>
            Download QR Code
          </Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QRCodeModal;
