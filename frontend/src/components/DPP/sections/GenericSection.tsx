import React from 'react';
import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react';
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
  setSelectedImage,
  setSelectedPdf,
  setSelectedDocument
}) => {
  // Colors
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const messageColor = useColorModeValue('gray.500', 'gray.400');

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
      <Text color={textColor} whiteSpace="pre-wrap">
        This section contains data that doesn't have a specialized viewer.
      </Text>

      {/* Always show data in dev mode */}
      {developerMode && (
        <AdditionalDataSection
          additionalData={data}
          title="Section Data"
          defaultExpanded={true}
        />
      )}
    </Box>
  );
};

export default GenericSection;
