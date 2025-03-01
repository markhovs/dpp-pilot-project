import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Heading,
  SimpleGrid,
  Badge,
  useColorModeValue,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  Grid,
  GridItem,
  Tag
} from '@chakra-ui/react';
import { MdBusiness, MdQrCode, MdOutlineCalendarToday, MdFlagCircle, MdMemory } from 'react-icons/md';
import { DPPSection } from '../../../types/dpp';
import AdditionalDataSection from '../AdditionalDataSection';

interface IdentificationSectionProps {
  section: DPPSection;
  developerMode: boolean;
  setSelectedImage: (url: string | null) => void;
  setSelectedPdf?: (url: string | null) => void;
  setSelectedDocument?: (doc: any | null) => void;
}

const IdentificationSection: React.FC<IdentificationSectionProps> = ({
  section,
  developerMode,
  setSelectedImage,
}) => {
  // Extract the necessary data
  const sectionData = section?.data || {};
  const data = sectionData.data || {};
  const { product = {}, manufacturer = {}, versions = {}, additionalData = null } = data;

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const accentBg = useColorModeValue('blue.50', 'blue.900');
  const secondaryBg = useColorModeValue('purple.50', 'purple.900');
  const headerBg = developerMode
    ? "gray.700"
    : "linear-gradient(to right, rgba(79, 209, 197, 0.8), rgba(79, 209, 197, 0.4))";

  // Helper to render multi-language values properly
  const renderMultiLanguageValue = (mlText: Record<string, string> | string | undefined) => {
    if (!mlText) return <Text>—</Text>;
    if (typeof mlText === "string") return <Text fontWeight="medium">{mlText}</Text>;

    // If it's a multi-language object, render each language version
    if (Object.keys(mlText).length > 0) {
      return (
        <VStack align="start" spacing={1}>
          {Object.entries(mlText).map(([lang, text]) => (
            <HStack key={lang}>
              <Tag size="sm" colorScheme="blue" variant="subtle">{lang}</Tag>
              <Text fontWeight="medium">{text}</Text>
            </HStack>
          ))}
        </VStack>
      );
    }

    return <Text>—</Text>;
  };

  // Function to handle image click
  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  // Check if we have valid data to display
  const hasData = (
    (product && Object.keys(product).length > 0) ||
    (manufacturer && Object.keys(manufacturer).length > 0)
  );

  if (!hasData) {
    return (
      <Box p={5} shadow="md" borderRadius="lg" bg={cardBg}>
        <Text color={labelColor}>No product identification data available.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Hero section with gradient header */}
      <Box
        position="relative"
        borderRadius="xl"
        overflow="hidden"
        bg={cardBg}
        boxShadow="md"
      >
        {/* Simplified header without redundant "Product Identification" text */}
        <Box
          p={6}
          bg={headerBg}
          color="white"
        >
          <HStack spacing={3}>
            <Icon as={MdBusiness} boxSize={6} />
            <Heading size="md">
              {product.name ? renderMultiLanguageValue(product.name) : "Product Information"}
            </Heading>
          </HStack>
        </Box>

        <Box p={6}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            {/* Product Information - Left Side */}
            <VStack align="stretch" spacing={6}>
              {/* Product Name & Type */}
              <Box>
                {product.type && (
                  <Text mt={1} fontSize="md" color={labelColor}>
                    {product.type}
                  </Text>
                )}
              </Box>

              {/* Key Product Details in a Grid */}
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {/* Serial Number */}
                {product.serial && (
                  <GridItem>
                    <Stat bg={accentBg} p={3} borderRadius="md" size="sm">
                      <HStack fontSize="sm" mb={1}>
                        <Icon as={MdQrCode} color="teal.500" />
                        <StatLabel>Serial Number</StatLabel>
                      </HStack>
                      <StatNumber fontSize="md">{product.serial}</StatNumber>
                    </Stat>
                  </GridItem>
                )}

                {/* Article Number */}
                {product.articleNumber && (
                  <GridItem>
                    <Stat bg={secondaryBg} p={3} borderRadius="md" size="sm">
                      <StatLabel>Article Number</StatLabel>
                      <StatNumber fontSize="md">{product.articleNumber}</StatNumber>
                    </Stat>
                  </GridItem>
                )}

                {/* Order Code */}
                {product.orderCode && (
                  <GridItem>
                    <Stat bg={accentBg} p={3} borderRadius="md" size="sm">
                      <StatLabel>Order Code</StatLabel>
                      <StatNumber fontSize="md">{product.orderCode}</StatNumber>
                    </Stat>
                  </GridItem>
                )}

                {/* Manufacturing Date */}
                {product.manufacturingDate && (
                  <GridItem>
                    <Stat bg={secondaryBg} p={3} borderRadius="md" size="sm">
                      <HStack fontSize="sm" mb={1}>
                        <Icon as={MdOutlineCalendarToday} color="purple.500" />
                        <StatLabel>Manufactured</StatLabel>
                      </HStack>
                      <StatNumber fontSize="md">{product.manufacturingDate}</StatNumber>
                    </Stat>
                  </GridItem>
                )}

                {/* Country of Origin */}
                {product.countryOfOrigin && (
                  <GridItem>
                    <Stat bg={accentBg} p={3} borderRadius="md" size="sm">
                      <HStack fontSize="sm" mb={1}>
                        <Icon as={MdFlagCircle} color="teal.500" />
                        <StatLabel>Origin</StatLabel>
                      </HStack>
                      <StatNumber fontSize="md">{product.countryOfOrigin}</StatNumber>
                    </Stat>
                  </GridItem>
                )}

                {/* Year of Construction */}
                {product.yearOfConstruction && (
                  <GridItem>
                    <Stat bg={secondaryBg} p={3} borderRadius="md" size="sm">
                      <StatLabel>Year of Construction</StatLabel>
                      <StatNumber fontSize="md">{product.yearOfConstruction}</StatNumber>
                    </Stat>
                  </GridItem>
                )}
              </Grid>
            </VStack>

            {/* Right Column - Product Image & Manufacturer */}
            <VStack spacing={6} align="stretch">
              {/* Product Image */}
              {product.image && (
                <Box
                  borderRadius="lg"
                  overflow="hidden"
                  bg={useColorModeValue("gray.50", "gray.800")}
                  p={4}
                  textAlign="center"
                  boxShadow="sm"
                >
                  <Image
                    src={product.image}
                    alt="Product"
                    objectFit="contain"
                    maxH="200px"
                    mx="auto"
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => handleImageClick(product.image)}
                    fallbackSrc="https://via.placeholder.com/300?text=Product+Image"
                  />
                </Box>
              )}

              {/* Manufacturer Section */}
              <Box
                borderRadius="lg"
                overflow="hidden"
                bg={useColorModeValue("gray.50", "gray.800")}
                p={4}
              >
                <HStack mb={3}>
                  <Icon as={MdBusiness} color="blue.500" />
                  <Heading size="sm">Manufacturer</Heading>
                </HStack>

                {/* Manufacturer Logo */}
                {manufacturer.logo && (
                  <Box mb={4} textAlign="center">
                    <Image
                      src={manufacturer.logo}
                      alt="Manufacturer Logo"
                      maxH="60px"
                      mx="auto"
                      objectFit="contain"
                      cursor="pointer"
                      onClick={() => handleImageClick(manufacturer.logo)}
                      fallbackSrc="https://via.placeholder.com/200x60?text=Manufacturer+Logo"
                    />
                  </Box>
                )}

                {/* Manufacturer Details */}
                <SimpleGrid columns={1} spacing={3}>
                  {manufacturer.name && (
                    <Box>
                      <Text fontSize="sm" color={labelColor}>Name</Text>
                      {renderMultiLanguageValue(manufacturer.name)}
                    </Box>
                  )}

                  {manufacturer.productFamily && (
                    <Box>
                      <Text fontSize="sm" color={labelColor}>Product Family</Text>
                      {renderMultiLanguageValue(manufacturer.productFamily)}
                    </Box>
                  )}
                </SimpleGrid>
              </Box>
            </VStack>
          </SimpleGrid>

          {/* Versions Section */}
          {versions && Object.keys(versions).length > 0 && (
            <>
              <Divider my={6} />
              <Box>
                <HStack mb={4}>
                  <Icon as={MdMemory} color="blue.500" />
                  <Heading size="sm">Versions</Heading>
                </HStack>

                <SimpleGrid columns={{ base: 3, md: 5 }} spacing={4}>
                  {/* Hardware Version */}
                  {versions.hardware && (
                    <Box
                      p={3}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      borderRadius="md"
                      textAlign="center"
                    >
                      <Text fontSize="xs" color={labelColor}>Hardware</Text>
                      <Badge colorScheme="blue" fontSize="md" mt={1}>
                        v{versions.hardware}
                      </Badge>
                    </Box>
                  )}

                  {/* Software Version */}
                  {versions.software && (
                    <Box
                      p={3}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      borderRadius="md"
                      textAlign="center"
                    >
                      <Text fontSize="xs" color={labelColor}>Software</Text>
                      <Badge colorScheme="green" fontSize="md" mt={1}>
                        v{versions.software}
                      </Badge>
                    </Box>
                  )}

                  {/* Firmware Version */}
                  {versions.firmware && (
                    <Box
                      p={3}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      borderRadius="md"
                      textAlign="center"
                    >
                      <Text fontSize="xs" color={labelColor}>Firmware</Text>
                      <Badge colorScheme="purple" fontSize="md" mt={1}>
                        v{versions.firmware}
                      </Badge>
                    </Box>
                  )}
                </SimpleGrid>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Developer Mode - Additional Data */}
      {developerMode && additionalData && (
        <AdditionalDataSection additionalData={additionalData} />
      )}
    </VStack>
  );
};

export default IdentificationSection;
