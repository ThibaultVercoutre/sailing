import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { useSailingStore } from '../stores/sailing'

export function useSailingCanvas(canvasRef: Ref<HTMLCanvasElement | null>) {
  const store = useSailingStore()
  const animationId = ref<number>()
  
  // État des vecteurs
  const boatHeading = ref(0) // Angle en radians
  const boatSpeed = ref(5) // Vitesse en nœuds (5-50)
  const windHeading = ref(- Math.PI / 4) // Angle du vent réel (45°)
  const windSpeed = ref(10) // Vitesse du vent en nœuds (5-50)
  
  // États d'interaction
  const isDraggingBoat = ref(false)
  const isResizingBoat = ref(false)
  const isDraggingWind = ref(false)
  const isResizingWind = ref(false)
  
  // Couleurs
  const boatColor = '#FF6B6B' // Rouge pour le bateau/vitesse
  const windColor = '#0066FF' // Bleu pour le vent réel
  
  // Échelle optimale : si le cercle actuel (100px) doit représenter 5n
  // alors 100px = 5n, donc 20 pixels par nœud
  const pixelsPerKnot = 10
  const minSpeed = 5
  const maxSpeed = 50
  
  // Calculer les rayons basés sur les vitesses
  const boatCircleRadius = computed(() => boatSpeed.value * pixelsPerKnot)
  const windCircleRadius = computed(() => windSpeed.value * pixelsPerKnot)

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
    
    // Configurer les interactions
    setupInteractions(canvas)
    
    // Démarrer la boucle d'animation
    startAnimation()
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

    // Dessiner le bateau au centre
    drawSimpleBoat(ctx)
    
    // Dessiner les cercles de contrôle
    drawBoatControlCircle(ctx)
    drawWindControlCircle(ctx)
    
    // Dessiner les vecteurs
    drawBoatVector(ctx)
    drawWindVector(ctx)
    drawApparentWindVector(ctx)
  }

  // Dessiner l'arrière-plan
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Fond bleu clair comme l'eau
    ctx.fillStyle = '#E6F3FF'
    ctx.fillRect(0, 0, store.canvas.width, store.canvas.height)
  }

  // Dessiner le cercle de contrôle du bateau
  const drawBoatControlCircle = (ctx: CanvasRenderingContext2D) => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    
    // Cercle de contrôle
    ctx.beginPath()
    ctx.arc(center.x, center.y, boatCircleRadius.value, 0, 2 * Math.PI)
    ctx.strokeStyle = boatColor
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Poignée sur le cercle
    const handleX = center.x + boatCircleRadius.value * Math.cos(boatHeading.value)
    const handleY = center.y + boatCircleRadius.value * Math.sin(boatHeading.value)
    
    ctx.beginPath()
    ctx.arc(handleX, handleY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = boatColor
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Afficher la vitesse sur le cercle
    ctx.fillStyle = boatColor
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${boatSpeed.value}kts`, center.x, center.y - boatCircleRadius.value - 20)
  }

  // Dessiner le cercle de contrôle du vent
  const drawWindControlCircle = (ctx: CanvasRenderingContext2D) => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    
    // Cercle de contrôle
    ctx.beginPath()
    ctx.arc(center.x, center.y, windCircleRadius.value, 0, 2 * Math.PI)
    ctx.strokeStyle = windColor
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Poignée sur le cercle
    const handleX = center.x + windCircleRadius.value * Math.cos(windHeading.value)
    const handleY = center.y + windCircleRadius.value * Math.sin(windHeading.value)
    
    ctx.beginPath()
    ctx.arc(handleX, handleY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = windColor
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Afficher la vitesse sur le cercle
    ctx.fillStyle = windColor
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${windSpeed.value}kts`, center.x, center.y - windCircleRadius.value - 20)
  }

  // Dessiner le vecteur vitesse du bateau
  const drawBoatVector = (ctx: CanvasRenderingContext2D) => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    const handleX = center.x + boatCircleRadius.value * Math.cos(boatHeading.value)
    const handleY = center.y + boatCircleRadius.value * Math.sin(boatHeading.value)
    
    // Ligne du vecteur
    ctx.beginPath()
    ctx.moveTo(center.x, center.y)
    ctx.lineTo(handleX, handleY)
    ctx.strokeStyle = boatColor
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Pointe de flèche
    const arrowSize = 12
    const arrowAngle = Math.PI / 6
    
    ctx.beginPath()
    ctx.moveTo(handleX, handleY)
    ctx.lineTo(
      handleX - arrowSize * Math.cos(boatHeading.value - arrowAngle),
      handleY - arrowSize * Math.sin(boatHeading.value - arrowAngle)
    )
    ctx.moveTo(handleX, handleY)
    ctx.lineTo(
      handleX - arrowSize * Math.cos(boatHeading.value + arrowAngle),
      handleY - arrowSize * Math.sin(boatHeading.value + arrowAngle)
    )
    ctx.strokeStyle = boatColor
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // Dessiner le vecteur vent réel
  const drawWindVector = (ctx: CanvasRenderingContext2D) => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    const handleX = center.x + windCircleRadius.value * Math.cos(windHeading.value)
    const handleY = center.y + windCircleRadius.value * Math.sin(windHeading.value)
    
    // Ligne du vecteur
    ctx.beginPath()
    ctx.moveTo(center.x, center.y)
    ctx.lineTo(handleX, handleY)
    ctx.strokeStyle = windColor
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Pointe de flèche
    const arrowSize = 12
    const arrowAngle = Math.PI / 6
    
    ctx.beginPath()
    ctx.moveTo(handleX, handleY)
    ctx.lineTo(
      handleX - arrowSize * Math.cos(windHeading.value - arrowAngle),
      handleY - arrowSize * Math.sin(windHeading.value - arrowAngle)
    )
    ctx.moveTo(handleX, handleY)
    ctx.lineTo(
      handleX - arrowSize * Math.cos(windHeading.value + arrowAngle),
      handleY - arrowSize * Math.sin(windHeading.value + arrowAngle)
    )
    ctx.strokeStyle = windColor
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // Dessiner le vecteur vent apparent
  const drawApparentWindVector = (ctx: CanvasRenderingContext2D) => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    const handleX = center.x + windCircleRadius.value * Math.cos(windHeading.value) + boatCircleRadius.value * Math.cos(boatHeading.value)
    const handleY = center.y + windCircleRadius.value * Math.sin(windHeading.value) + boatCircleRadius.value * Math.sin(boatHeading.value)
    
    // Ligne du vecteur
    ctx.beginPath()
    ctx.moveTo(center.x, center.y)
    ctx.lineTo(handleX, handleY)
    ctx.strokeStyle = 'green'
    ctx.lineWidth = 3
    ctx.stroke()

    // Pointe de flèche
    const arrowSize = 12
    const arrowAngle = Math.PI / 6
    
    ctx.beginPath()
    ctx.moveTo(handleX, handleY)
    ctx.lineTo(
      handleX - arrowSize * Math.cos(Math.atan2(handleY - center.y, handleX - center.x) + arrowAngle),
      handleY - arrowSize * Math.sin(Math.atan2(handleY - center.y, handleX - center.x) + arrowAngle)
    )
    ctx.moveTo(handleX, handleY)
    ctx.lineTo(
      handleX - arrowSize * Math.cos(Math.atan2(handleY - center.y, handleX - center.x) - arrowAngle),
      handleY - arrowSize * Math.sin(Math.atan2(handleY - center.y, handleX - center.x) - arrowAngle)
    )
    ctx.strokeStyle = 'green'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // Dessiner un bateau simple
  const drawSimpleBoat = (ctx: CanvasRenderingContext2D) => {
    const center = { x: store.canvas.centerX, y: store.canvas.centerY }
    const heading = boatHeading.value + Math.PI // Bateau orienté dans la direction opposée au vecteur vitesse
    const size = 30
    
    ctx.save()
    ctx.translate(center.x, center.y)
    ctx.rotate(heading)
    
    // Coque de la barque (forme allongée)
    ctx.beginPath()
    ctx.moveTo(-size, -size/4)
    ctx.quadraticCurveTo(size/2, -size/3, size, 0)
    ctx.quadraticCurveTo(size/2, size/3, -size, size/4)
    ctx.closePath()
    ctx.fillStyle = '#8B4513' // Marron pour la coque
    ctx.fill()
    ctx.strokeStyle = '#654321'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Voile courbée (arc de cercle sur le côté)
    ctx.beginPath()
    ctx.arc(-size/2, -size*1.5, size*2, Math.PI / 4, Math.PI / 2)
    ctx.strokeStyle = '#FF6B6B'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Point pour indiquer la proue
    ctx.beginPath()
    ctx.arc(size*0.8, 0, 3, 0, 2 * Math.PI)
    ctx.fillStyle = '#FF6B6B'
    ctx.fill()
    
    ctx.restore()
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

  // Configurer les interactions avec la souris
  const setupInteractions = (canvas: HTMLCanvasElement) => {
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const center = { x: store.canvas.centerX, y: store.canvas.centerY }
      const distanceFromCenter = Math.sqrt(
        Math.pow(mouseX - center.x, 2) + Math.pow(mouseY - center.y, 2)
      )
      
      // Vérifier les poignées du bateau
      const boatHandleX = center.x + boatCircleRadius.value * Math.cos(boatHeading.value)
      const boatHandleY = center.y + boatCircleRadius.value * Math.sin(boatHeading.value)
      const distanceToBoatHandle = Math.sqrt(
        Math.pow(mouseX - boatHandleX, 2) + Math.pow(mouseY - boatHandleY, 2)
      )
      
      // Vérifier les poignées du vent
      const windHandleX = center.x + windCircleRadius.value * Math.cos(windHeading.value)
      const windHandleY = center.y + windCircleRadius.value * Math.sin(windHeading.value)
      const distanceToWindHandle = Math.sqrt(
        Math.pow(mouseX - windHandleX, 2) + Math.pow(mouseY - windHandleY, 2)
      )
      
      if (distanceToBoatHandle <= 15) {
        // Clic sur la poignée du bateau = rotation bateau
        isDraggingBoat.value = true
        console.log('Boat rotation mode activated')
        e.preventDefault()
      } else if (distanceToWindHandle <= 15) {
        // Clic sur la poignée du vent = rotation vent
        isDraggingWind.value = true
        console.log('Wind rotation mode activated')
        e.preventDefault()
      } else if (distanceFromCenter >= 30 && Math.abs(distanceFromCenter - boatCircleRadius.value) <= 20) {
        // Clic sur le cercle du bateau = redimensionnement bateau
        isResizingBoat.value = true
        console.log('Boat resizing mode activated')
        e.preventDefault()
      } else if (distanceFromCenter >= 30 && Math.abs(distanceFromCenter - windCircleRadius.value) <= 20) {
        // Clic sur le cercle du vent = redimensionnement vent
        isResizingWind.value = true
        console.log('Wind resizing mode activated')
        e.preventDefault()
      }
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingBoat.value && !isResizingBoat.value && !isDraggingWind.value && !isResizingWind.value) return
      
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const center = { x: store.canvas.centerX, y: store.canvas.centerY }
      
      if (isDraggingBoat.value) {
        // Rotation de l'angle du bateau
        const angle = Math.atan2(mouseY - center.y, mouseX - center.x)
        boatHeading.value = angle
      } else if (isDraggingWind.value) {
        // Rotation de l'angle du vent
        const angle = Math.atan2(mouseY - center.y, mouseX - center.x)
        windHeading.value = angle
      } else if (isResizingBoat.value) {
        // Changement de la vitesse du bateau
        const distance = Math.sqrt(
          Math.pow(mouseX - center.x, 2) + Math.pow(mouseY - center.y, 2)
        )
        const newSpeed = Math.max(minSpeed, Math.min(maxSpeed, distance / pixelsPerKnot))
        boatSpeed.value = Math.round(newSpeed * 10) / 10
        console.log('New boat speed:', boatSpeed.value)
      } else if (isResizingWind.value) {
        // Changement de la vitesse du vent
        const distance = Math.sqrt(
          Math.pow(mouseX - center.x, 2) + Math.pow(mouseY - center.y, 2)
        )
        const newSpeed = Math.max(minSpeed, Math.min(maxSpeed, distance / pixelsPerKnot))
        windSpeed.value = Math.round(newSpeed * 10) / 10
        console.log('New wind speed:', windSpeed.value)
      }
      
      e.preventDefault()
    }
    
    const handleMouseUp = () => {
      isDraggingBoat.value = false
      isResizingBoat.value = false
      isDraggingWind.value = false
      isResizingWind.value = false
    }
    
    canvas.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Cycle de vie
  onMounted(() => {
    if (canvasRef.value) {
      initCanvas()
      window.addEventListener('resize', handleResize)
    }
  })

  onUnmounted(() => {
    stopAnimation()
    window.removeEventListener('resize', handleResize)
  })

  return {
    initCanvas,
    draw
  }
}