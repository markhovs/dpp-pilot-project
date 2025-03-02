import React, { useState, useEffect, useCallback, useRef } from "react";
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
  useToast,
  Skeleton,
  useBreakpointValue // Add this import
} from "@chakra-ui/react";
import { CompleteDPP, DPP_SECTION_CONFIG } from "../../types/dpp";
import DPPSectionView from "./DPPSectionView";
import { MdDownload, MdInfo, MdContentCopy, MdRefresh } from "react-icons/md";
import DeveloperModeToggle from "./DeveloperModeToggle";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DppService } from "../../client";

interface DPPViewerProps {
  dpp: CompleteDPP;
  aasId: string;
}

const DPPViewer: React.FC<DPPViewerProps> = ({ dpp, aasId }) => {
  const queryClient = useQueryClient();
  const [developerMode, setDeveloperMode] = useState(false);
  const [copiedTooltip, setCopiedTooltip] = useState("Copy Link");
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const currentSectionDataRef = useRef<any>(null);
  const isThemeChangingRef = useRef(false);

  const toast = useToast();
  const tabBg = useColorModeValue("gray.50", "gray.700");
  const activeTabBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const publicUrl = `${window.location.origin}/dpp/${dpp.id}`;
  const currentBgColor = useColorModeValue("light", "dark");

  // Track theme changes
  useEffect(() => {
    isThemeChangingRef.current = true;

    const timer = setTimeout(() => {
      isThemeChangingRef.current = false;
    }, 100);

    return () => clearTimeout(timer);
  }, [currentBgColor]);

  const sortedSectionIds = React.useMemo(() => {
    return Object.keys(dpp.sections).sort((a, b) => {
      const priorityA = DPP_SECTION_CONFIG[a]?.priority || 999;
      const priorityB = DPP_SECTION_CONFIG[b]?.priority || 999;
      return priorityA - priorityB;
    });
  }, [dpp.sections]);

  const activeSectionId = sortedSectionIds[activeTabIndex];

  const {
    data: sectionData,
    isLoading: isLoadingSection,
    error: sectionError,
    refetch: refetchSection
  } = useQuery({
    queryKey: ['dpp-section', aasId, activeSectionId],
    queryFn: async () => {
      if (!activeSectionId) return null;

      try {
        const data = await DppService.getDppSection({
          aasId,
          sectionId: activeSectionId,
          includeRaw: developerMode
        });

        currentSectionDataRef.current = data;
        return data;
      } catch (error) {
        console.error(`Error fetching section ${activeSectionId}:`, error);
        throw error;
      }
    },
    enabled: !!activeSectionId && !!aasId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    placeholderData: () => currentSectionDataRef.current,
  });

  // Ensure theme changes don't erase our data
  useEffect(() => {
    if (isThemeChangingRef.current && currentSectionDataRef.current && isLoadingSection) {
      queryClient.setQueryData(
        ['dpp-section', aasId, activeSectionId],
        currentSectionDataRef.current
      );
    }
  }, [currentBgColor, isLoadingSection, queryClient, aasId, activeSectionId]);

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

  const handleDownload = useCallback(async () => {
    try {
      toast({
        title: "Preparing download...",
        status: "loading",
        duration: null,
        id: "download-toast"
      });

      const completeData = await DppService.downloadCompleteDpp({
        aasId,
        includeRaw: developerMode
      });

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
      toast.close("download-toast");
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

  const handleRefresh = useCallback(() => {
    refetchSection();
    toast({
      title: "Refreshing data...",
      status: "info",
      duration: 1000,
    });
  }, [refetchSection, toast]);

  // Update dpp object with fetched section data
  useEffect(() => {
    if (activeSectionId && sectionData) {
      currentSectionDataRef.current = sectionData;

      dpp.sections[activeSectionId] = {
        ...dpp.sections[activeSectionId],
        data: sectionData
      };
    }
  }, [activeSectionId, sectionData, dpp.sections]);

  const currentSection = activeSectionId
    ? {
        ...dpp.sections[activeSectionId],
        data: sectionData || currentSectionDataRef.current
      }
    : null;

  // Use breakpoint to determine divider orientation with proper type constraint
  const dividerOrientation = useBreakpointValue<"horizontal" | "vertical">({
    base: "horizontal",
    md: "vertical"
  });

  return (
    <Box>
      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent={{ base: "flex-start", md: "space-between" }}
        alignItems={{ base: "stretch", md: "center" }}
        gap={{ base: 4, md: 0 }}
        p={4}
        borderBottomWidth="1px"
        borderColor={borderColor}
        flexWrap="wrap"
      >
        {/* DPP ID area - fixed to properly wrap on multiple lines */}
        <Box mb={{ base: 2, md: 0 }} maxW="100%">
          <HStack spacing={2} flexWrap="wrap" align="flex-start">
            <Badge colorScheme="blue" fontSize="md">DPP</Badge>
            <Badge
              colorScheme="green"
              fontSize="sm"
              wordBreak="break-all"
              whiteSpace="normal"
              p={2}
              display="block"
              maxW={{ base: "100%", md: "600px" }}
            >
              {dpp.id}
            </Badge>
          </HStack>
        </Box>

        {/* Action buttons - now wrap better on mobile */}
        <Flex
          flexWrap="wrap"
          gap={2}
          justifyContent={{ base: "flex-start", md: "flex-end" }}
          alignItems="center"
          width={{ base: "full", md: "auto" }}
        >
          <Button
            size="sm"
            leftIcon={<MdRefresh />}
            onClick={handleRefresh}
            variant="ghost"
            title="Refresh current section data"
          >
            Refresh
          </Button>

          <DeveloperModeToggle
            isDeveloperMode={developerMode}
            setDeveloperMode={setDeveloperMode}
          />

          {/* Replace vertical divider with margin on mobile */}
          <Divider
            orientation={dividerOrientation}
            height={dividerOrientation === "vertical" ? "20px" : undefined}
            width={dividerOrientation === "horizontal" ? "100%" : undefined}
            my={dividerOrientation === "horizontal" ? 1 : 0}
          />

          <HStack spacing={2} flexWrap="wrap" width={{ base: "full", md: "auto" }}>
            <Tooltip label={copiedTooltip}>
              <Button
                size="sm"
                leftIcon={<MdContentCopy />}
                onClick={copyToClipboard}
                variant="outline"
                width={{ base: "full", sm: "auto" }}
              >
                Share
              </Button>
            </Tooltip>

            <Button
              size="sm"
              leftIcon={<MdDownload />}
              onClick={handleDownload}
              loadingText="Downloading..."
              width={{ base: "full", sm: "auto" }}
            >
              Download
            </Button>
          </HStack>
        </Flex>
      </Flex>

      <Tabs
        variant="enclosed"
        colorScheme="blue"
        isLazy
        index={activeTabIndex}
        onChange={handleTabChange}
      >
        <TabList overflowX="auto" py={2} px={4}>
          {sortedSectionIds.map((sectionId) => {
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
          {sortedSectionIds.map((sectionId) => {
            const isActive = activeTabIndex === sortedSectionIds.indexOf(sectionId);

            return (
              <TabPanel key={sectionId} px={4} py={5}>
                {isActive && (
                  <Skeleton isLoaded={!isLoadingSection || (isThemeChangingRef.current && !!currentSectionDataRef.current)}>
                    {currentSection && (
                      <DPPSectionView
                        sectionId={sectionId}
                        section={currentSection}
                        developerMode={developerMode}
                      />
                    )}
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
