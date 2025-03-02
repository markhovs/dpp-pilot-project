import React from 'react';
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import AdditionalDataSection from '../AdditionalDataSection';

interface GenericSectionProps {
  title: string;
  data: any;
  developerMode?: boolean;
  setSelectedImage?: (url: string | null) => void;
  setSelectedPdf?: (url: string | null) => void;
  setSelectedDocument?: (doc: any | null) => void;
}

const GenericSection: React.FC<GenericSectionProps> = ({
  title,
  data,
  developerMode = false,
}) => {
  // Colors
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const messageColor = useColorModeValue('gray.500', 'gray.400');
  const accordionBg = useColorModeValue('gray.50', 'gray.700');

  console.log("Generic section data:", data);

  // More robust empty check
  const isEmpty = !data || (typeof data === 'object' && Object.keys(data).length === 0);

  if (isEmpty) {
    return (
      <Box>
        <Heading size="lg" mb={4}>{title}</Heading>
        <Text color={messageColor}>No data available for this section.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={4}>{title}</Heading>
      <Text color={textColor} whiteSpace="pre-wrap" mb={4}>
        This section contains data that doesn't have a specialized viewer.
      </Text>

      {/* Always show data in dev mode */}
      {developerMode && (
        <Accordion defaultIndex={[0]} allowMultiple>
          <AccordionItem border="1px solid" borderColor="gray.200" borderRadius="md">
            <h2>
              <AccordionButton bg={accordionBg} _hover={{ bg: 'gray.100' }}>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  Section Data
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pt={4}>
              {/* Only pass the additionalData prop which is expected by AdditionalDataSection */}
              <AdditionalDataSection additionalData={data} />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}
    </Box>
  );
};

export default GenericSection;
