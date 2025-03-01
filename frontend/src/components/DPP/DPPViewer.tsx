import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  HStack,
  Text,
  useColorModeValue,
  Flex,
  Button,
  Tooltip,
  Badge,
  Divider,
  Spinner,
  Center,
  useToast,
  Skeleton
} from "@chakra-ui/react";
import { CompleteDPP, DPP_SECTION_CONFIG } from "../../types/dpp";
import DPPSectionView from "./DPPSectionView";
import { MdDownload, MdInfo, MdContentCopy } from "react-icons/md";
import DeveloperModeToggle from "./DeveloperModeToggle";
import { useQuery } from "@tanstack/react-query";
import { DppService } from "../../client";

interface DPPViewerProps {
  dpp: CompleteDPP;
  aasId: string;
}

const DPPViewer: React.FC<DPPViewerProps> = ({ dpp, aasId }) => {
  const [developerMode, setDeveloperMode] = useState(false);
  const [copiedTooltip, setCopiedTooltip] = useState("Copy Link");
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const toast = useToast();
  const tabBg = useColorModeValue("gray.50", "gray.700");
  const activeTabBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Generate the public URL for the DPP
  const publicUrl = `${window.location.origin}/dpp/${dpp.id}`;

  // Memoize sorted sections to prevent unnecessary re-sorts
  const sortedSectionIds = React.useMemo(() => {
    return Object.keys(dpp.sections).sort((a, b) => {
      const priorityA = DPP_SECTION_CONFIG[a]?.priority || 999;
      const priorityB = DPP_SECTION_CONFIG[b]?.priority || 999;
      return priorityA - priorityB;
    });
  }, [dpp.sections]);

  // Get the active section ID
  const activeSectionId = sortedSectionIds[activeTabIndex];

  // Fetch the section data when tab changes
  const { data: sectionData, isLoading: isLoadingSection, error: sectionError } = useQuery({
    queryKey: ['dpp-section', aasId, activeSectionId, developerMode],
    queryFn: async () => {
      try {
        const sectionData = await DppService.getDppSection({
          aasId,
          sectionId: activeSectionId,
          includeRaw: developerMode
        });

        // Update the section data in our local DPP object
        const updatedSection = {
          ...dpp.sections[activeSectionId],
          data: sectionData
        };

        // Add it to the DPP object
        dpp.sections[activeSectionId] = updatedSection;

        return sectionData;
      } catch (error) {
        console.error(`Error fetching section ${activeSectionId}:`, error);
        throw error;
      }
    },
    enabled: !!activeSectionId && !!aasId
  });

  // Show error toast if section fetch fails
  useEffect(() => {
    if (sectionError) {
      toast({
        title: "Error loading section",
        description: "There was a problem loading this section. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [sectionError, toast]);

  // Optimize copy to clipboard with useCallback
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedTooltip("Link Copied!");

      toast({
        title: "Link copied!",
        description: "DPP link copied to clipboard",
        status: "success",
        duration: 2000,
      });

      setTimeout(() => setCopiedTooltip("Copy Link"), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard",
        status: "error",
        duration: 3000,
      });
    }
  }, [publicUrl, toast]);

  // Optimize download handler with useCallback
  const handleDownload = useCallback(async () => {
    try {
      toast({
        title: "Preparing download...",
        status: "loading",
        duration: null,
        id: "download-toast"
      });

      // Use the actual download endpoint
      const completeData = await DppService.downloadCompleteDpp({
        aasId,
        includeRaw: developerMode
      });

      // Create a download link for the DPP JSON data
      const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(completeData, null, 2)
      )}`;
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `dpp_${aasId}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      toast.close("download-toast");
      toast({
        title: "Download complete",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to download DPP data:", error);
      toast({
        title: "Download failed",
        description: "Could not download DPP data",
        status: "error",
        duration: 3000,
      });
    }
  }, [aasId, developerMode, toast]);

  const handleTabChange = useCallback((index: number) => {
    setActiveTabIndex(index);
  }, []);

  return (
    <Box>
      <Flex
        justify="space-between"
        align="center"
        p={4}
        borderBottomWidth="1px"
        borderColor={borderColor}
      >
        <HStack spacing={2}>
          <Badge colorScheme="blue" fontSize="md">DPP</Badge>
          <Badge colorScheme="green">{dpp.id}</Badge>
        </HStack>
        <HStack spacing={2}>
          <DeveloperModeToggle
            isDeveloperMode={developerMode}
            setDeveloperMode={setDeveloperMode}
          />
          <Divider orientation="vertical" height="20px" />
          <Tooltip label={copiedTooltip}>
            <Button
              size="sm"
              leftIcon={<MdContentCopy />}
              onClick={copyToClipboard}
              variant="outline"
            >
              Share
            </Button>
          </Tooltip>
          <Button
            size="sm"
            leftIcon={<MdDownload />}
            onClick={handleDownload}
            isLoading={false}
            loadingText="Downloading..."
          >
            Download
          </Button>
        </HStack>
      </Flex>

      <Tabs
        variant="enclosed"
        colorScheme="blue"
        isLazy
        index={activeTabIndex}
        onChange={handleTabChange}
      >
        <TabList overflowX="auto" py={2} px={4}>
          {sortedSectionIds.map((sectionId, index) => {
            const section = dpp.sections[sectionId];
            const config = DPP_SECTION_CONFIG[sectionId] || {
              icon: MdInfo,
              color: "gray.500",
              title: section.title
            };

            return (
              <Tab
                key={sectionId}
                _selected={{
                  bg: activeTabBg,
                  borderColor: borderColor,
                  borderBottomColor: activeTabBg
                }}
                bg={tabBg}
                borderColor={borderColor}
                borderBottomWidth="1px"
                mb="-1px"
                mr={2}
                borderRadius="md"
                borderBottomRadius={0}
                fontWeight="medium"
              >
                <HStack spacing={2}>
                  <Icon as={config.icon} color={config.color} />
                  <Text>{section.title || config.title}</Text>
                </HStack>
              </Tab>
            );
          })}
        </TabList>

        <TabPanels>
          {sortedSectionIds.map((sectionId, index) => {
            const section = dpp.sections[sectionId];
            const isActive = activeTabIndex === index;

            return (
              <TabPanel key={sectionId} px={4} py={5}>
                {isActive && (
                  <Skeleton isLoaded={!isLoadingSection}>
                    <DPPSectionView
                      sectionId={sectionId}
                      section={section}
                      developerMode={developerMode}
                    />
                  </Skeleton>
                )}
              </TabPanel>
            );
          })}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default React.memo(DPPViewer);
