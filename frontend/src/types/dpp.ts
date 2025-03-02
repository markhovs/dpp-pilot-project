import { IconType } from 'react-icons';
import {
  MdSettings,
  MdEco,
  MdVerified,
  MdFingerprint,
  MdCategory,
  MdDescription,
  MdBusiness,
  MdLocationOn,
  MdDataUsage,
} from 'react-icons/md';

// Type definitions for DPP sections and data structures
export interface DPPSectionInfo {
  id: string;
  title: string;
  status: string;
  description?: string;
}

export interface DPPSection {
  id: string;  // Required id property
  title: string;
  data: Record<string, any>;
}

export interface CompleteDPP {
  id: string;
  format: string;
  generated_at: string;
  sections: Record<string, DPPSection>;
}

// Multi-language value type that can be reused across the application
export interface MultiLanguageValue {
  [lang: string]: string;
}

// Language item in array format (common in AAS data)
export interface LanguageItem {
  language: string;
  text: string;
}

// Helper type for DPP utility functions
export type StringOrMultiLang = string | MultiLanguageValue;

// Combined type for all possible language representation formats
export type AllLanguageFormats = StringOrMultiLang | LanguageItem[] | any[];

// This defines the available section IDs for a DPP
export enum DPPSectionId {
  IDENTIFICATION = 'identification',
  BUSINESS = 'business', // Changed from business_info
  TECHNICAL = 'technical', // Changed from technical_data
  SUSTAINABILITY = 'sustainability',
  COMPLIANCE = 'compliance',
  MATERIAL = 'materials', // Changed from material to materials
  DOCUMENTATION = 'documentation',
  LOCATION = 'location',
  USAGE = 'usage',
}

// Define section icons and display preferences using React icons
export const DPP_SECTION_CONFIG: Record<
  string,
  {
    icon: IconType;
    color: string;
    title: string;
    priority: number;
  }
> = {
  identification: {
    icon: MdFingerprint,
    color: 'blue.500',
    title: 'Product Identification',
    priority: 1,
  },
  compliance: {
    icon: MdVerified,
    color: 'green.500',
    title: 'Compliance & Standards',
    priority: 2,
  },
  technical: {
    icon: MdSettings,
    color: 'purple.500',
    title: 'Technical Data',
    priority: 3,
  },
  materials: {
    icon: MdCategory,
    color: 'orange.500',
    title: 'Materials & Composition',
    priority: 4,
  },
  sustainability: {
    icon: MdEco,
    color: 'green.500',
    title: 'Environmental Impact',
    priority: 5,
  },
  documentation: {
    icon: MdDescription,
    color: 'blue.400',
    title: 'Documentation',
    priority: 6,
  },
  business: {
    icon: MdBusiness,
    color: 'gray.500',
    title: 'Business Information',
    priority: 7,
  },
  location: {
    icon: MdLocationOn,
    color: 'red.500',
    title: 'Asset Location & Traceability',
    priority: 8,
  },
  usage: {
    icon: MdDataUsage,
    color: 'cyan.500',
    title: 'Usage Data',
    priority: 9,
  },
};

// Removing duplicate helper functions from this file as they're implemented in utils/dpp.ts
