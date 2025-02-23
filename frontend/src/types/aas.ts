export interface SubmodelTemplate {
  template_id: string;
  template_name: string;
  category: string;
  template_path: string;
  id_short: string;
  description: {
    [languageCode: string]: string;
  };
}
