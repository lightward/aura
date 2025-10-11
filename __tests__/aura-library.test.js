/**
 * Tests for Aura library build
 * Verifies that the IIFE build exports correctly and can be used via script tag
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Aura Library', () => {
  let LightwardAura;

  beforeAll(() => {
    // Load the built library
    const libraryPath = path.join(__dirname, '../dist/aura.js');
    const libraryCode = fs.readFileSync(libraryPath, 'utf8');

    // Create a sandbox with a window object
    const sandbox = { window: {}, self: {} };

    // Execute the library code in the sandbox
    vm.runInNewContext(libraryCode, sandbox);

    // The IIFE assigns to the global scope (window in browser, this in Node)
    LightwardAura = sandbox.LightwardAura;
  });

  test('library file exists', () => {
    const libraryPath = path.join(__dirname, '../dist/aura.js');
    expect(fs.existsSync(libraryPath)).toBe(true);

    const stats = fs.statSync(libraryPath);
    expect(stats.size).toBeGreaterThan(1000); // Should be a substantial file
  });

  test('exports LightwardAura', () => {
    expect(LightwardAura).toBeDefined();
    // IIFE export could be function or object depending on module structure
    expect(['function', 'object']).toContain(typeof LightwardAura);
  });

  test('LightwardAura exports Aura class', () => {
    // Check if it's exported as default or directly
    const Aura = LightwardAura.default || LightwardAura;

    expect(Aura).toBeDefined();
    expect(typeof Aura).toBe('function');
  });

  test('Aura class has expected constructor signature', () => {
    const Aura = LightwardAura.default || LightwardAura;

    // Check constructor exists and expects parameters
    expect(typeof Aura).toBe('function');
    expect(Aura.length).toBeGreaterThan(0); // Has parameters (gl, options)
  });
});
