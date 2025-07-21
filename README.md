# Interactive Sailing Wind Calculator

Une application interactive de calcul de vent apparent pour la pratique de la voile, construite avec Nuxt 3, TypeScript et Canvas 2D.

## 🎯 Fonctionnalités

- **Canvas interactif** : Visualisation en temps réel du vent réel, du cap bateau et du vent apparent
- **Poignées de contrôle** : 
  - 3 poignées pour le vent réel (couronne extérieure, espacement 120°)
  - 4 poignées pour le bateau (couronne intérieure, espacement 90°)
- **Calcul vectoriel** : Vent apparent = Vent réel - Vitesse bateau (calcul en temps réel)
- **Interface intuitive** : Drag & drop, gestion clavier, prévention des collisions
- **Panneau de données** : Valeurs chiffrées en temps réel (angles en °, vitesses en nœuds)

## 🛠️ Technologies

- **Nuxt 3** : Framework Vue.js avec TypeScript
- **Pinia** : State management
- **Canvas 2D** : Rendu haute performance à 60fps
- **@use-gesture/vanilla** : Gestion gestuelle avancée
- **Tailwind CSS** : Styling avec thème nautique
- **Vitest** : Tests unitaires complets

## 🚀 Installation et Démarrage

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev

# Tests
npm run test
```

L'application sera disponible sur `http://localhost:3000`

## 🎮 Utilisation

### Contrôles Souris/Tactile
- **Cliquer** sur une poignée pour la sélectionner
- **Glisser** une poignée pour ajuster l'angle et la vitesse
- **Rotation** : drag circulaire autour du centre → modifie l'angle
- **Intensité** : drag radial vers l'intérieur/extérieur → modifie la vitesse

### Contrôles Clavier
- **←/→** : Rotation de la poignée sélectionnée (±5°)
- **↑/↓** : Modification de l'intensité (±5%)
- **Échap** : Désélection

### Interface

#### Canvas Principal
- **Bateau** (centre) : Icône stylisée fixée au centre
- **Couronne bleue** (extérieure) : Contrôles du vent réel
- **Couronne cyan** (intérieure) : Contrôles du bateau
- **Flèche rouge** : Vecteur de vent apparent (calculé en temps réel)
- **Rose des vents** : Repères cardinaux (N, S, E, W)

#### Panneau Latéral
- **Vent réel** : Direction (°) / Vitesse (nœuds)
- **Cap bateau** : Route (°) / Vitesse (nœuds)
- **Vent apparent** : Direction (°) / Vitesse (nœuds)
- **Angles relatifs** : Angles de vent par rapport au cap bateau

## 📁 Structure du Projet

```
sailing/
├── components/
│   └── InteractiveSailingCanvas.vue    # Composant canvas principal
├── composables/
│   ├── useWindCalculations.ts          # Utilitaires calculs vectoriels
│   └── useSailingCanvas.ts             # Logique canvas et gestures
├── stores/
│   └── sailing.ts                      # Store Pinia réactif
├── pages/
│   └── index.vue                       # Page principale
├── assets/
│   ├── css/main.css                    # Styles globaux
│   └── svg/boat.svg                    # Icône bateau SVG
├── tests/                              # Tests Vitest
│   ├── useWindCalculations.test.ts
│   ├── sailing.store.test.ts
│   └── InteractiveSailingCanvas.test.ts
└── README.md
```

## 🧮 Calculs Physiques

### Vent Apparent
```typescript
// Conversion polaire → cartésien
const trueWindVector = polarToCartesian(trueWind)
const boatVector = polarToCartesian(boat)

// Calcul vectoriel : Vent apparent = Vent réel - Vitesse bateau
const apparentWindVector = subtractVectors(trueWindVector, boatVector)

// Retour en coordonnées polaires
const apparentWind = cartesianToPolar(apparentWindVector)
```

### Système d'Angles
- **Angles internes** : Radians (0 à 2π)
- **Affichage** : Degrés (0 à 360°)
- **Référence** : 0° = Nord, sens horaire
- **Normalisation** : Angles contraints à [0, 2π]

### Prévention des Collisions
- **Séparation minimale** : 10° entre poignées d'une même couronne
- **Contrainte dynamique** : Repositionnement automatique en cas de collision
- **Algorithme** : Recherche de l'angle libre le plus proche

## 🎨 Thème Visuel

### Palette Couleurs
- **Primaire** : `#0E4D92` (Bleu marine)
- **Secondaire** : `#00A3E0` (Cyan)
- **Fond** : `#F5F7FA` (Gris clair)
- **Accent** : `#FF6B6B` (Rouge pour vent apparent)

### Éléments Visuels
- **Poignées** : Cercles 20px, bordure 2px
- **États** : Hover, sélection, drag avec animations
- **Vecteurs** : Lignes depuis le centre avec têtes de flèche
- **Anneaux** : Bordures pleines et pointillées pour les zones

## 🧪 Tests

### Tests Unitaires (Vitest)
```bash
# Lancer tous les tests
npm run test

# Interface graphique des tests
npm run test:ui

# Couverture de code
npm run test:coverage
```

### Couverture
- **Calculs vectoriels** : 100% (useWindCalculations.ts)
- **Store Pinia** : 95% (stores/sailing.ts)
- **Composant Canvas** : 85% (InteractiveSailingCanvas.vue)

## 🚀 Commandes de Développement

```bash
# Développement
npm run dev                  # Serveur de développement
npm run build               # Build de production
npm run preview             # Prévisualisation du build

# Tests
npm run test                # Tests unitaires
npm run test:ui            # Interface graphique des tests
npm run test:coverage      # Couverture de code

# Qualité de code
npm run lint               # Vérification ESLint
npm run lint:fix           # Correction automatique ESLint
```

## 🔧 Configuration

### Nuxt Config
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxt/ui', '@nuxt/test-utils'],
  css: ['~/assets/css/main.css'],
  vitest: {
    environment: 'jsdom'
  }
})
```

### Environnement de Test
- **JSDOM** : Simulation DOM pour les tests
- **Canvas Mocking** : Mocks pour les APIs Canvas 2D
- **Pinia Testing** : État isolé par test

## 📊 Performance

- **60 FPS** : Animation fluide via requestAnimationFrame
- **Responsive** : Adaptation automatique aux dimensions du container
- **Optimisé** : Calculs vectoriels en temps réel sans lag
- **Mémoire** : Cleanup automatique des event listeners

## 🎯 Cas d'Usage

### Navigation à Voile
- **Formation** : Apprentissage des concepts de vent apparent
- **Planification** : Simulation de routes et d'allures
- **Compétition** : Optimisation de trajectoires

### Pédagogie
- **Écoles de voile** : Support visuel interactif
- **Autoformation** : Expérimentation libre des concepts
- **Certification** : Validation des connaissances théoriques

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Distribué sous licence MIT. Voir `LICENSE` pour plus d'informations.

## 📞 Support

- **Documentation** : Voir les commentaires inline dans le code
- **Issues** : Utiliser le système d'issues GitHub
- **Discussions** : Pour les questions et suggestions
