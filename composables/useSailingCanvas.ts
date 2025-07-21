import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { useSailingStore } from '../stores/sailing'
import {
  distance,
  radToDeg,
  type Vector2D
} from './useWindCalculations'
import type { Ring, HandlePosition } from '../types/interfaces'

export function useSailingCanvas(canvasRef: Ref<HTMLCanvasElement | null>) {
  const store = useSailingStore()
  const animationId = ref<number>()
  const gestureCleanup = ref<(() => void) | null>(null)

  // Initialiser le canvas et démarrer la boucle d'animation
  const initCanvas = () => {
    if (!canvasRef.value) return

    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    
    // Définir la taille du canvas
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // Mettre à jour les dimensions dans le store
    store.updateCanvasDimensions(rect.width, rect.height)
    
    // Initialiser le store
    store.initialize()
    
    // Configurer la gestion des gestes
    setupGestures(canvas)
    
    // Démarrer la boucle d'animation
    startAnimation()
  }

  // Configurer la gestion des gestes avec des événements natifs
  const setupGestures = (canvas: HTMLCanvasElement) => {
    let isDragging = false
    let currentRing: 'wind' | 'boat' | null = null
    
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const canvasPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      
      // Déterminer quelle couronne est cliquée
      const ring = getRingAt(canvasPoint)
      if (ring) {
        currentRing = ring
        isDragging = true
        store.startRingDrag(ring, canvasPoint)
        e.preventDefault()
      } else {
        // Clic dans le vide - désélectionner
        store.selectRing(null)
      }
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !currentRing) return
      
      const rect = canvas.getBoundingClientRect()
      const canvasPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      
      store.updateRingDrag(canvasPoint)
      e.preventDefault()
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging && currentRing) {
        store.endRingDrag()
        // Garder la couronne sélectionnée après le drag
        store.selectRing(currentRing)
      }
      
      isDragging = false
      currentRing = null
      e.preventDefault()
    }
    
    canvas.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    gestureCleanup.value = () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove) 
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }

  // Déterminer quelle couronne est à un point donné
  const getRingAt = (point: Vector2D): 'wind' | 'boat' | null => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    const distFromCenter = distance(point, center)
    
    // Tolérance pour cliquer sur une couronne
    const tolerance = 20
    
    // Vérifier la couronne de vent (extérieure)
    if (Math.abs(distFromCenter - store.windRing.radius) < tolerance) {
      return 'wind'
    }
    
    // Vérifier la couronne du bateau (intérieure)  
    if (Math.abs(distFromCenter - store.boatRing.radius) < tolerance) {
      return 'boat'
    }
    
    return null
  }

  // Boucle d'animation
  const animate = () => {
    if (!canvasRef.value) return
    
    draw()
    animationId.value = requestAnimationFrame(animate)
  }

  const startAnimation = () => {
    if (animationId.value) {
      cancelAnimationFrame(animationId.value)
    }
    animate()
  }

  const stopAnimation = () => {
    if (animationId.value) {
      cancelAnimationFrame(animationId.value)
      animationId.value = undefined
    }
  }

  // Fonction principale de dessin
  const draw = () => {
    if (!canvasRef.value) return
    
    const ctx = canvasRef.value.getContext('2d')
    if (!ctx) return
    
    // Effacer le canvas
    ctx.clearRect(0, 0, store.canvas.width, store.canvas.height)
    
    // Dessiner l'arrière-plan
    drawBackground(ctx)
    
    // Dessiner les couronnes
    drawRing(ctx, store.windRing, '#0E4D92', 'wind')
    drawRing(ctx, store.boatRing, '#00A3E0', 'boat')
    
    // Dessiner le voilier au centre
    drawSailboat(ctx)
    
    // Dessiner les vecteurs de vent
    drawTrueWindVector(ctx)
    drawBoatSpeedVector(ctx)
    drawApparentWindVector(ctx)
    
    // Dessiner la rose des vents
    drawCompassRose(ctx)
  }

  // Dessiner l'arrière-plan
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#F5F7FA'
    ctx.fillRect(0, 0, store.canvas.width, store.canvas.height)
  }

  // Dessiner une couronne complète
  const drawRing = (ctx: CanvasRenderingContext2D, ring: Ring, color: string, ringType: 'wind' | 'boat') => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    const isSelected = store.selectedRing === ringType
    
    // Dessiner le cercle de la couronne
    ctx.beginPath()
    ctx.arc(center.x, center.y, ring.radius, 0, 2 * Math.PI)
    ctx.strokeStyle = color
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.stroke()
    
    // Calculer et dessiner les poignées avec lignes radiales
    const handles = store.ringHandles(ring)
    
    handles.forEach((handle, index) => {
      // Dessiner la ligne radiale
      ctx.beginPath()
      ctx.moveTo(center.x, center.y)
      ctx.lineTo(handle.x, handle.y)
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.7
      ctx.stroke()
      ctx.globalAlpha = 1
      
      // Dessiner la poignée
      ctx.beginPath()
      ctx.arc(handle.x, handle.y, 8, 0, 2 * Math.PI)
      ctx.fillStyle = 'white'
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.stroke()
    })
    
    // Dessiner le label de vitesse à mi-rayon
    const speed = ringType === 'wind' ? store.windSpeed : store.boatSpeed
    const labelRadius = ring.radius * 0.6
    const labelX = center.x + labelRadius
    const labelY = center.y
    
    // Fond pour le texte
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillRect(labelX - 15, labelY - 8, 30, 16)
    
    // Texte de vitesse
    ctx.fillStyle = color
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${speed.toFixed(0)} kts`, labelX, labelY)
  }

  // Dessiner le voilier au centre
  const drawSailboat = (ctx: CanvasRenderingContext2D) => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    const heading = store.boatRing.angle
    const size = 24
    
    ctx.save()
    ctx.translate(center.x, center.y)
    ctx.rotate(heading)
    
    // Coque du bateau
    ctx.beginPath()
    ctx.moveTo(0, -size)
    ctx.lineTo(-size/3, size/2)
    ctx.quadraticCurveTo(0, size, size/3, size/2)
    ctx.closePath()
    ctx.fillStyle = '#0E4D92'
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 1.5
    ctx.stroke()
    
    // Mât
    ctx.beginPath()
    ctx.moveTo(0, -size)
    ctx.lineTo(0, size/2)
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Grand-voile
    ctx.beginPath()
    ctx.moveTo(0, -size)
    ctx.lineTo(size/2, -size/3)
    ctx.lineTo(size/2, size/4)
    ctx.lineTo(0, size/3)
    ctx.closePath()
    ctx.fillStyle = 'rgba(0, 163, 224, 0.8)'
    ctx.fill()
    ctx.strokeStyle = '#00A3E0'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Foc
    ctx.beginPath()
    ctx.moveTo(0, -size/2)
    ctx.lineTo(-size/3, -size/4)
    ctx.lineTo(0, size/6)
    ctx.closePath()
    ctx.fillStyle = 'rgba(0, 163, 224, 0.6)'
    ctx.fill()
    ctx.strokeStyle = '#00A3E0'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Point rouge pour indiquer la proue
    ctx.beginPath()
    ctx.arc(0, -size * 0.8, 2, 0, 2 * Math.PI)
    ctx.fillStyle = '#FF6B6B'
    ctx.fill()
    
    ctx.restore()
  }

  // Fonction générique pour dessiner un vecteur flèche
  const drawWindVector = (
    ctx: CanvasRenderingContext2D, 
    angle: number, 
    speed: number, 
    color: string, 
    scale: number = 4,
    maxLength: number = 120
  ) => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    const vectorLength = Math.min(maxLength, speed * scale)
    
    console.log('Drawing vector:', { angle, speed, vectorLength, color })
    
    // Force minimum length for testing
    const finalLength = Math.max(20, vectorLength)
    
    const endX = center.x + finalLength * Math.cos(angle)
    const endY = center.y + finalLength * Math.sin(angle)
    
    // Ligne du vecteur
    ctx.beginPath()
    ctx.moveTo(center.x, center.y)
    ctx.lineTo(endX, endY)
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Pointe de flèche
    const arrowSize = 10
    const arrowAngle = Math.PI / 6
    
    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - arrowAngle),
      endY - arrowSize * Math.sin(angle - arrowAngle)
    )
    ctx.moveTo(endX, endY)
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + arrowAngle),
      endY - arrowSize * Math.sin(angle + arrowAngle)
    )
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // Dessiner le vecteur de vent réel (bleu)
  const drawTrueWindVector = (ctx: CanvasRenderingContext2D) => {
    console.log('True wind:', store.windRing.angle, store.windSpeed)
    drawWindVector(ctx, store.windRing.angle, store.windSpeed, '#0066FF', 4, 120)
  }

  // Dessiner le vecteur de vitesse du bateau (rouge)
  const drawBoatSpeedVector = (ctx: CanvasRenderingContext2D) => {
    console.log('Boat speed:', store.boatRing.angle, store.boatSpeed)
    drawWindVector(ctx, store.boatRing.angle, store.boatSpeed, '#FF0000', 6, 100)
  }

  // Dessiner le vecteur de vent apparent (vert)
  const drawApparentWindVector = (ctx: CanvasRenderingContext2D) => {
    console.log('Apparent wind:', store.apparentWind.angle, store.apparentWind.speed)
    drawWindVector(ctx, store.apparentWind.angle, store.apparentWind.speed, '#00AA00', 4, 120)
  }

  // Dessiner la rose des vents
  const drawCompassRose = (ctx: CanvasRenderingContext2D) => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    const radius = Math.max(store.windRing.maxRadius, store.boatRing.maxRadius) + 40
    
    const directions = [
      { angle: -Math.PI/2, label: 'N' },
      { angle: 0, label: 'E' },
      { angle: Math.PI/2, label: 'S' },
      { angle: Math.PI, label: 'W' }
    ]
    
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#0E4D92'
    
    for (const dir of directions) {
      const x = center.x + radius * Math.cos(dir.angle)
      const y = center.y + radius * Math.sin(dir.angle)
      ctx.fillText(dir.label, x, y)
    }
  }

  // Gérer le redimensionnement de la fenêtre
  const handleResize = () => {
    if (!canvasRef.value) return
    
    const rect = canvasRef.value.getBoundingClientRect()
    canvasRef.value.width = rect.width * window.devicePixelRatio
    canvasRef.value.height = rect.height * window.devicePixelRatio
    
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    
    store.updateCanvasDimensions(rect.width, rect.height)
  }

  // Gestion du clavier
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!store.selectedRing) return
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        store.moveSelectedRing('left')
        break
      case 'ArrowRight':
        event.preventDefault()
        store.moveSelectedRing('right')
        break
      case 'ArrowUp':
        event.preventDefault()
        store.moveSelectedRing('up')
        break
      case 'ArrowDown':
        event.preventDefault()
        store.moveSelectedRing('down')
        break
      case 'Escape':
        store.selectRing(null)
        break
    }
  }

  // Cycle de vie
  onMounted(() => {
    if (canvasRef.value) {
      initCanvas()
      window.addEventListener('resize', handleResize)
      window.addEventListener('keydown', handleKeyDown)
    }
  })

  onUnmounted(() => {
    stopAnimation()
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', handleKeyDown)
    if (gestureCleanup.value) {
      gestureCleanup.value()
    }
  })

  return {
    initCanvas,
    draw
  }
}