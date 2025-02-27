import { useState } from "react";
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
  Badge
} from "@chakra-ui/react";
import { CompleteDPP, DPP_SECTION_CONFIG } from "../../types/dpp";
import DPPSectionView from "./DPPSectionView";
import { MdDownload, MdInfo, MdContentCopy } from "react-icons/md";

interface DPPViewerProps {
  dpp: CompleteDPP;
}

const DPPViewer: React.FC<DPPViewerProps> = ({ dpp }) => {
  const [copiedTooltip, setCopiedTooltip] = useState("Copy Link");
  const tabBg = useColorModeValue("gray.50", "gray.700");
  const activeTabBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Generate the public URL for the DPP
  const publicUrl = `${window.location.origin}/dpp/${dpp.id}`;

  // Sort sections by priority defined in config
  const sortedSectionIds = Object.keys(dpp.sections).sort((a, b) => {
    const priorityA = DPP_SECTION_CONFIG[a]?.priority || 999;
    const priorityB = DPP_SECTION_CONFIG[b]?.priority || 999;
    return priorityA - priorityB;
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedTooltip("Link Copied!");
      setTimeout(() => setCopiedTooltip("Copy Link"), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleDownload = () => {
    // Create a download link for the DPP JSON data
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dpp, null, 2)
    )}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `dpp_${dpp.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

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
          <Text fontSize="sm">Format: {dpp.format}</Text>
        </HStack>
        <HStack spacing={2}>
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
          >
            Download
          </Button>
        </HStack>
      </Flex>

      <Tabs variant="enclosed" colorScheme="blue" isLazy>
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
          {sortedSectionIds.map((sectionId) => (
            <TabPanel key={sectionId} px={4} py={5}>
              <DPPSectionView
                sectionId={sectionId}
                section={dpp.sections[sectionId]}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default DPPViewer;
