import { IconType } from "react-icons";
import {
  MdInfo, MdSettings, MdEco,
  MdVerified, MdBuild, MdShield,
  MdFactory, MdOutlineScience, MdInsights,
  MdFingerprint, MdCategory, MdDescription, MdBusiness, MdLocationOn, MdDataUsage
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
  BUSINESS = "business",  // Changed from business_info
  TECHNICAL = "technical", // Changed from technical_data
  SUSTAINABILITY = "sustainability",
  COMPLIANCE = "compliance",
  MATERIAL = "materials",  // Changed from material to materials
  DOCUMENTATION = "documentation",
  LOCATION = "location",
  USAGE = "usage"
}

// Define section icons and display preferences using React icons
export const DPP_SECTION_CONFIG: Record<string, {
  icon: IconType;
  color: string;
  title: string;
  priority: number;
}> = {
  "identification": {
    icon: MdFingerprint,
    color: "blue.500",
    title: "Product Identification",
    priority: 1
  },
  "compliance": {
    icon: MdVerified,
    color: "green.500",
    title: "Compliance & Standards",
    priority: 2
  },
  "technical": {
    icon: MdSettings,
    color: "purple.500",
    title: "Technical Data",
    priority: 3
  },
  "materials": {
    icon: MdCategory,
    color: "orange.500",
    title: "Materials & Composition",
    priority: 4
  },
  "sustainability": {
    icon: MdEco,
    color: "green.500",
    title: "Environmental Impact",
    priority: 5
  },
  "documentation": {
    icon: MdDescription,
    color: "blue.400",
    title: "Documentation",
    priority: 6
  },
  "business": {
    icon: MdBusiness,
    color: "gray.500",
    title: "Business Information",
    priority: 7
  },
  "location": {
    icon: MdLocationOn,
    color: "red.500",
    title: "Asset Location & Traceability",
    priority: 8
  },
  "usage": {
    icon: MdDataUsage,
    color: "cyan.500",
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
