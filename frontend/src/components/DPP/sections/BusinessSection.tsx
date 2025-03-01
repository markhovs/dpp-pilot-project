import React from 'react';
import {
  Box, Heading, Text, VStack, HStack, Icon, Badge,
  useColorModeValue, SimpleGrid, Card, CardBody, Divider,
  Avatar, Link, Flex, Tag, Spacer, Tooltip, Button
} from '@chakra-ui/react';
import {
  MdBusiness, MdEmail, MdPhone, MdLocationOn, MdLink,
  MdPerson, MdApartment, MdContacts, MdInfo, MdLanguage
} from 'react-icons/md';
import { DPPSection } from '../../../types/dpp';
import { getFirstLangValue, isEmail, isPhoneNumber, isURL } from '../../../utils/dpp';
import AdditionalDataSection from '../AdditionalDataSection';

interface BusinessSectionProps {
  section: DPPSection;
  developerMode: boolean;
  setSelectedImage?: (url: string | null) => void;
  setSelectedPdf?: (url: string | null) => void;
  setSelectedDocument?: (doc: any | null) => void;
}

const BusinessSection: React.FC<BusinessSectionProps> = ({
  section,
  developerMode
}) => {
  // Fix data access to match API response structure
  const sectionData = section?.data || {};
  const data = sectionData.data || {};
  const { contacts = [], partners = [], relationships = [], additionalData } = data;

  // Theme variables
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Helper function to render multi-language values
  const renderMultiLangValue = (value: any) => {
    if (!value) return null;

    // If it's not an object or has no language keys, render directly
    if (typeof value !== 'object' || !Object.keys(value).length) {
      return <Text>{value}</Text>;
    }

    // Render multi-language
    return (
      <VStack align="start" spacing={1}>
        {Object.entries(value).map(([lang, text]) => (
          <HStack key={lang}>
            <Tag size="sm" colorScheme="blue" variant="subtle">{lang}</Tag>
            <Text>{text}</Text>
          </HStack>
        ))}
      </VStack>
    );
  };

  // Format address object into a displayable string
  const formatAddress = (addressObj: any): string => {
    if (!addressObj) return "";

    // Handle if address is just a string
    if (typeof addressObj === 'string') return addressObj;

    // Check if it's an object with nested structure
    const parts = [];

    // Add street
    if (addressObj.street) {
      const street = getFirstLangValue(addressObj.street);
      if (street) parts.push(street);
    }

    // Add city and postCode together
    const cityParts = [];
    if (addressObj.postCode) {
      const postCode = getFirstLangValue(addressObj.postCode);
      if (postCode) cityParts.push(postCode);
    }
    if (addressObj.city) {
      const city = getFirstLangValue(addressObj.city);
      if (city) cityParts.push(city);
    }
    if (cityParts.length > 0) {
      parts.push(cityParts.join(" "));
    }

    // Add state/county
    if (addressObj.stateCounty) {
      const state = getFirstLangValue(addressObj.stateCounty);
      if (state) parts.push(state);
    }

    // Add country
    if (addressObj.country) {
      const country = getFirstLangValue(addressObj.country);
      if (country) parts.push(country);
    }

    return parts.join(", ");
  };

  // Helper function to get communication property value
  const getCommunicationValue = (contact: any, propName: string): string => {
    if (!contact.communication) return "";

    // Handle direct string value
    if (typeof contact.communication[propName] === 'string') {
      return contact.communication[propName];
    }

    // Handle multi-language object
    if (typeof contact.communication[propName] === 'object') {
      return getFirstLangValue(contact.communication[propName]) || "";
    }

    return "";
  };

  // Helper function to render contact card
  const renderContactCard = (contact: any, index: number) => {
    // Get name parts
    const firstName = getFirstLangValue(contact.firstName) || "";
    const title = getFirstLangValue(contact.title) || "";
    const academicTitle = getFirstLangValue(contact.academicTitle) || "";

    // Format full name
    const fullName = [
      academicTitle,
      title,
      firstName
    ].filter(Boolean).join(" ");

    // Generate initials from name for avatar
    const initials = fullName.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();

    // Get contact details
    const email = getCommunicationValue(contact, "email");
    const phone = getCommunicationValue(contact, "phone");
    const language = contact.communication?.language || "";
    const companyName = getFirstLangValue(contact.company) || "";
    const department = getFirstLangValue(contact.department) || "";

    // Format address
    const formattedAddress = formatAddress(contact.address);

    // Determine avatar bg color based on role
    let avatarColor = "blue";
    if (contact.role?.toLowerCase().includes('sales')) avatarColor = "green";
    if (contact.role?.toLowerCase().includes('support')) avatarColor = "purple";
    if (contact.role?.toLowerCase().includes('manager')) avatarColor = "orange";

    return (
      <Card key={index} variant="outline" bg={cardBg} overflow="hidden">
        {/* Contact Header */}
        <Box p={4} bg={headerBg}>
          <HStack spacing={3}>
            <Avatar size="md" name={fullName} bg={`${avatarColor}.500`}>
              {initials}
            </Avatar>
            <Box>
              <Heading size="sm">{fullName || "Contact Person"}</Heading>
              {contact.role && (
                <Text fontSize="sm" color={labelColor}>{contact.role}</Text>
              )}
            </Box>
            <Spacer />
            {language && (
              <Tooltip label="Preferred Language">
                <Tag colorScheme="blue" size="sm">
                  <Icon as={MdLanguage} mr={1} />
                  {language}
                </Tag>
              </Tooltip>
            )}
          </HStack>
        </Box>

        <CardBody>
          <VStack spacing={3} align="start">
            {/* Organization */}
            {companyName && (
              <HStack>
                <Icon as={MdBusiness} color="blue.500" />
                <Text fontWeight="medium">{companyName}</Text>
              </HStack>
            )}

            {/* Department */}
            {department && (
              <HStack>
                <Icon as={MdApartment} color="purple.500" />
                <Text>{department}</Text>
              </HStack>
            )}

            {/* Email with mailto link */}
            {email && (
              <HStack>
                <Icon as={MdEmail} color="green.500" />
                <Link href={`mailto:${email}`} color="blue.500">
                  {email}
                </Link>
              </HStack>
            )}

            {/* Phone with tel link */}
            {phone && (
              <HStack>
                <Icon as={MdPhone} color="blue.500" />
                <Link href={`tel:${phone}`} color="blue.500">
                  {phone}
                </Link>
              </HStack>
            )}

            {/* Address */}
            {formattedAddress && (
              <HStack alignItems="flex-start">
                <Icon as={MdLocationOn} color="red.500" mt={1} />
                <Text>{formattedAddress}</Text>
              </HStack>
            )}

            {/* Website */}
            {contact.website && (
              <HStack>
                <Icon as={MdLink} color="purple.500" />
                <Link href={contact.website} isExternal color="blue.500">
                  {contact.website.replace(/^https?:\/\//, '')}
                </Link>
              </HStack>
            )}

            {/* Description */}
            {contact.description && (
              <Box pt={2} borderTopWidth="1px" borderColor={borderColor} width="100%">
                <Text fontSize="sm">{getFirstLangValue(contact.description)}</Text>
              </Box>
            )}
          </VStack>
        </CardBody>

        {/* Actions */}
        {(email || phone) && (
          <Box p={3} borderTopWidth="1px" borderColor={borderColor}>
            <HStack>
              {email && (
                <Button
                  size="sm"
                  leftIcon={<Icon as={MdEmail} />}
                  onClick={() => window.location.href = `mailto:${email}`}
                  variant="outline"
                  colorScheme="blue"
                  flex="1"
                >
                  Email
                </Button>
              )}
              {phone && (
                <Button
                  size="sm"
                  leftIcon={<Icon as={MdPhone} />}
                  onClick={() => window.location.href = `tel:${phone}`}
                  variant="outline"
                  colorScheme="green"
                  flex="1"
                >
                  Call
                </Button>
              )}
            </HStack>
          </Box>
        )}
      </Card>
    );
  };

  // Helper function to render partner card
  const renderPartnerCard = (partner: any, index: number) => {
    return (
      <Card key={index} variant="outline" bg={cardBg}>
        <CardBody>
          <VStack spacing={2} align="start">
            {/* Partner Name */}
            <Heading size="sm">
              {renderMultiLangValue(partner.name) || "Business Partner"}
            </Heading>

            {/* Partner Type */}
            {partner.type && (
              <Badge colorScheme="blue" mb={2}>
                {partner.type}
              </Badge>
            )}

            {/* Partner Website */}
            {partner.website && (
              <HStack>
                <Icon as={MdLink} color="purple.500" />
                <Link href={partner.website} isExternal color="blue.500">
                  {partner.website.replace(/^https?:\/\//, '')}
                </Link>
              </HStack>
            )}

            {/* Partner Description */}
            {partner.description && (
              <Box pt={2} mt={1} borderTopWidth="1px" borderColor={borderColor} width="100%">
                <Text fontSize="sm">{getFirstLangValue(partner.description)}</Text>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Check if we have any business data to display
  const hasBusinessData = contacts.length > 0 || partners.length > 0 || relationships.length > 0;

  if (!hasBusinessData) {
    return (
      <Box p={5} shadow="md" borderRadius="lg" bg={cardBg}>
        <Text color={labelColor}>No business information available.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Contacts Section */}
      {contacts.length > 0 && (
        <Box p={5} shadow="md" borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg}>
          <HStack mb={4} spacing={2} pb={2} borderBottom="1px solid" borderColor={borderColor}>
            <Icon as={MdContacts} color="blue.500" />
            <Heading size="md">Business Contacts</Heading>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {contacts.map((contact, index) => renderContactCard(contact, index))}
          </SimpleGrid>
        </Box>
      )}

      {/* Partners Section */}
      {partners.length > 0 && (
        <Box p={5} shadow="md" borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg}>
          <HStack mb={4} spacing={2} pb={2} borderBottom="1px solid" borderColor={borderColor}>
            <Icon as={MdBusiness} color="purple.500" />
            <Heading size="md">Business Partners</Heading>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {partners.map((partner, index) => renderPartnerCard(partner, index))}
          </SimpleGrid>
        </Box>
      )}

      {/* Relationships Section */}
      {relationships.length > 0 && (
        <Box p={5} shadow="md" borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg}>
          <HStack mb={4} spacing={2} pb={2} borderBottom="1px solid" borderColor={borderColor}>
            <Icon as={MdInfo} color="green.500" />
            <Heading size="md">Business Relationships</Heading>
          </HStack>

          <VStack spacing={3} align="stretch">
            {relationships.map((relationship, index) => (
              <Box key={index} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                <HStack mb={2}>
                  <Badge colorScheme="green">{relationship.type || "Relationship"}</Badge>
                  <Text fontWeight="medium">{getFirstLangValue(relationship.name)}</Text>
                </HStack>

                {relationship.description && (
                  <Text fontSize="sm" color={labelColor}>
                    {getFirstLangValue(relationship.description)}
                  </Text>
                )}
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      {/* Developer Mode - Additional Data */}
      {developerMode && additionalData && (
        <AdditionalDataSection additionalData={additionalData} />
      )}
    </VStack>
  );
};

export default BusinessSection;
