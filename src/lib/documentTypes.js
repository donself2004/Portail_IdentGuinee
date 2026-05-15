export const DOCUMENT_TYPES = {
  CNI: {
    value: 'CNI',
    label: "Carte Nationale d'Identité Biométrique",
    shortLabel: "Carte d'Identité",
    description: "Carte nationale d'identité biométrique sécurisée conforme aux normes CEDEAO et guinéennes.",
    note: "CNIB avec puce et données biométriques.",
    prix: "100 000 GNF",
    prixNum: 100000,
    delai: "72h ouvrables",
    ministere: "MATD"
  },
  PASSEPORT: {
    value: 'PASSEPORT',
    label: 'Passeport Biométrique Ordinaire',
    shortLabel: 'Passeport',
    description: 'Passeport biométrique conforme aux normes OACI 9303 pour voyage international.',
    note: "Document de voyage international — valide 5 ans.",
    prix: "500 000 GNF",
    prixNum: 500000,
    delai: "15 jours ouvrables",
    ministere: "MSPC"
  },
  NAISSANCE: {
    value: 'NAISSANCE',
    label: "Extrait d'acte de naissance",
    shortLabel: 'Extrait de naissance',
    description: "Extrait d'acte de naissance authentifié par l'état civil guinéen.",
    note: "Document officiel de filiation et d'état civil.",
    prix: "5 000 GNF",
    prixNum: 5000,
    delai: "48h ouvrables",
    ministere: "MATD"
  },
  PERMIS: {
    value: 'PERMIS',
    label: 'Permis de conduire national',
    shortLabel: 'Permis de conduire',
    description: 'Permis de conduire national conforme aux modèles de la République de Guinée.',
    note: 'Autorisation officielle de conduire en Guinée.',
    prix: "350 000 GNF",
    prixNum: 350000,
    delai: "10 jours ouvrables",
    ministere: "MINSP"
  }
};

export const DOCUMENT_TYPE_OPTIONS = Object.values(DOCUMENT_TYPES).map((item) => ({
  value: item.value,
  label: item.label
}));

export const getDocumentTypeLabel = (value) => DOCUMENT_TYPES[value]?.label || value;
export const getDocumentTypeShortLabel = (value) => DOCUMENT_TYPES[value]?.shortLabel || value;
export const getDocumentTypeDescription = (value) => DOCUMENT_TYPES[value]?.description || '';
export const getDocumentTypeNote = (value) => DOCUMENT_TYPES[value]?.note || '';
export const getDocumentTypePrix = (value) => DOCUMENT_TYPES[value]?.prix || '';
