/**
 * Utility functions for handling DPP data
 */

/**
 * Formats a date string to a localized date representation
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    return dateString;
  }
}

/**
 * Formats a value with optional unit
 */
export function formatValue(value?: any, unit?: string): string {
  if (value === undefined || value === null) return "";
  return unit ? `${value} ${unit}` : String(value);
}

/**
 * Extracts the first language value from a multilanguage property
 */
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

/**
 * Format field names for better display
 */
export function formatFieldName(field: string): string {
  // Skip AAS-specific technical field prefixes and suffixes
  if (field.startsWith('model') || field.endsWith('Type') ||
      field.startsWith('semantic') || field.startsWith('id')) {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }

  // Convert camelCase to Title Case with spaces
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ');
}

/**
 * Formats AAS specific types into more user-friendly terms
 */
export function formatUserFriendlyType(modelType: string): string {
  const typeMap: Record<string, string> = {
    'SubmodelElementCollection': 'Group',
    'Property': 'Value',
    'MultiLanguageProperty': 'Multi-language Value',
    'File': 'File',
    'Entity': 'Component',
    'Range': 'Range',
    'ReferenceElement': 'Reference',
    'Capability': 'Capability',
    'Operation': 'Operation',
    'Blob': 'Binary Data',
    'Event': 'Event',
    'BasicEvent': 'Event',
    'AnnotatedRelationshipElement': 'Relationship',
    'RelationshipElement': 'Relationship'
  };

  return typeMap[modelType] || modelType;
}

/**
 * Determine file type from URL or content type
 */
export function getFileType(fileUrl: string, contentType?: string): string {
  if (!fileUrl) return 'unknown';

  // First check content type if available
  if (contentType) {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType === 'application/pdf') return 'pdf';
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'spreadsheet';
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) return 'presentation';
    if (contentType.includes('document') || contentType.includes('word')) return 'document';
    return 'file';
  }

  // Fall back to URL extension analysis
  const extension = fileUrl.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(extension)) return 'image';
  if (['pdf'].includes(extension)) return 'pdf';
  if (['doc', 'docx', 'rtf', 'txt', 'odt'].includes(extension)) return 'document';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) return 'spreadsheet';
  if (['ppt', 'pptx', 'odp'].includes(extension)) return 'presentation';
  if (['mp4', 'webm', 'ogv', 'mov', 'avi'].includes(extension)) return 'video';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) return 'audio';

  return 'file';
}

/**
 * Check if a field should be hidden from the DPP view
 */
export function shouldHideField(key: string, level: number): boolean {
  // List of technical fields to hide
  const techFields = [
    'modelType', 'type', 'idShort', 'semanticId', 'keys',
    'elements', 'statements', 'typeValueListElement'
  ];

  // Hide technical fields but not at the root level for certain sections
  if (level > 0 && techFields.includes(key)) {
    return true;
  }

  return false;
}

/**
 * Safely get a nested value from an object using dot notation path
 * Example: getNestedValue(obj, "a.b.c") will return obj.a.b.c if it exists, or undefined if any part of the path doesn't exist
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Check if a field appears to be an AAS technical field
 * This helps identify fields that should only be shown in developer mode
 */
export function isAasTechnicalField(key: string): boolean {
  const technicalFieldPatterns = [
    // AAS specific fields
    'modelType', 'semanticId', 'embeddedDataSpecifications', 'contentType',
    'idShort', 'category', 'kind', 'qualifiers', 'valueType',

    // Other technical fields that may appear
    'elements', 'keys', 'value', 'type', 'values', 'first', 'second',
    'globalAssetId', 'assetType', 'statements', 'description', 'submodelElements'
  ];

  // Check if the key is in our list of technical field patterns
  return technicalFieldPatterns.some(pattern =>
    key === pattern ||
    key.startsWith(`${pattern}.`) ||
    key.endsWith(`.${pattern}`)
  );
}

/**
 * Check if a string is likely to be a date
 * This helps with proper formatting of date fields
 */
export function isDateString(value: string): boolean {
  if (typeof value !== 'string') return false;

  // Check for ISO date format (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss.sssZ)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T|\s)?(\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  if (isoDateRegex.test(value)) {
    return !isNaN(Date.parse(value));
  }

  // Check for common date formats with slashes (MM/DD/YYYY, DD/MM/YYYY)
  const slashDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
  if (slashDateRegex.test(value)) {
    return !isNaN(Date.parse(value));
  }

  // Check if it looks like a timestamp
  if (/^\d{10,13}$/.test(value)) {
    const timestamp = parseInt(value);
    return !isNaN(new Date(timestamp).getTime());
  }

  return false;
}

/**
 * Check if a string is an email address
 */
export function isEmail(value: string): boolean {
  if (typeof value !== 'string') return false;

  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(value);
}

/**
 * Check if a string looks like a phone number
 */
export function isPhoneNumber(value: string): boolean {
  if (typeof value !== 'string') return false;

  // Remove common formatting characterss
  const cleaned = value.replace(/[\s\-\(\)\.\+]/g, '');

  // Check if it's numeric and has a reasonable length for a phone number (6-15 digits)
  return /^\d{6,15}$/.test(cleaned);
}

/**
 * Check if a string is a URL
 */
export function isURL(value: string): boolean {
  if (typeof value !== 'string') return false;

  try {
    // Try to create a URL object - this will throw if invalid
    new URL(value);

    // Make sure it has http/https protocol
    return value.startsWith('http://') || value.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Renders a value in a user-friendly way based on its type
 * This is used by DynamicFieldsRenderer to format values appropriately
 */
export function renderValue(value: any): string | React.ReactNode {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return "—";
  }

  // Handle simple types
  if (typeof value === "string") {
    // Format dates if they look like dates
    if (isDateString(value)) {
      return formatDate(value);
    }
    return value;
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";

    // Check if it's a language array
    if (value[0] && value[0].language && value[0].text) {
      return getFirstLangValue(value);
    }

    // Regular array
    return value.map(item =>
      typeof item === 'object' ? JSON.stringify(item) : String(item)
    ).join(", ");
  }

  // Handle objects (try to extract value property which is common in AAS)
  if (typeof value === "object") {
    // Handle multilanguage properties
    if (value.en || value.de || value.fr) {
      return getFirstLangValue(value);
    }

    // Look for common value pattern in AAS
    if (value.value !== undefined) {
      return renderValue(value.value);
    }

    // Default to JSON string for complex objects
    return JSON.stringify(value);
  }

  // Fallback
  return String(value);
}
