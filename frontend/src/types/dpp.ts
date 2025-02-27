import { IconType } from "react-icons";
import {
  MdInfo, MdSettings, MdEco,
  MdVerified, MdBuild, MdShield,
  MdFactory, MdOutlineScience, MdInsights
} from "react-icons/md";

export interface DPPSectionInfo {
  id: string;
  title: string;
  status: string;
  description?: string;
}

export interface DPPSection {
  title: string;
  data: Record<string, any>;
  meta_info?: Record<string, any>; // Using meta_info instead of metadata to avoid conflict
}

export interface CompleteDPP {
  id: string;
  generated_at: string;
  format: string;
  sections: Record<string, DPPSection>;
  meta_info?: Record<string, any>; // Using meta_info instead of metadata to avoid conflict
}

// This defines the available section IDs for a DPP
export enum DPPSectionId {
  IDENTIFICATION = "identification",
  TECHNICAL = "technical",
  SUSTAINABILITY = "sustainability",
  COMPLIANCE = "compliance",
  MAINTENANCE = "maintenance",
  SAFETY = "safety",
  MANUFACTURING = "manufacturing",
  MATERIALS = "materials",
  USAGE = "usage"
}

// Define section icons and display preferences using React icons
export const DPP_SECTION_CONFIG: Record<string, {
  icon: IconType;
  color: string;
  title: string;
  priority: number;
}> = {
  [DPPSectionId.IDENTIFICATION]: {
    icon: MdInfo,
    color: "blue.500",
    title: "Product Identification",
    priority: 1
  },
  [DPPSectionId.TECHNICAL]: {
    icon: MdSettings,
    color: "gray.500",
    title: "Technical Data",
    priority: 2
  },
  [DPPSectionId.SUSTAINABILITY]: {
    icon: MdEco,
    color: "green.500",
    title: "Sustainability",
    priority: 3
  },
  [DPPSectionId.COMPLIANCE]: {
    icon: MdVerified,
    color: "purple.500",
    title: "Compliance & Certifications",
    priority: 4
  },
  [DPPSectionId.MATERIALS]: {
    icon: MdOutlineScience,
    color: "orange.500",
    title: "Material Composition",
    priority: 5
  },
  [DPPSectionId.MANUFACTURING]: {
    icon: MdFactory,
    color: "yellow.500",
    title: "Manufacturing",
    priority: 6
  },
  [DPPSectionId.MAINTENANCE]: {
    icon: MdBuild,
    color: "cyan.500",
    title: "Maintenance & Repair",
    priority: 7
  },
  [DPPSectionId.SAFETY]: {
    icon: MdShield,
    color: "red.500",
    title: "Safety & Handling",
    priority: 8
  },
  [DPPSectionId.USAGE]: {
    icon: MdInsights,
    color: "teal.500",
    title: "Usage Data",
    priority: 9
  }
};

// Helper functions for DPP data handling
export function formatDate(dateString?: string): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    return dateString;
  }
}

export function formatValue(value?: any, unit?: string): string {
  if (value === undefined || value === null) return "";
  return unit ? `${value} ${unit}` : String(value);
}

export function getFirstLangValue(mlp?: Record<string, string> | Array<{language: string, text: string}>): string {
  if (!mlp) return "";

  if (Array.isArray(mlp)) {
    // Handle array format (preferred English)
    const en = mlp.find(item => item.language === "en");
    return en?.text || mlp[0]?.text || "";
  } else {
    // Handle object format (preferred English)
    return mlp["en"] || Object.values(mlp)[0] || "";
  }
}
