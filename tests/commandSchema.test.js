import { describe, expect, it } from 'vitest';
import { ACTIONS, parseCommand } from '../src/shared/commandSchema.js';

const cmd = (action, params, extra = {}) => ({
  action, params, confirm_text: 'Got it', confidence: 0.9, reply_language: 'en-IN', ...extra,
});

describe('commandSchema', () => {
  it('lists all 17 actions from §6', () => expect(ACTIONS).toHaveLength(17));

  it('accepts valid commands', () => {
    expect(parseCommand(cmd('set_background', { name: 'palace' })).ok).toBe(true);
    expect(parseCommand(cmd('rotate', { mode: 'spin', speed: 'slow' })).ok).toBe(true);
    expect(parseCommand(cmd('none', {})).ok).toBe(true);
    expect(parseCommand(cmd('set_language', { code: 'kn-IN' })).ok).toBe(true);
  });

  it('defaults start_recording to 15 s and missing params to {}', () => {
    const r = parseCommand(cmd('start_recording', {}));
    expect(r.ok && r.command.params.seconds).toBe(15);
    const h = parseCommand({ action: 'help', confirm_text: '', confidence: 1, reply_language: 'hi-IN' });
    expect(h.ok).toBe(true);
  });

  it('rejects bad actions, params, confidence and language', () => {
    expect(parseCommand(cmd('fly', {})).ok).toBe(false);
    expect(parseCommand(cmd('set_background', { name: 'moon' })).ok).toBe(false);
    expect(parseCommand(cmd('start_recording', { seconds: 60 })).ok).toBe(false);
    expect(parseCommand(cmd('lighting', { preset: 'soft', brightness: 5 })).ok).toBe(false);
    expect(parseCommand(cmd('undo', {}, { confidence: 1.5 })).ok).toBe(false);
    expect(parseCommand(cmd('undo', {}, { reply_language: 'fr-FR' })).ok).toBe(false);
  });
});
