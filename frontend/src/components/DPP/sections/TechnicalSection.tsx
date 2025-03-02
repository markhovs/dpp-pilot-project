import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  SimpleGrid,
  Badge,
  Image,
  Flex,
  Divider,
  Link,
  Code,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Tag,
  Spacer,
} from '@chakra-ui/react';
import {
  MdSettings,
  MdBadge,
  MdInfo,
  MdDescription,
  MdFilePresent,
  MdOpenInNew,
  MdOutlineInsertDriveFile,
  MdLabel,
} from 'react-icons/md';
import { DPPSection } from '../../../types/dpp';
import { getFirstLangValue, getNestedValue, isURL } from '../../../utils/dpp';
import DynamicFieldsRenderer from '../renderers/DynamicFieldsRenderer';
import AdditionalDataSection from '../AdditionalDataSection';

// Define interfaces for technical section data structure
interface PropertyValue {
  value?: any;
  contentType?: string;
  valueType?: string;
  modelType?: string;
  idShort?: string;
  description?: string | Record<string, string>;
  semanticId?: {
    keys?: Array<{ type: string; value: string }>;
    [key: string]: any;
  };
  [key: string]: any;
}

interface TechnicalSectionData {
  summary?: {
    productName?: string | Record<string, string>;
    manufacturer?: string;
    articleNumber?: string;
    orderCode?: string;
    productImage?: string;
    manufacturerLogo?: string;
    [key: string]: any;
  };
  generalInformation?: Record<string, PropertyValue>;
  technicalProperties?: Record<string, PropertyValue>;
  classifications?: {
    idShort?: string;
    description?: string | Record<string, string>;
    elements?: Record<string, PropertyValue>;
    [key: string]: any;
  };
  furtherInformation?: Record<string, PropertyValue>;
  additionalData?: Record<string, any>;
  [key: string]: any;
}

interface TechnicalSectionProps {
  section: DPPSection & { data: { data?: TechnicalSectionData } };
  developerMode: boolean;
  setSelectedImage?: (url: string) => void;
  setSelectedPdf?: (url: string) => void;
  setSelectedDocument?: (doc: any) => void;
}

const TechnicalSection: React.FC<TechnicalSectionProps> = ({
  section,
  developerMode,
  setSelectedImage,
  setSelectedPdf,
  setSelectedDocument,
}) => {
  // Make sure we have data to work with
  if (!section || !section.data) {
    console.error('TechnicalSection: No section or section.data available');
    return (
      <Box p={4}>
        <Text>No technical data available</Text>
      </Box>
    );
  }

  // Extract the data correctly
  const data = section.data.data || ({} as TechnicalSectionData);

  // Extract top-level sections - removing unused variables
  const {
    summary = {},
    generalInformation = {},
    technicalProperties = {},
    classifications = {},
    furtherInformation = {},
    additionalData = null,
  } = data || {};

  // UI theme variables
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const fileBg = useColorModeValue('blue.50', 'blue.900');
  const descriptionBg = useColorModeValue('gray.50', 'gray.700');

  // Get product image URL from either summary or general information
  const productImageUrl =
    summary.productImage || getNestedValue(generalInformation, 'ProductImage.value');

  // Helper function to render multilanguage values
  const renderMultiLangValue = (value: any) => {
    if (!value) return null;

    // If it's not an object or has no language keys, render directly
    if (typeof value !== 'object' || (!value.en && !value.de)) {
      return <Text>{String(value)}</Text>;
    }

    // Render multi-language
    return (
      <VStack align='start' spacing={1}>
        {Object.entries(value).map(([lang, text]) => (
          <HStack key={lang}>
            <Tag size='sm' colorScheme='blue' variant='subtle'>
              {lang}
            </Tag>
            <Text>{String(text)}</Text>
          </HStack>
        ))}
      </VStack>
    );
  };

  // Helper function to handle file or image click
  const handleFileOrImageClick = (url: string, type?: string) => {
    if (!url) return;

    if (type && type.startsWith('image/')) {
      setSelectedImage?.(url);
    } else if (type && type.includes('pdf')) {
      setSelectedPdf?.(url);
    } else if (setSelectedDocument) {
      setSelectedDocument({
        file: url,
        title: 'Document',
      });
    }
  };

  // Helper to render a file link or preview
  const renderFileLink = (url: string, contentType?: string) => {
    if (!url) return null;

    return (
      <Box
        p={3}
        bg={fileBg}
        borderRadius='md'
        cursor='pointer'
        onClick={() => handleFileOrImageClick(url, contentType)}
        _hover={{ opacity: 0.8 }}
      >
        <HStack>
          <Icon
            as={contentType?.startsWith('image/') ? MdFilePresent : MdOutlineInsertDriveFile}
            boxSize={5}
            color={contentType?.startsWith('image/') ? 'green.500' : 'blue.500'}
          />
          <Text fontWeight='medium' isTruncated maxW='300px'>
            {url.split('/').pop() || url}
          </Text>
          <Icon as={MdOpenInNew} color='blue.500' />
        </HStack>

        {contentType?.startsWith('image/') && (
          <Box mt={2}>
            <Image
              src={url}
              alt='Preview'
              height='100px'
              objectFit='contain'
              mx='auto'
              borderRadius='md'
            />
          </Box>
        )}
      </Box>
    );
  };

  // Enhanced property value renderer that handles complex objects with images, files, etc.
  const renderPropertyValue = (value: any) => {
    // Handle null/undefined
    if (value === null || value === undefined) return <Text color='gray.400'>—</Text>;

    // Add consistent value label
    return (
      <VStack align='start' spacing={1} width='100%'>
        <Text fontSize='sm' color={labelColor} mb={1}>
          Value
        </Text>
        {renderPropertyValueContent(value)}

        {/* Show semantic ID in developer mode */}
        {developerMode && value?.semanticId && (
          <Box mt={2}>
            <Text fontSize='sm' color={labelColor} mb={1}>
              Semantic ID
            </Text>
            <Code fontSize='sm' p={1} borderRadius='md'>
              {value.semanticId.keys?.[0]?.value || JSON.stringify(value.semanticId)}
            </Code>
          </Box>
        )}
      </VStack>
    );
  };

  // Helper to render the actual value content
  const renderPropertyValueContent = (value: any) => {
    // Handle simple string/number/boolean values
    if (typeof value !== 'object') {
      // Handle URLs specially
      if (typeof value === 'string' && isURL(value)) {
        return (
          <Link href={value} isExternal color='blue.500'>
            <HStack>
              <Text>{value}</Text>
              <Icon as={MdOpenInNew} />
            </HStack>
          </Link>
        );
      }
      return <Text fontWeight='medium'>{String(value)}</Text>;
    }

    // Handle null
    if (value === null) return <Text color='gray.400'>—</Text>;

    // Handle multi-language properties
    if (value.en || value.de) {
      return renderMultiLangValue(value);
    }

    // Handle files
    if (
      value.value &&
      (value.contentType || (typeof value.value === 'string' && isURL(value.value)))
    ) {
      return renderFileLink(value.value, value.contentType);
    }

    // Handle values with .value property
    if (value.value !== undefined) {
      return renderPropertyValueContent(value.value);
    }

    // For other complex objects, use DynamicFieldsRenderer
    return <DynamicFieldsRenderer data={value} developerMode={developerMode} />;
  };

  // Enhanced helper for showing descriptions
  const renderDescription = (description: any) => {
    if (!description) return null;

    let descText = '';
    if (typeof description === 'string') {
      descText = description;
    } else if (typeof description === 'object') {
      descText = getFirstLangValue(description);
    }

    if (!descText) return null;

    return (
      <Box mt={1} p={2} bg={descriptionBg} borderRadius='md' fontSize='sm'>
        <HStack align='flex-start' spacing={2}>
          <Icon as={MdInfo} color='blue.500' mt={0.5} />
          <Text>{descText}</Text>
        </HStack>
      </Box>
    );
  };

  // Helper to render property metadata (like model type, description)
  const renderPropertyMetadata = (property: PropertyValue | null | undefined) => {
    if (!property) return null;

    return (
      <VStack align='start' spacing={1} mt={1}>
        {property.modelType && (
          <HStack>
            <Badge size='sm' colorScheme='purple' variant='subtle'>
              {property.modelType}
            </Badge>
            {property.valueType && (
              <Badge size='sm' colorScheme='blue' variant='outline'>
                {property.valueType}
              </Badge>
            )}
          </HStack>
        )}

        {developerMode && property.idShort && (
          <Text fontSize='xs' color='gray.500'>
            ID: {property.idShort}
          </Text>
        )}
      </VStack>
    );
  };

  // Instead, just check if we have ANY data to render
  const hasData = Object.keys(data).length > 0;
  if (!hasData) {
    return (
      <Box p={5} shadow='md' borderRadius='md' bg={cardBg}>
        <Heading size='md' mb={4}>
          Technical Data
        </Heading>
        <Text>No technical data available for this product.</Text>
      </Box>
    );
  }

  // Update the card display templates for technical properties
  const renderPropertyCard = (key: string, property: PropertyValue, formattedKey: string) => {
    return (
      <Box
        key={key}
        borderWidth='1px'
        borderColor={borderColor}
        borderRadius='md'
        overflow='hidden'
      >
        <Box p={3} bg={headerBg}>
          <HStack>
            <Text fontWeight='medium'>{formattedKey}</Text>
            <Spacer />
            {renderPropertyMetadata(property)}
          </HStack>

          {/* Show ID info in developer mode */}
          {developerMode && property.idShort && (
            <Text fontSize='xs' mt={1} color='gray.500'>
              ID: {property.idShort}
            </Text>
          )}
        </Box>

        <Box p={3}>
          {renderPropertyValue(property)}
          {property.description && renderDescription(property.description)}
        </Box>

        {/* Show full semantic info in developer mode */}
        {developerMode && property.semanticId && (
          <Box
            p={3}
            bg={useColorModeValue('gray.100', 'gray.700')}
            borderTopWidth='1px'
            borderColor={borderColor}
          >
            <Text fontSize='xs' fontWeight='medium' mb={1}>
              Semantic Information
            </Text>
            <DynamicFieldsRenderer data={property.semanticId} developerMode={true} />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <VStack spacing={5} align='stretch'>
      {/* Product Overview Section */}
      <Box p={6} bg={cardBg} shadow='sm' borderRadius='lg'>
        <HStack mb={4} spacing={2} pb={2} borderBottom='1px solid' borderColor={borderColor}>
          <Icon as={MdLabel} color='teal.500' />
          <Heading size='md'>Product Overview</Heading>
        </HStack>

        <Flex gap={6} flexDirection={{ base: 'column', md: 'row' }}>
          {/* Left: Product Details */}
          <Box flex='1'>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {summary.productName && (
                <Box>
                  <Text fontSize='sm' color={labelColor} mb={1}>
                    Product Name
                  </Text>
                  {renderMultiLangValue(summary.productName)}
                </Box>
              )}

              {summary.manufacturer && (
                <Box>
                  <Text fontSize='sm' color={labelColor} mb={1}>
                    Manufacturer
                  </Text>
                  <Text fontWeight='medium'>{summary.manufacturer}</Text>
                </Box>
              )}

              {summary.articleNumber && (
                <Box>
                  <Text fontSize='sm' color={labelColor} mb={1}>
                    Article Number
                  </Text>
                  <Text fontWeight='medium'>{summary.articleNumber}</Text>
                </Box>
              )}

              {summary.orderCode && (
                <Box>
                  <Text fontSize='sm' color={labelColor} mb={1}>
                    Order Code
                  </Text>
                  <Text fontWeight='medium'>{summary.orderCode}</Text>
                </Box>
              )}
            </SimpleGrid>
          </Box>

          {/* Right: Product Image */}
          {productImageUrl && (
            <Box
              width={{ base: '100%', md: '250px' }}
              p={4}
              bg={useColorModeValue('gray.50', 'gray.700')}
              borderRadius='lg'
              display='flex'
              alignItems='center'
              justifyContent='center'
            >
              <Image
                src={productImageUrl}
                alt='Product'
                maxH='160px'
                cursor='pointer'
                onClick={() => setSelectedImage?.(productImageUrl)}
                borderRadius='md'
                objectFit='contain'
              />
            </Box>
          )}
        </Flex>
      </Box>

      {/* Technical Properties Section - Enhanced with descriptions */}
      {Object.keys(technicalProperties).length > 0 && (
        <Box p={6} bg={cardBg} shadow='sm' borderRadius='lg'>
          <HStack mb={4} spacing={2} pb={2} borderBottom='1px solid' borderColor={borderColor}>
            <Icon as={MdSettings} color='blue.500' />
            <Heading size='md'>Technical Properties</Heading>
          </HStack>

          <VStack spacing={4} align='stretch'>
            {Object.entries(technicalProperties).map(([key, property]) => {
              // Format the key for display
              const formattedKey = key
                .replace(/ID__/g, '')
                .replace(/__/g, '')
                .replace(/_/g, ' ')
                .split(/(?=[A-Z])/)
                .join(' ')
                .trim();

              return renderPropertyCard(key, property as PropertyValue, formattedKey);
            })}
          </VStack>
        </Box>
      )}

      {/* Classification Section - Enhanced with hierarchy */}
      {classifications && Object.keys(classifications).length > 0 && (
        <Box p={6} bg={cardBg} shadow='sm' borderRadius='lg'>
          <HStack mb={4} spacing={2} pb={2} borderBottom='1px solid' borderColor={borderColor}>
            <Icon as={MdBadge} color='purple.500' />
            <Heading size='md'>Classification</Heading>
            {classifications.idShort && (
              <Badge colorScheme='blue' variant='subtle'>
                {classifications.idShort}
              </Badge>
            )}
          </HStack>

          {/* Show classification description at the top level */}
          {classifications.description && renderDescription(classifications.description)}

          {/* Classification hierarchy */}
          <VStack mt={4} spacing={4} align='stretch'>
            {classifications.elements &&
              Object.entries(classifications.elements).map(([key, property]) => {
                // Format classification properties for display
                const formattedKey = key
                  .split(/(?=[A-Z])/)
                  .join(' ')
                  .trim();

                return renderPropertyCard(key, property, formattedKey);
              })}
          </VStack>

          {/* If no elements property is present, render the classification directly */}
          {!classifications.elements && (
            <Box mt={3}>
              <DynamicFieldsRenderer data={classifications} developerMode={developerMode} />
            </Box>
          )}
        </Box>
      )}

      {/* Further Information Section - Enhanced with descriptions */}
      {Object.keys(furtherInformation).length > 0 && (
        <Box p={6} bg={cardBg} shadow='sm' borderRadius='lg'>
          <HStack mb={4} spacing={2} pb={2} borderBottom='1px solid' borderColor={borderColor}>
            <Icon as={MdInfo} color='green.500' />
            <Heading size='md'>Additional Information</Heading>
          </HStack>

          <VStack spacing={4} align='stretch'>
            {Object.entries(furtherInformation).map(([key, property]) => {
              const formattedKey = key
                .split(/(?=[A-Z])/)
                .join(' ')
                .trim();

              return renderPropertyCard(key, property, formattedKey);
            })}
          </VStack>
        </Box>
      )}

      {/* General Information Section - Enhanced with descriptions and metadata */}
      {Object.keys(generalInformation).length > 0 && (
        <Box p={6} bg={cardBg} shadow='sm' borderRadius='lg'>
          <HStack mb={4} spacing={2} pb={2} borderBottom='1px solid' borderColor={borderColor}>
            <Icon as={MdDescription} color='orange.500' />
            <Heading size='md'>General Information</Heading>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {Object.entries(generalInformation).map(([key, property]) => {
              // Skip image fields since we display them elsewhere
              if ((key === 'ProductImage' || key === 'ManufacturerLogo') && !developerMode) {
                return null;
              }

              // Format the key
              const formattedKey = key
                .split(/(?=[A-Z])/)
                .join(' ')
                .trim();

              return (
                <Accordion key={key} allowToggle>
                  <AccordionItem
                    border='1px'
                    borderColor={borderColor}
                    borderRadius='md'
                    overflow='hidden'
                    mb={0}
                  >
                    <AccordionButton bg={headerBg} _hover={{ bg: headerBg }}>
                      <Box flex='1' textAlign='left'>
                        <Text fontWeight='medium'>{formattedKey}</Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <VStack align='start' spacing={3}>
                        {/* Property value */}
                        <Box width='100%'>
                          <Text fontSize='sm' color={labelColor} mb={1}>
                            Value
                          </Text>
                          {renderPropertyValue(property)}
                        </Box>

                        {/* Property description */}
                        {property.description && (
                          <Box width='100%'>
                            <Text fontSize='sm' color={labelColor} mb={1}>
                              Description
                            </Text>
                            <Text>{getFirstLangValue(property.description)}</Text>
                          </Box>
                        )}

                        {/* Property metadata - only show in developer mode */}
                        {developerMode && (
                          <>
                            {property.modelType && (
                              <Box width='100%'>
                                <Text fontSize='sm' color={labelColor} mb={1}>
                                  Type
                                </Text>
                                <HStack>
                                  <Badge colorScheme='purple'>{property.modelType}</Badge>
                                  {property.valueType && (
                                    <Badge colorScheme='blue' variant='outline'>
                                      {property.valueType}
                                    </Badge>
                                  )}
                                </HStack>
                              </Box>
                            )}

                            {property.idShort && (
                              <Box width='100%'>
                                <Text fontSize='sm' color={labelColor} mb={1}>
                                  ID
                                </Text>
                                <Code fontSize='sm'>{property.idShort}</Code>
                              </Box>
                            )}
                          </>
                        )}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              );
            })}
          </SimpleGrid>

          {/* Product and manufacturer images in a dedicated section */}
          <Box mt={6}>
            <Divider mb={4} />
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {/* Product Image */}
              {getNestedValue(generalInformation, 'ProductImage.value') && (
                <Box
                  p={4}
                  borderWidth='1px'
                  borderColor={borderColor}
                  borderRadius='md'
                  bg={descriptionBg}
                >
                  <VStack spacing={3}>
                    <Text fontWeight='medium'>Product Image</Text>
                    <Image
                      src={getNestedValue(generalInformation, 'ProductImage.value')}
                      alt='Product'
                      maxH='150px'
                      objectFit='contain'
                      cursor='pointer'
                      onClick={() =>
                        setSelectedImage?.(getNestedValue(generalInformation, 'ProductImage.value'))
                      }
                    />
                    {getNestedValue(generalInformation, 'ProductImage.description') && (
                      <Text fontSize='sm' color={labelColor}>
                        {getFirstLangValue(
                          getNestedValue(generalInformation, 'ProductImage.description')
                        )}
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Manufacturer Logo */}
              {getNestedValue(generalInformation, 'ManufacturerLogo.value') && (
                <Box
                  p={4}
                  borderWidth='1px'
                  borderColor={borderColor}
                  borderRadius='md'
                  bg={descriptionBg}
                >
                  <VStack spacing={3}>
                    <Text fontWeight='medium'>Manufacturer Logo</Text>
                    <Image
                      src={getNestedValue(generalInformation, 'ManufacturerLogo.value')}
                      alt='Manufacturer Logo'
                      maxH='80px'
                      objectFit='contain'
                      cursor='pointer'
                      onClick={() =>
                        setSelectedImage?.(
                          getNestedValue(generalInformation, 'ManufacturerLogo.value')
                        )
                      }
                    />
                    {getNestedValue(generalInformation, 'ManufacturerLogo.description') && (
                      <Text fontSize='sm' color={labelColor}>
                        {getFirstLangValue(
                          getNestedValue(generalInformation, 'ManufacturerLogo.description')
                        )}
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}
            </SimpleGrid>
          </Box>
        </Box>
      )}

      {/* Developer Mode - Additional Data */}
      {developerMode && additionalData && <AdditionalDataSection additionalData={additionalData} />}
    </VStack>
  );
};

export default TechnicalSection;
