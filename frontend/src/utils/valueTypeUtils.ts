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
