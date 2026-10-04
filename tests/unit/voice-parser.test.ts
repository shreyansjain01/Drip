import { describe, it, expect } from 'vitest';
import { parseVoiceInput } from '../../src/lib/voice/parse';

describe('Voice & Text Natural Language Parser', () => {
  it('parses: "I paid for breakfast ₹60"', () => {
    const res = parseVoiceInput('I paid for breakfast ₹60');
    expect(res.amountPaise).toBe(6000);
    expect(res.category).toBe('Food & Drinks');
    expect(res.intent).toBe('expense');
    expect(res.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('parses: "snacks 90 rupees"', () => {
    const res = parseVoiceInput('snacks 90 rupees');
    expect(res.amountPaise).toBe(9000);
    expect(res.category).toBe('Food & Drinks');
  });

  it('parses: "spent ninety on auto"', () => {
    const res = parseVoiceInput('spent ninety on auto');
    expect(res.amountPaise).toBe(9000);
    expect(res.category).toBe('Transport');
  });

  it('parses: "chai 20"', () => {
    const res = parseVoiceInput('chai 20');
    expect(res.amountPaise).toBe(2000);
    expect(res.category).toBe('Food & Drinks');
  });

  it('parses multiplier: "paid 1.5k for groceries"', () => {
    const res = parseVoiceInput('paid 1.5k for groceries');
    expect(res.amountPaise).toBe(150000);
    expect(res.category).toBe('Groceries');
  });

  it('parses number words: "two hundred and fifty for petrol"', () => {
    const res = parseVoiceInput('two hundred and fifty for petrol');
    expect(res.amountPaise).toBe(25000);
    expect(res.category).toBe('Transport');
  });

  it('parses goal intent: "add 2000 to emergency fund"', () => {
    const res = parseVoiceInput('add 2000 to emergency fund');
    expect(res.intent).toBe('goal_contribution');
    expect(res.amountPaise).toBe(200000);
  });

  it('parses income intent: "got 5000 bonus"', () => {
    const res = parseVoiceInput('got 5000 bonus');
    expect(res.intent).toBe('income');
    expect(res.amountPaise).toBe(500000);
  });

  it('handles Hindi number words: "pachaas for chai"', () => {
    const res = parseVoiceInput('pachaas for chai');
    expect(res.amountPaise).toBe(5000);
    expect(res.category).toBe('Food & Drinks');
  });

  it('handles low confidence for gibberish', () => {
    const res = parseVoiceInput('hello world today');
    expect(res.confidence).toBeLessThan(0.6);
  });
});
