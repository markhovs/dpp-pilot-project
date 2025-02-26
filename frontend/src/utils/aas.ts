type LangStringSet = { [key: string]: string } | null | undefined;

export const getTemplateDescription = (description: LangStringSet): string => {
  try {
    if (!description) return 'No description';
    if (typeof description !== 'object') return 'Invalid description';

    // Try to get English description first
    if ('en' in description && description['en']) return description['en'];

    // If no English description, get the first available description
    const values = Object.values(description).filter(value =>
      typeof value === 'string' && value.length > 0
    );
    return values.length > 0 ? values[0] : 'No description';
  } catch (error) {
    console.error('Error processing template description:', error);
    return 'No description';
  }
};

/**
 * Find an element in the AAS submodel tree by its full path.
 * Handles arbitrary nesting levels through collections and submodelElements.
 */
export function findElementByPath(root: any, path: string): any {
  const segments = path.split('/');
  let current = root;

  // For each path segment, traverse down the tree
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    let found = false;

    // Look in different possible locations for children
    const searchLocations = [
      // Direct values array (for collections)
      ...(Array.isArray(current.value) ? current.value : []),
      // Submodel elements
      ...(Array.isArray(current.submodelElements) ? current.submodelElements : []),
      // Statements (for entities)
      ...(Array.isArray(current.statements) ? current.statements : [])
    ];

    // Search through all possible locations
    for (const potentialChild of searchLocations) {
      if (potentialChild.idShort === segment) {
        current = potentialChild;
        found = true;
        break;
      }
    }

    if (!found) {
      return null;
    }
  }

  return current;
}

export type XSDValueType =
  | "xs:string"
  | "xs:long"
  | "xs:integer"
  | "xs:double"
  | "xs:boolean"
  | "xs:date"
  | "xs:dateTime"
  | "xs:float"
  | "xs:unsignedLong"
  | "xs:anyURI";

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const getInputType = (valueType: XSDValueType): string => {
  switch (valueType) {
    case "xs:date":
    case "xs:dateTime":
      return "text";
    case "xs:double":
    case "xs:float":
    case "xs:long":
    case "xs:integer":
    case "xs:unsignedLong":
      return "number";
    case "xs:boolean":
      return "checkbox";
    case "xs:anyURI":
    case "xs:string":
    default:
      return "text";
  }
};

export const validateValue = (value: any, valueType: XSDValueType): ValidationResult => {
  if (value === "" || value === undefined || value === null) {
    return { isValid: true }; // Allow empty values
  }

  switch (valueType) {
    case "xs:long":
    case "xs:integer":
      return {
        isValid: Number.isInteger(Number(value)),
        message: "Value must be an integer"
      };

    case "xs:unsignedLong":
      const num = Number(value);
      return {
        isValid: !isNaN(num) && Number.isInteger(num) && num >= 0,
        message: "Value must be a non-negative integer"
      };

    case "xs:double":
    case "xs:float":
      return {
        isValid: !isNaN(Number(value)),
        message: "Value must be a number"
      };

    case "xs:boolean":
      return {
        isValid: typeof value === "boolean" || value === "true" || value === "false",
        message: "Value must be true or false"
      };

    case "xs:date":
      return {
        isValid: !isNaN(Date.parse(value)),
        message: "Value must be a valid date"
      };

    case "xs:dateTime":
      return {
        isValid: !isNaN(Date.parse(value)),
        message: "Value must be a valid date and time"
      };

    case "xs:anyURI":
      try {
        new URL(value);
        return { isValid: true };
      } catch {
        return {
          isValid: false,
          message: "Value must be a valid URL"
        };
      }

    case "xs:string":
    default:
      return { isValid: true };
  }
};

export const formatValue = (value: any, valueType: XSDValueType): any => {
  if (value === "" || value === undefined || value === null) {
    return null;  // Changed from 'return value' to 'return null'
  }

  switch (valueType) {
    case "xs:long":
    case "xs:integer":
    case "xs:unsignedLong":
      const intValue = parseInt(value, 10);
      return isNaN(intValue) ? null : intValue;

    case "xs:double":
    case "xs:float":
      const floatValue = parseFloat(value);
      return isNaN(floatValue) ? null : floatValue;

    case "xs:boolean":
      return value === "true" || value === true;

    case "xs:date":
    case "xs:dateTime":
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString();

    default:
      return value;
  }
};
