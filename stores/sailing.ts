import { defineStore } from 'pinia'
import { 
  calculateApparentWind,
  degToRad,
  radToDeg,
  normalizeAngle
} from '../composables/useWindCalculations'
import type { 
  Ring, 
  WindData, 
  BoatData, 
  Vector2D,
  HandlePosition 
} from '../types/interfaces'

export interface SailingState {
  // Ring-based system
  windRing: Ring
  boatRing: Ring
  
  // Calculated apparent wind
  apparentWind: WindData
  
  // Canvas dimensions
  canvas: {
    width: number
    height: number
    centerX: number
    centerY: number
  }
  
  // UI state
  selectedRing: 'wind' | 'boat' | null
  isDragging: boolean
  dragStart: Vector2D | null
}

export const useSailingStore = defineStore('sailing', {
  state: (): SailingState => ({
    windRing: {
      angle: degToRad(0), // Direction principale du vent (Est = 0)
      radius: 180, // Rayon actuel en px
      spokes: 3, // 3 poignées pour le vent
      minRadius: 80,
      maxRadius: 250
    },
    
    boatRing: {
      angle: degToRad(45), // Cap du bateau (NE)
      radius: 120, // Rayon actuel en px
      spokes: 4, // 4 poignées pour le bateau
      minRadius: 60,
      maxRadius: 180
    },
    
    apparentWind: {
      angle: degToRad(0),
      speed: 0
    },
    
    canvas: {
      width: 800,
      height: 600,
      centerX: 400,
      centerY: 300
    },
    
    selectedRing: null,
    isDragging: false,
    dragStart: null
  }),

  getters: {
    // Calculer les positions des poignées pour une couronne
    ringHandles: (state) => (ring: Ring): HandlePosition[] => {
      return Array.from({ length: ring.spokes }, (_, i) => {
        const theta = ring.angle + (i * 2 * Math.PI) / ring.spokes
        return {
          x: state.canvas.centerX + ring.radius * Math.cos(theta),
          y: state.canvas.centerY + ring.radius * Math.sin(theta),
          theta: normalizeAngle(theta)
        }
      })
    },

    // Positions des poignées du vent
    windHandles(state): HandlePosition[] {
      return this.ringHandles(state.windRing)
    },

    // Positions des poignées du bateau
    boatHandles(state): HandlePosition[] {
      return this.ringHandles(state.boatRing)
    },

    // Vitesse du vent (basée sur le rayon)
    windSpeed: (state): number => {
      const normalized = (state.windRing.radius - state.windRing.minRadius) / 
                        (state.windRing.maxRadius - state.windRing.minRadius)
      return normalized * 30 // Max 30 knots
    },
    
    // Vitesse du bateau (basée sur le rayon)
    boatSpeed: (state): number => {
      const normalized = (state.boatRing.radius - state.boatRing.minRadius) / 
                        (state.boatRing.maxRadius - state.boatRing.minRadius)
      return normalized * 20 // Max 20 knots
    },

    // Angles en degrés pour l'affichage
    windAngleDegrees: (state): number => {
      return Math.round(radToDeg(state.windRing.angle))
    },
    
    boatHeadingDegrees: (state): number => {
      return Math.round(radToDeg(state.boatRing.angle))
    },
    
    apparentWindAngleDegrees: (state): number => {
      return Math.round(radToDeg(state.apparentWind.angle))
    }
  },

  actions: {
    // Mettre à jour les dimensions du canvas
    updateCanvasDimensions(width: number, height: number) {
      this.canvas.width = width
      this.canvas.height = height
      this.canvas.centerX = width / 2
      this.canvas.centerY = height / 2
      
      // Ajuster les rayons en fonction de la taille du canvas
      const maxSize = Math.min(width, height) * 0.4
      
      this.windRing.maxRadius = maxSize
      this.windRing.minRadius = maxSize * 0.4
      this.windRing.radius = Math.min(this.windRing.radius, maxSize)
      
      this.boatRing.maxRadius = maxSize * 0.8
      this.boatRing.minRadius = maxSize * 0.3
      this.boatRing.radius = Math.min(this.boatRing.radius, this.boatRing.maxRadius)
    },

    // Démarrer un drag sur une couronne
    startRingDrag(ringType: 'wind' | 'boat', startPoint: Vector2D) {
      this.selectedRing = ringType
      this.isDragging = true
      this.dragStart = { ...startPoint }
    },

    // Mettre à jour une couronne pendant le drag
    updateRingDrag(currentPoint: Vector2D) {
      if (!this.selectedRing || !this.dragStart || !this.isDragging) return
      
      const ring = this.selectedRing === 'wind' ? this.windRing : this.boatRing
      const center = { x: this.canvas.centerX, y: this.canvas.centerY }
      
      // Calculer les vecteurs depuis le centre
      const startVector = {
        x: this.dragStart.x - center.x,
        y: this.dragStart.y - center.y
      }
      const currentVector = {
        x: currentPoint.x - center.x,
        y: currentPoint.y - center.y
      }
      
      const startRadius = Math.sqrt(startVector.x ** 2 + startVector.y ** 2)
      const currentRadius = Math.sqrt(currentVector.x ** 2 + currentVector.y ** 2)
      
      // Calculer les deltas
      const deltaR = currentRadius - startRadius
      const startAngle = Math.atan2(startVector.y, startVector.x)
      const currentAngle = Math.atan2(currentVector.y, currentVector.x)
      const deltaTheta = normalizeAngle(currentAngle - startAngle)
      
      // Déterminer si le mouvement est plus radial ou tangentiel
      const radialMovement = Math.abs(deltaR)
      const tangentialMovement = Math.abs(startRadius * deltaTheta)
      
      if (radialMovement > tangentialMovement) {
        // Mouvement radial -> modifier le rayon (vitesse)
        const newRadius = Math.max(ring.minRadius, 
          Math.min(ring.maxRadius, ring.radius + deltaR))
        
        if (this.selectedRing === 'wind') {
          this.windRing.radius = newRadius
        } else {
          this.boatRing.radius = newRadius
        }
      } else {
        // Mouvement tangentiel -> rotation de la couronne
        const newAngle = normalizeAngle(ring.angle + deltaTheta)
        
        if (this.selectedRing === 'wind') {
          this.windRing.angle = newAngle
        } else {
          this.boatRing.angle = newAngle
        }
      }
      
      // Mettre à jour le point de départ pour le prochain delta
      this.dragStart = { ...currentPoint }
      
      // Recalculer le vent apparent
      this.calculateApparentWind()
    },

    // Arrêter le drag
    endRingDrag() {
      this.selectedRing = null
      this.isDragging = false
      this.dragStart = null
    },

    // Calculer le vent apparent
    calculateApparentWind() {
      this.apparentWind = calculateApparentWind(
        { angle: this.windRing.angle, speed: this.windSpeed },
        { heading: this.boatRing.angle, speed: this.boatSpeed }
      )
    },

    // Initialiser l'état par défaut
    initialize() {
      this.calculateApparentWind()
    },

    // Contrôles clavier pour la couronne sélectionnée
    moveSelectedRing(direction: 'left' | 'right' | 'up' | 'down', step: number = 0.05) {
      if (!this.selectedRing) return
      
      const ring = this.selectedRing === 'wind' ? this.windRing : this.boatRing
      
      switch (direction) {
        case 'left':
          ring.angle = normalizeAngle(ring.angle - degToRad(5))
          break
        case 'right':
          ring.angle = normalizeAngle(ring.angle + degToRad(5))
          break
        case 'up':
          ring.radius = Math.min(ring.maxRadius, ring.radius + ring.maxRadius * step)
          break
        case 'down':
          ring.radius = Math.max(ring.minRadius, ring.radius - ring.maxRadius * step)
          break
      }
      
      this.calculateApparentWind()
    },

    // Sélectionner une couronne au clic
    selectRing(ringType: 'wind' | 'boat' | null) {
      this.selectedRing = ringType
    }
  }
})