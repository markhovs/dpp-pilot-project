import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Tbody,
  Tr,
  Td,
  Th,
  TableContainer,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { MdCircle, MdLayers } from 'react-icons/md';
import { DPPSection } from '../../../types/dpp';
import DynamicFieldsRenderer from '../renderers/DynamicFieldsRenderer';
import { getFirstLangValue } from '../../../utils/dpp';
import AdditionalDataSection from '../AdditionalDataSection';

// Define interfaces for materials section data
interface MaterialComponent {
  id?: string;
  type?: string;
  components?: MaterialComponent[];
  material?: Record<string, any>;
  description?: Array<{ text: string, language?: string }>;
  BulkCount?: { value: number | null } | null;
  modelType?: string;
  semanticId?: any;
  globalAssetId?: string;
  [key: string]: any;
}

interface MaterialsData {
  structure?: MaterialComponent;
  archeType?: string;
  recycling?: {
    recyclable?: boolean;
    materials?: Array<{ name: string; value: string }>;
  };
  additionalData?: Record<string, any>;
}

interface MaterialsSectionProps {
  section: DPPSection & { data?: { data?: MaterialsData } };
  developerMode: boolean;
  setSelectedImage?: (url: string | null) => void;
  setSelectedPdf?: (url: string | null) => void;
  setSelectedDocument?: (doc: any | null) => void;
}

const MaterialsSection: React.FC<MaterialsSectionProps> = ({ section, developerMode }) => {
  // Fix data access to match API response structure
  const sectionData = section?.data || {};
  const data = sectionData.data || {} as MaterialsData;
  const { structure = {}, archeType = '', recycling = {}, additionalData } = data;

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Add debug logging
  console.log('Materials Section Data:', {
    rawSection: section,
    sectionData,
    structure,
    archeType,
    recycling,
  });

  // Recursively render a component and its subcomponents
  const renderComponentStructure = (component: MaterialComponent | null, level = 0) => {
    if (!component) return null;

    // Extract needed properties separately from technical metadata
    const {
      id,
      type,
      components = [],
      material = {},
      description = [],
      BulkCount, // Extract BulkCount explicitly
      // Extract these specifically so they don't end up in otherProps
      modelType,
      semanticId,
      globalAssetId,
      // Get remaining props
      ...otherProps
    } = component;

    // Create a simplified displayProps object with non-technical fields
    const displayProps = { ...otherProps };

    // Handle BulkCount specially - always include it even if null
    if (BulkCount !== undefined) {
      // Always display "-" for null, undefined or missing value property
      const bulkCountValue =
        BulkCount?.value !== undefined && BulkCount.value !== null ? BulkCount.value : '-';

      displayProps.BulkCount = bulkCountValue;
    }

    // Improved function to get display value from a property object
    const getPropertyDisplayValue = (prop: any) => {
      // If it's not an object, just return it directly
      if (typeof prop !== 'object' || prop === null) {
        return String(prop);
      }

      // If it has a value property, use that
      if (prop.value !== undefined) {
        return prop.value === null ? '-' : String(prop.value);
      }

      // For other objects, try to extract a meaningful representation
      if (Object.keys(prop).length === 0) {
        return '-';
      }

      // For complex objects with no direct value, use DynamicFieldsRenderer
      return <DynamicFieldsRenderer data={prop} level={1} maxDepth={2} />;
    };

    return (
      <Box key={id} pl={level > 0 ? 4 : 0} mb={2}>
        <Accordion allowToggle defaultIndex={level === 0 ? [0] : undefined}>
          <AccordionItem border='none'>
            <AccordionButton
              bg={headerBg}
              borderRadius='md'
              _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
            >
              <Box flex='1' textAlign='left'>
                <HStack>
                  <Text fontWeight='medium'>{id}</Text>
                  {type && <Badge colorScheme='blue'>{type}</Badge>}
                </HStack>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pt={4}>
              {/* Description */}
              {description.length > 0 && (
                <Box mb={4}>
                  <Heading size='sm' mb={2}>
                    Description
                  </Heading>
                  {description.map((desc: any, index: number) => (
                    <Text key={index}>{desc.text}</Text>
                  ))}
                </Box>
              )}

              {/* Material information */}
              {material && Object.keys(material).length > 0 && (
                <Box mb={4}>
                  <Heading size='sm' mb={2}>
                    Material Composition
                  </Heading>
                  <TableContainer>
                    <Table variant='simple' size='sm'>
                      <Tbody>
                        {Object.entries(material).map(([key, value]) => (
                          <Tr key={key}>
                            <Th width='30%'>{key}</Th>
                            <Td>
                              {/* Fix: Handle null values by converting to undefined */}
                              {typeof value === 'object'
                                ? getFirstLangValue(value === null ? undefined : value)
                                : String(value)}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Other properties - improved rendering */}
              {Object.keys(displayProps).length > 0 && (
                <Box mb={4}>
                  <Heading size='sm' mb={2}>
                    Properties
                  </Heading>
                  <TableContainer>
                    <Table variant='simple' size='sm'>
                      <Tbody>
                        {Object.entries(displayProps).map(([key, value]) => (
                          <Tr key={key}>
                            <Th width='30%'>{key}</Th>
                            <Td>{value === null ? 'None' : getPropertyDisplayValue(value)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Technical details - only in developer mode */}
              {developerMode && (
                <Box mb={4}>
                  <Heading size='sm' mb={2}>
                    Technical Details
                  </Heading>
                  {/* Use DynamicFieldsRenderer for technical metadata */}
                  <DynamicFieldsRenderer
                    data={{
                      modelType,
                      semanticId,
                      globalAssetId,
                    }}
                    developerMode={true}
                  />
                </Box>
              )}

              {/* Sub-components */}
              {components && components.length > 0 && (
                <Box>
                  <Heading size='sm' mb={2}>
                    Sub-Components
                  </Heading>
                  {components.map((subComponent: MaterialComponent) =>
                    renderComponentStructure(subComponent, level + 1)
                  )}
                </Box>
              )}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>
    );
  };

  return (
    <VStack spacing={6} align='stretch'>
      {/* Material Structure */}
      {Object.keys(structure).length > 0 && (
        <Box
          p={5}
          shadow='md'
          borderWidth='1px'
          borderColor={borderColor}
          borderRadius='lg'
          bg={cardBg}
        >
          <HStack mb={4} spacing={2} pb={2} borderBottom='1px solid' borderColor={borderColor}>
            <Icon as={MdLayers} color='teal.500' />
            <Heading size='md'>Component Structure</Heading>
          </HStack>
          {renderComponentStructure(structure as MaterialComponent)}
        </Box>
      )}

      {/* Arche Type */}
      {archeType && (
        <Box
          p={5}
          shadow='md'
          borderWidth='1px'
          borderColor={borderColor}
          borderRadius='lg'
          bg={cardBg}
        >
          <Heading size='md' mb={4}>
            Archetype
          </Heading>
          <Text>{archeType}</Text>
        </Box>
      )}

      {/* Recycling Information */}
      {recycling && Object.keys(recycling).length > 0 && (
        <Box
          p={5}
          shadow='md'
          borderWidth='1px'
          borderColor={borderColor}
          borderRadius='lg'
          bg={cardBg}
        >
          <Heading size='md' mb={4}>
            Recycling Information
          </Heading>

          <HStack mb={4}>
            <Text fontWeight='bold'>Recyclable:</Text>
            {recycling.recyclable ? (
              <Badge colorScheme='green'>Yes</Badge>
            ) : (
              <Badge colorScheme='red'>No</Badge>
            )}
          </HStack>

          {recycling.materials && recycling.materials.length > 0 && (
            <Box>
              <Heading size='sm' mb={2}>
                Recyclable Materials
              </Heading>
              <List spacing={2}>
                {recycling.materials.map((material: any, index: number) => (
                  <ListItem key={index}>
                    <ListIcon as={MdCircle} color='green.500' />
                    {material.name}: {material.value}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      )}

      {/* Developer Mode - Additional Data */}
      {developerMode && additionalData && <AdditionalDataSection additionalData={additionalData} />}
    </VStack>
  );
};

export default MaterialsSection;
