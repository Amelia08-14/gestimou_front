// Amenity catalogue shown to residents in the mobile app ("commodités").
// Keys are stored in Residence.amenities; the labels below are the French ones.
// Keep in sync with backend/data/residenceDetails.json and the mobile translations.
export const AMENITY_CATALOG: { key: string; label: string }[] = [
  { key: 'climatisation', label: "Climatisation Centralisée" },
  { key: 'reception', label: "Réception" },
  { key: 'bache_eau', label: "Bâche à Eau" },
  { key: 'ascenseur', label: "Ascenseur" },
  { key: 'cuisine', label: "Cuisine Équipée" },
  { key: 'groupe_electrogene', label: "Groupe Électrogène" },
  { key: 'parking', label: "Parking de Stationnement" },
  { key: 'domotique', label: "Domotique" },
  { key: 'dressing', label: "Dressing" },
  { key: 'isolation_phonique', label: "Isolation Phonique" },
  { key: 'aire_jeux', label: "Aire de Jeux" },
  { key: 'piscine_commune', label: "Piscine Commune" },
  { key: 'piscine_privative', label: "Piscine Privative" },
  { key: 'fenetre', label: "Fenêtres Double Vitrage" },
  { key: 'salle_eau', label: "Salle d'Eau" },
  { key: 'salle_sport', label: "Salle de Sport" },
  { key: 'spa', label: "Spa / Hammam / Sauna" },
  { key: 'gestion_copropriete', label: "Gestion Copropriété" },
  { key: 'creche', label: "Crèche / Garderie" },
];

export const amenityLabel = (key: string) =>
  AMENITY_CATALOG.find((a) => a.key === key)?.label ?? key;
