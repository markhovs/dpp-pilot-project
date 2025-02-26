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
