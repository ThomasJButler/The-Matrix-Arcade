import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock PWA virtual module
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Canvas with more complete implementation
const createMockContext = () => {
  const context = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Array(4),
    })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({
      width: 0,
    })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    strokeRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createPattern: vi.fn(() => ({})),
    shadowBlur: 0,
    shadowColor: 'transparent',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
  };
  return context;
};

HTMLCanvasElement.prototype.getContext = vi.fn(function(contextType: string) {
  if (contextType === '2d') {
    return createMockContext();
  }
  return null;
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock AudioContext
(global as Window & { AudioContext?: typeof AudioContext }).AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { 
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    type: 'square',
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn()
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    disconnect: vi.fn()
  })),
  createDynamicsCompressor: vi.fn(() => ({
    connect: vi.fn(),
    threshold: { value: -50 },
    knee: { value: 40 },
    ratio: { value: 12 },
    attack: { value: 0 },
    release: { value: 0.25 },
    disconnect: vi.fn()
  })),
  createBiquadFilter: vi.fn(() => ({
    connect: vi.fn(),
    type: 'lowpass',
    frequency: { 
      value: 1000,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    Q: { value: 1 },
    gain: { value: 0 },
    disconnect: vi.fn()
  })),
  createWaveShaper: vi.fn(() => ({
    connect: vi.fn(),
    curve: null,
    oversample: 'none',
    disconnect: vi.fn()
  })),
  createConvolver: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    buffer: null,
  })),
  createAnalyser: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
  })),
  createBuffer: vi.fn((channels, length, sampleRate) => ({
    length,
    sampleRate,
    numberOfChannels: channels,
    getChannelData: vi.fn(() => new Float32Array(length)),
  })),
  currentTime: 0,
  destination: {},
  close: vi.fn(),
  resume: vi.fn(),
  suspend: vi.fn(),
  state: 'running',
  sampleRate: 48000
}));

// Mock fullscreen API
Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: vi.fn()
});

Object.defineProperty(document, 'exitFullscreen', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: vi.fn()
});

Object.defineProperty(document, 'fullscreenElement', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: null
});