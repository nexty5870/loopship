import { describe, it } from 'node:test';
import assert from 'node:assert';
import { greet } from '../src/hello.js';

describe('greet', () => {
  it('should greet World', () => {
    assert.strictEqual(greet('World'), 'Hello, World!');
  });

  it('should greet custom name', () => {
    assert.strictEqual(greet('LoopShip'), 'Hello, LoopShip!');
  });

  it('should handle empty string', () => {
    assert.strictEqual(greet(''), 'Hello, !');
  });
});
