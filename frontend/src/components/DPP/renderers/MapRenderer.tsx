
import { Box, useColorModeValue, Text, Button, Link, HStack } from "@chakra-ui/react";
import { FaMapMarkerAlt, FaExternalLinkAlt } from "react-icons/fa";

interface MapRendererProps {
  coordinates: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    type?: string;
  };
  height?: string | number;
  zoom?: number;
}

/**
 * Simple map renderer that uses Google Maps Embed API
 * to show a location point on a map
 */
const MapRenderer: React.FC<MapRendererProps> = ({
  coordinates,
  height = "300px",
  zoom = 15
}) => {
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Check if we have valid coordinates
  if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
    return (
      <Box
        height={height}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={useColorModeValue("gray.50", "gray.700")}
      >
        <Text color="gray.500">No location coordinates available</Text>
      </Box>
    );
  }

  const { latitude, longitude } = coordinates;

  // Create Google Maps URL for the external link
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <Box position="relative">
      <Box
        height={height}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        overflow="hidden"
      >
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`}
          allowFullScreen
        ></iframe>
      </Box>

      {/* External link to open in Google Maps */}
      <HStack position="absolute" top="2" right="2" zIndex="overlay">
        <Button
          as={Link}
          href={googleMapsUrl}
          isExternal
          size="xs"
          colorScheme="blue"
          leftIcon={<FaExternalLinkAlt />}
        >
          Open in Maps
        </Button>
      </HStack>
    </Box>
  );
};

export default MapRenderer;
