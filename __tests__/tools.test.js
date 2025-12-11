/**
 * @format
 */

import { fixTextEncoding } from '../src/tools';

describe('fixTextEncoding', () => {
  it('should return empty string for null input', () => {
    expect(fixTextEncoding(null)).toBe('');
  });

  it('should fix Windows-1251 encoded text', () => {
    const misencodedText = 'ÐÐµÐ¾Ð½ÑÑÐµÐ²';
    const fixed = fixTextEncoding(misencodedText);
    expect(fixed).toBe('Леонтьев');
  });
});
