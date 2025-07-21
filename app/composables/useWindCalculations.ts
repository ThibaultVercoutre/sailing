/**
 * Wind calculations utilities for sailing simulation
 * All angles are in radians internally, degrees only for display
 */

export interface Vector2D {
  x: number
  y: number
}

export interface PolarCoords {
  angle: number // radians
  magnitude: number
}

export interface WindData {
  angle: number // radians
  speed: number // knots
}

export interface BoatData {
  heading: number // radians
  speed: number // knots
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI
}

/**
 * Normalize angle to [0, 2π] range
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % (2 * Math.PI)
  if (normalized < 0) {
    normalized += 2 * Math.PI
  }
  return normalized
}

/**
 * Convert polar coordinates to cartesian
 */
export function polarToCartesian(polar: PolarCoords): Vector2D {
  return {
    x: polar.magnitude * Math.cos(polar.angle),
    y: polar.magnitude * Math.sin(polar.angle)
  }
}

/**
 * Convert cartesian coordinates to polar
 */
export function cartesianToPolar(vector: Vector2D): PolarCoords {
  return {
    angle: Math.atan2(vector.y, vector.x),
    magnitude: Math.sqrt(vector.x * vector.x + vector.y * vector.y)
  }
}

/**
 * Add two vectors
 */
export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  }
}

/**
 * Subtract vector b from vector a
 */
export function subtractVectors(a: Vector2D, b: Vector2D): Vector2D {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  }
}

/**
 * Scale vector by a factor
 */
export function scaleVector(vector: Vector2D, scale: number): Vector2D {
  return {
    x: vector.x * scale,
    y: vector.y * scale
  }
}

/**
 * Convert knots to m/s
 */
export function knotsToMs(knots: number): number {
  return knots * 0.514444
}

/**
 * Convert m/s to knots
 */
export function msToKnots(ms: number): number {
  return ms / 0.514444
}

/**
 * Calculate apparent wind from true wind and boat velocity
 * Apparent Wind = True Wind - Boat Velocity (vector subtraction)
 */
export function calculateApparentWind(trueWind: WindData, boat: BoatData): WindData {
  // Convert to cartesian coordinates
  const trueWindVector = polarToCartesian({
    angle: trueWind.angle,
    magnitude: trueWind.speed
  })
  
  const boatVector = polarToCartesian({
    angle: boat.heading,
    magnitude: boat.speed
  })
  
  // Apparent wind = True wind - Boat velocity
  const apparentWindVector = subtractVectors(trueWindVector, boatVector)
  
  // Convert back to polar
  const apparentWindPolar = cartesianToPolar(apparentWindVector)
  
  return {
    angle: normalizeAngle(apparentWindPolar.angle),
    speed: Math.max(0, apparentWindPolar.magnitude)
  }
}

/**
 * Check if two angles are too close (collision detection)
 */
export function angleCollision(angle1: number, angle2: number, minSeparation: number = degToRad(10)): boolean {
  const diff = Math.abs(normalizeAngle(angle1) - normalizeAngle(angle2))
  const minDiff = Math.min(diff, 2 * Math.PI - diff)
  return minDiff < minSeparation
}

/**
 * Constrain angle to avoid collision with existing angles
 */
export function constrainAngle(
  proposedAngle: number, 
  existingAngles: number[], 
  minSeparation: number = degToRad(10)
): number {
  let constrainedAngle = normalizeAngle(proposedAngle)
  
  for (const existingAngle of existingAngles) {
    if (angleCollision(constrainedAngle, existingAngle, minSeparation)) {
      // Find closest safe angle
      const normalizedExisting = normalizeAngle(existingAngle)
      const option1 = normalizeAngle(normalizedExisting + minSeparation)
      const option2 = normalizeAngle(normalizedExisting - minSeparation)
      
      const diff1 = Math.abs(normalizeAngle(constrainedAngle) - option1)
      const diff2 = Math.abs(normalizeAngle(constrainedAngle) - option2)
      
      constrainedAngle = diff1 < diff2 ? option1 : option2
    }
  }
  
  return constrainedAngle
}

/**
 * Calculate distance between two points
 */
export function distance(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Get angle from center to point
 */
export function getAngleFromCenter(center: Vector2D, point: Vector2D): number {
  return Math.atan2(point.y - center.y, point.x - center.x)
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}