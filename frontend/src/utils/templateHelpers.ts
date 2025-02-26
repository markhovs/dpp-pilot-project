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
