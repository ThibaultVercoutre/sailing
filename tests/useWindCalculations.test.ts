import { describe, it, expect } from 'vitest'
import {
  degToRad,
  radToDeg,
  normalizeAngle,
  polarToCartesian,
  cartesianToPolar,
  addVectors,
  subtractVectors,
  scaleVector,
  calculateApparentWind,
  angleCollision,
  constrainAngle,
  distance,
  getAngleFromCenter,
  clamp,
  knotsToMs,
  msToKnots
} from '~/composables/useWindCalculations'

describe('useWindCalculations', () => {
  describe('angle conversions', () => {
    it('converts degrees to radians correctly', () => {
      expect(degToRad(0)).toBe(0)
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2)
      expect(degToRad(180)).toBeCloseTo(Math.PI)
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI)
    })

    it('converts radians to degrees correctly', () => {
      expect(radToDeg(0)).toBe(0)
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90)
      expect(radToDeg(Math.PI)).toBeCloseTo(180)
      expect(radToDeg(2 * Math.PI)).toBeCloseTo(360)
    })

    it('normalizes angles to 0-2π range', () => {
      expect(normalizeAngle(0)).toBe(0)
      expect(normalizeAngle(Math.PI)).toBe(Math.PI)
      expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0)
      expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(3 * Math.PI / 2)
      expect(normalizeAngle(5 * Math.PI)).toBeCloseTo(Math.PI)
    })
  })

  describe('coordinate conversions', () => {
    it('converts polar to cartesian correctly', () => {
      const result = polarToCartesian({ angle: 0, magnitude: 1 })
      expect(result.x).toBeCloseTo(1)
      expect(result.y).toBeCloseTo(0)

      const result2 = polarToCartesian({ angle: Math.PI / 2, magnitude: 1 })
      expect(result2.x).toBeCloseTo(0)
      expect(result2.y).toBeCloseTo(1)
    })

    it('converts cartesian to polar correctly', () => {
      const result = cartesianToPolar({ x: 1, y: 0 })
      expect(result.angle).toBeCloseTo(0)
      expect(result.magnitude).toBeCloseTo(1)

      const result2 = cartesianToPolar({ x: 0, y: 1 })
      expect(result2.angle).toBeCloseTo(Math.PI / 2)
      expect(result2.magnitude).toBeCloseTo(1)
    })

    it('handles polar-cartesian round trip conversions', () => {
      const original = { angle: Math.PI / 4, magnitude: 5 }
      const cartesian = polarToCartesian(original)
      const backToPolar = cartesianToPolar(cartesian)
      
      expect(backToPolar.angle).toBeCloseTo(original.angle)
      expect(backToPolar.magnitude).toBeCloseTo(original.magnitude)
    })
  })

  describe('vector operations', () => {
    it('adds vectors correctly', () => {
      const a = { x: 1, y: 2 }
      const b = { x: 3, y: 4 }
      const result = addVectors(a, b)
      
      expect(result.x).toBe(4)
      expect(result.y).toBe(6)
    })

    it('subtracts vectors correctly', () => {
      const a = { x: 5, y: 3 }
      const b = { x: 2, y: 1 }
      const result = subtractVectors(a, b)
      
      expect(result.x).toBe(3)
      expect(result.y).toBe(2)
    })

    it('scales vectors correctly', () => {
      const vector = { x: 2, y: 3 }
      const result = scaleVector(vector, 2)
      
      expect(result.x).toBe(4)
      expect(result.y).toBe(6)
    })
  })

  describe('speed conversions', () => {
    it('converts knots to m/s correctly', () => {
      expect(knotsToMs(1)).toBeCloseTo(0.514444)
      expect(knotsToMs(10)).toBeCloseTo(5.14444)
    })

    it('converts m/s to knots correctly', () => {
      expect(msToKnots(0.514444)).toBeCloseTo(1)
      expect(msToKnots(5.14444)).toBeCloseTo(10)
    })

    it('handles knots-m/s round trip conversions', () => {
      const original = 15
      const ms = knotsToMs(original)
      const backToKnots = msToKnots(ms)
      
      expect(backToKnots).toBeCloseTo(original)
    })
  })

  describe('apparent wind calculation', () => {
    it('calculates apparent wind correctly for head wind', () => {
      const trueWind = { angle: 0, speed: 10 } // North, 10 knots
      const boat = { heading: 0, speed: 5 } // North, 5 knots
      
      const apparent = calculateApparentWind(trueWind, boat)
      
      expect(apparent.angle).toBeCloseTo(0) // Still north
      expect(apparent.speed).toBeCloseTo(5) // 10 - 5 = 5 knots
    })

    it('calculates apparent wind correctly for tail wind', () => {
      const trueWind = { angle: Math.PI, speed: 10 } // South, 10 knots  
      const boat = { heading: 0, speed: 5 } // North, 5 knots
      
      const apparent = calculateApparentWind(trueWind, boat)
      
      expect(apparent.angle).toBeCloseTo(Math.PI) // Still south
      expect(apparent.speed).toBeCloseTo(15) // 10 + 5 = 15 knots
    })

    it('calculates apparent wind correctly for beam wind', () => {
      const trueWind = { angle: Math.PI / 2, speed: 10 } // East, 10 knots
      const boat = { heading: 0, speed: 5 } // North, 5 knots
      
      const apparent = calculateApparentWind(trueWind, boat)
      
      // Apparent wind should be aft of beam (greater than π/2)
      expect(apparent.angle).toBeGreaterThan(Math.PI / 2)
      expect(apparent.speed).toBeGreaterThan(5)
    })

    it('handles zero boat speed', () => {
      const trueWind = { angle: 0, speed: 10 }
      const boat = { heading: 0, speed: 0 }
      
      const apparent = calculateApparentWind(trueWind, boat)
      
      expect(apparent.angle).toBeCloseTo(trueWind.angle)
      expect(apparent.speed).toBeCloseTo(trueWind.speed)
    })

    it('handles zero wind speed', () => {
      const trueWind = { angle: 0, speed: 0 }
      const boat = { heading: 0, speed: 5 }
      
      const apparent = calculateApparentWind(trueWind, boat)
      
      expect(apparent.speed).toBe(5) // Apparent wind from boat speed
      expect(apparent.angle).toBeCloseTo(Math.PI) // Opposite to boat direction
    })
  })

  describe('collision detection', () => {
    it('detects angle collision correctly', () => {
      const angle1 = degToRad(0)
      const angle2 = degToRad(5)
      const minSeparation = degToRad(10)
      
      expect(angleCollision(angle1, angle2, minSeparation)).toBe(true)
      
      const angle3 = degToRad(15)
      expect(angleCollision(angle1, angle3, minSeparation)).toBe(false)
    })

    it('detects collision across 0/360 boundary', () => {
      const angle1 = degToRad(355)
      const angle2 = degToRad(5)
      const minSeparation = degToRad(20)
      
      expect(angleCollision(angle1, angle2, minSeparation)).toBe(true)
    })

    it('constrains angles to avoid collision', () => {
      const proposedAngle = degToRad(5)
      const existingAngles = [degToRad(0), degToRad(90)]
      const minSeparation = degToRad(10)
      
      const constrained = constrainAngle(proposedAngle, existingAngles, minSeparation)
      
      // Should be pushed to a safe distance from existing angles
      expect(constrained).toBeCloseTo(degToRad(10), 3)
    })
  })

  describe('utility functions', () => {
    it('calculates distance correctly', () => {
      const a = { x: 0, y: 0 }
      const b = { x: 3, y: 4 }
      
      expect(distance(a, b)).toBe(5) // 3-4-5 triangle
    })

    it('gets angle from center correctly', () => {
      const center = { x: 0, y: 0 }
      const point = { x: 1, y: 0 }
      
      expect(getAngleFromCenter(center, point)).toBe(0)
      
      const point2 = { x: 0, y: 1 }
      expect(getAngleFromCenter(center, point2)).toBeCloseTo(Math.PI / 2)
    })

    it('clamps values correctly', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })
  })
})