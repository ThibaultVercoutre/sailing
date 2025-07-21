import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSailingStore } from '~/stores/sailing'
import { degToRad } from '~/composables/useWindCalculations'

describe('sailing store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default state', () => {
    const store = useSailingStore()
    
    expect(store.trueWind.angle).toBe(degToRad(0))
    expect(store.trueWind.speed).toBe(10)
    expect(store.boat.heading).toBe(degToRad(45))
    expect(store.boat.speed).toBe(6)
    expect(store.trueWind.handles).toHaveLength(3)
    expect(store.boat.handles).toHaveLength(4)
    expect(store.selectedHandle).toBeNull()
    expect(store.isDragging).toBe(false)
  })

  it('updates canvas dimensions correctly', () => {
    const store = useSailingStore()
    
    store.updateCanvasDimensions(1000, 800)
    
    expect(store.canvas.width).toBe(1000)
    expect(store.canvas.height).toBe(800)
    expect(store.canvas.centerX).toBe(500)
    expect(store.canvas.centerY).toBe(400)
    expect(store.canvas.outerRadius).toBe(280) // Math.min(1000, 800) * 0.35
    expect(store.canvas.innerRadius).toBe(200) // Math.min(1000, 800) * 0.25
  })

  it('updates handle position correctly', () => {
    const store = useSailingStore()
    
    const newAngle = degToRad(90)
    const newDistance = 0.8
    
    store.updateHandle('wind-1', newAngle, newDistance)
    
    const handle = store.trueWind.handles.find(h => h.id === 'wind-1')
    expect(handle?.angle).toBeCloseTo(newAngle)
    expect(handle?.distance).toBe(newDistance)
  })

  it('clamps handle distance to valid range', () => {
    const store = useSailingStore()
    
    // Test clamping to max
    store.updateHandle('wind-1', 0, 2.0)
    let handle = store.trueWind.handles.find(h => h.id === 'wind-1')
    expect(handle?.distance).toBe(1.0)
    
    // Test clamping to min
    store.updateHandle('wind-1', 0, -0.5)
    handle = store.trueWind.handles.find(h => h.id === 'wind-1')
    expect(handle?.distance).toBe(0.0)
  })

  it('sets handle dragging state correctly', () => {
    const store = useSailingStore()
    
    store.setHandleDragging('wind-1', true)
    
    expect(store.isDragging).toBe(true)
    expect(store.selectedHandle).toBe('wind-1')
    
    const handle = store.trueWind.handles.find(h => h.id === 'wind-1')
    expect(handle?.isDragging).toBe(true)
    
    store.setHandleDragging('wind-1', false)
    
    expect(store.isDragging).toBe(false)
    expect(store.selectedHandle).toBeNull()
    expect(handle?.isDragging).toBe(false)
  })

  it('calculates apparent wind correctly', () => {
    const store = useSailingStore()
    
    // Set known values
    store.trueWind.angle = degToRad(0) // North wind
    store.trueWind.speed = 10
    store.boat.heading = degToRad(0) // Heading north
    store.boat.speed = 5
    
    store.calculateApparentWind()
    
    // Head wind: apparent should be same direction, reduced speed
    expect(store.apparentWind.angle).toBeCloseTo(degToRad(0))
    expect(store.apparentWind.speed).toBeCloseTo(5)
  })

  it('updates true wind from handles', () => {
    const store = useSailingStore()
    
    // Update primary handle
    const primaryHandle = store.trueWind.handles.find(h => h.id === 'wind-1')!
    primaryHandle.angle = degToRad(90)
    primaryHandle.distance = 0.5
    
    store.updateTrueWindFromHandles()
    
    expect(store.trueWind.angle).toBeCloseTo(degToRad(90))
    expect(store.trueWind.speed).toBeCloseTo(15) // 0.5 * 30 = 15
  })

  it('updates boat from handles', () => {
    const store = useSailingStore()
    
    // Update primary handle
    const primaryHandle = store.boat.handles.find(h => h.id === 'boat-1')!
    primaryHandle.angle = degToRad(180)
    primaryHandle.distance = 0.3
    
    store.updateBoatFromHandles()
    
    expect(store.boat.heading).toBeCloseTo(degToRad(180))
    expect(store.boat.speed).toBeCloseTo(6) // 0.3 * 20 = 6
  })

  it('moves selected handle with keyboard', () => {
    const store = useSailingStore()
    
    store.selectedHandle = 'wind-1'
    const originalHandle = store.trueWind.handles.find(h => h.id === 'wind-1')!
    const originalAngle = originalHandle.angle
    const originalDistance = originalHandle.distance
    
    // Test angle movement
    store.moveSelectedHandle('right')
    expect(originalHandle.angle).toBeGreaterThan(originalAngle)
    
    store.moveSelectedHandle('left')
    expect(originalHandle.angle).toBeCloseTo(originalAngle)
    
    // Test distance movement
    store.moveSelectedHandle('up')
    expect(originalHandle.distance).toBeGreaterThan(originalDistance)
    
    store.moveSelectedHandle('down')
    expect(originalHandle.distance).toBeCloseTo(originalDistance)
  })

  it('handles non-existent handle updates gracefully', () => {
    const store = useSailingStore()
    
    expect(() => {
      store.updateHandle('non-existent', 0, 0.5)
    }).not.toThrow()
  })

  describe('getters', () => {
    it('calculates primary wind direction correctly', () => {
      const store = useSailingStore()
      
      const primaryHandle = store.trueWind.handles.find(h => h.id === 'wind-1')!
      primaryHandle.angle = degToRad(120)
      
      expect(store.primaryWindDirection).toBeCloseTo(degToRad(120))
    })

    it('calculates primary wind speed correctly', () => {
      const store = useSailingStore()
      
      const primaryHandle = store.trueWind.handles.find(h => h.id === 'wind-1')!
      primaryHandle.distance = 0.6
      
      expect(store.primaryWindSpeed).toBeCloseTo(18) // 0.6 * 30
    })

    it('calculates handle positions correctly', () => {
      const store = useSailingStore()
      store.updateCanvasDimensions(800, 600)
      
      const handle = store.trueWind.handles[0]
      handle.angle = degToRad(0)
      handle.distance = 0.5
      
      const position = store.getHandlePosition(handle)
      
      expect(position.x).toBeGreaterThan(store.canvas.centerX)
      expect(position.y).toBeCloseTo(store.canvas.centerY)
    })

    it('gets other handle angles for collision detection', () => {
      const store = useSailingStore()
      
      const otherAngles = store.getOtherHandleAngles('wind-1', 'wind')
      
      expect(otherAngles).toHaveLength(2) // 3 total - 1 excluded
      expect(otherAngles).not.toContain(store.trueWind.handles.find(h => h.id === 'wind-1')?.angle)
    })

    it('converts angles to degrees for display', () => {
      const store = useSailingStore()
      
      store.trueWind.angle = degToRad(90)
      store.boat.heading = degToRad(180)
      store.apparentWind.angle = degToRad(270)
      
      expect(store.trueWindAngleDegrees).toBe(90)
      expect(store.boatHeadingDegrees).toBe(180)
      expect(store.apparentWindAngleDegrees).toBe(270)
    })
  })
})