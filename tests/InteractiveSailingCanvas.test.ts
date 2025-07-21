import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import InteractiveSailingCanvas from '~/components/InteractiveSailingCanvas.vue'

// Mock the canvas context
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  setLineDash: vi.fn(),
  fillText: vi.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  textBaseline: '',
  globalAlpha: 1,
  shadowBlur: 0,
  shadowColor: ''
}

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => mockContext)
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    width: 800,
    height: 600,
    left: 0,
    top: 0
  }))
})

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: vi.fn((callback) => {
    callback(0)
    return 1
  })
})

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: vi.fn()
})

// Mock devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  value: 1
})

// Mock composable
vi.mock('~/composables/useSailingCanvas', () => ({
  useSailingCanvas: () => ({
    initCanvas: vi.fn(),
    draw: vi.fn()
  })
}))

describe('InteractiveSailingCanvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const wrapper = mount(InteractiveSailingCanvas, {
      props: {
        showInstructions: true
      }
    })

    expect(wrapper.find('canvas').exists()).toBe(true)
    expect(wrapper.find('.sailing-canvas-container').exists()).toBe(true)
  })

  it('shows instructions when prop is true', () => {
    const wrapper = mount(InteractiveSailingCanvas, {
      props: {
        showInstructions: true
      }
    })

    const instructions = wrapper.find('.absolute.top-4.left-4')
    expect(instructions.exists()).toBe(true)
    expect(instructions.text()).toContain('Instructions:')
  })

  it('hides instructions when prop is false', () => {
    const wrapper = mount(InteractiveSailingCanvas, {
      props: {
        showInstructions: false
      }
    })

    const instructions = wrapper.find('.absolute.top-4.left-4')
    expect(instructions.exists()).toBe(false)
  })

  it('can hide instructions via button click', async () => {
    const wrapper = mount(InteractiveSailingCanvas, {
      props: {
        showInstructions: true
      }
    })

    const hideButton = wrapper.find('button')
    expect(hideButton.exists()).toBe(true)

    await hideButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Check that showInstructionsState is false after clicking hide
    expect(wrapper.vm.showInstructionsState).toBe(false)
  })

  it('sets canvas as focusable', () => {
    const wrapper = mount(InteractiveSailingCanvas)
    const canvas = wrapper.find('canvas')
    
    expect(canvas.attributes('tabindex')).toBe('0')
  })

  it('emits wind update events', async () => {
    const wrapper = mount(InteractiveSailingCanvas)
    
    // Manually trigger the computed watcher by accessing the store
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('windUpdate')).toBeDefined()
    expect(wrapper.emitted('boatUpdate')).toBeDefined()
    expect(wrapper.emitted('apparentWindUpdate')).toBeDefined()
  })

  it('handles canvas focus/blur events', async () => {
    const wrapper = mount(InteractiveSailingCanvas)
    const canvas = wrapper.find('canvas')
    
    await canvas.trigger('focus')
    expect(wrapper.vm.canFocus).toBe(true)
    
    await canvas.trigger('blur')
    expect(wrapper.vm.canFocus).toBe(false)
  })

  it('computes selected handle info correctly', () => {
    const wrapper = mount(InteractiveSailingCanvas)
    
    // Initially no handle selected
    expect(wrapper.vm.selectedHandleInfo).toBeNull()
  })

  it('applies correct CSS classes', () => {
    const wrapper = mount(InteractiveSailingCanvas)
    
    expect(wrapper.find('.sailing-canvas-container').classes()).toContain('w-full')
    expect(wrapper.find('.sailing-canvas-container').classes()).toContain('h-full')
    expect(wrapper.find('.sailing-canvas-container').classes()).toContain('relative')
    
    expect(wrapper.find('canvas').classes()).toContain('sailing-canvas')
    expect(wrapper.find('canvas').classes()).toContain('w-full')
    expect(wrapper.find('canvas').classes()).toContain('h-full')
  })

  it('handles props reactively', async () => {
    const wrapper = mount(InteractiveSailingCanvas, {
      props: {
        showInstructions: false
      }
    })

    expect(wrapper.find('.absolute.top-4.left-4').exists()).toBe(false)

    await wrapper.setProps({ showInstructions: true })
    expect(wrapper.find('.absolute.top-4.left-4').exists()).toBe(true)
  })
})