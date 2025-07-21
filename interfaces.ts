/**
 * Interface pour définir une couronne (ring) avec ses poignées synchronisées
 */
export interface Ring {
  angle: number          // rad, 0 = Est, CCW+
  radius: number         // px
  spokes: number         // 3 (vent) ou 4 (bateau)
  minRadius: number      // e.g., 60
  maxRadius: number      // e.g., 300
}

/**
 * Position d'une poignée calculée à partir de la couronne
 */
export interface HandlePosition {
  x: number
  y: number
  theta: number          // angle absolu de cette poignée
}

/**
 * Données de vent/bateau pour les calculs vectoriels
 */
export interface WindData {
  angle: number          // radians
  speed: number          // knots
}

export interface BoatData {
  heading: number        // radians
  speed: number          // knots
}

/**
 * Vecteur 2D pour calculs géométriques
 */
export interface Vector2D {
  x: number
  y: number
}

/**
 * Coordonnées polaires
 */
export interface PolarCoords {
  angle: number          // radians
  magnitude: number
}