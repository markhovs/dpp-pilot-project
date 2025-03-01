import { useState } from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import { DPPSection, DPPSectionId } from "../../types/dpp";

// Import section components
import IdentificationSection from "./sections/IdentificationSection";
import BusinessSection from "./sections/BusinessSection";
import LocationSection from "./sections/LocationSection";
import SustainabilitySection from "./sections/SustainabilitySection";
import TechnicalSection from "./sections/TechnicalSection";
import MaterialsSection from "./sections/MaterialsSection";
import ComplianceSection from "./sections/ComplianceSection";
import UsageSection from "./sections/UsageSection";
import DocumentationSection from "./sections/DocumentationSection";
import GenericSection from "./sections/GenericSection";

// Import shared modals
import ImageViewerModal from "./modals/ImageViewerModal";
import PdfViewerModal from "./modals/PdfViewerModal";
import DocumentViewerModal from "./modals/DocumentViewerModal";

interface DPPSectionViewProps {
  sectionId: string;
  section: DPPSection;
  developerMode?: boolean;
}

const DPPSectionView: React.FC<DPPSectionViewProps> = ({
  sectionId,
  section,
  developerMode = false
}) => {
  // Shared modal states - these will be passed to section components
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);

  // Render section based on section ID but with additional safeguards
  const renderSectionContent = () => {
    // Common props to pass to all section components
    const sectionProps = {
      section,
      developerMode,
      setSelectedImage,
      setSelectedPdf,
      setSelectedDocument
    };

    // Check if section data is valid
    if (!section || !section.data) {
      return (
        <Box p={5} shadow="md" borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>{section?.title || "Section"}</Heading>
          <Text color="gray.500">No data available for this section.</Text>
        </Box>
      );
    }

    // Use string matching for direct section ID comparison
    switch (sectionId) {
      case "identification":
        return <IdentificationSection {...sectionProps} />;
      case "business":
        return <BusinessSection {...sectionProps} />;
      case "technical":
        return <TechnicalSection {...sectionProps} />;
      case "sustainability":
        return <SustainabilitySection {...sectionProps} />;
      case "materials":
        return <MaterialsSection {...sectionProps} />;
      case "compliance":
        return <ComplianceSection {...sectionProps} />;
      case "documentation":
        return <DocumentationSection {...sectionProps} />;
      case "location":
        return <LocationSection {...sectionProps} />;
      case "usage":
        return <UsageSection {...sectionProps} />;
      default:
        return <GenericSection
          title={section.title}
          data={section.data}
          developerMode={developerMode}
          setSelectedImage={setSelectedImage}
          setSelectedPdf={setSelectedPdf}
          setSelectedDocument={setSelectedDocument}
        />;
    }
  };

  return (
    <>
      {renderSectionContent()}

      {/* Shared modals */}
      <ImageViewerModal
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      <PdfViewerModal
        selectedPdf={selectedPdf}
        onClose={() => setSelectedPdf(null)}
      />

      <DocumentViewerModal
        selectedDocument={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </>
  );
};

export default DPPSectionView;
