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

  it('parses comma-formatted 5-digit number: "10,000 hotel"', () => {
    const res = parseVoiceInput('10,000 hotel');
    expect(res.amountPaise).toBe(1000000);
    expect(res.label).toBe('Hotel');
    expect(res.category).toBe('Transport');
  });

  it('parses 5-digit number without comma: "10000 hotel"', () => {
    const res = parseVoiceInput('10000 hotel');
    expect(res.amountPaise).toBe(1000000);
    expect(res.label).toBe('Hotel');
  });

  it('parses 5-digit word numbers: "ten thousand hotel"', () => {
    const res = parseVoiceInput('ten thousand hotel');
    expect(res.amountPaise).toBe(1000000);
    expect(res.label).toBe('Hotel');
  });

  it('parses: "paid 25,000 for rent"', () => {
    const res = parseVoiceInput('paid 25,000 for rent');
    expect(res.amountPaise).toBe(2500000);
    expect(res.label).toBe('Rent');
    expect(res.category).toBe('Bills & Utilities');
  });

  it('parses Indian comma format: "1,50,000 laptop"', () => {
    const res = parseVoiceInput('1,50,000 laptop');
    expect(res.amountPaise).toBe(15000000);
    expect(res.label).toBe('Laptop');
    expect(res.category).toBe('Shopping');
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
