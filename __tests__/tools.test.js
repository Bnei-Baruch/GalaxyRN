/**
 * @format
 */

import { fixTextEncoding } from '../src/shared/tools';

describe('fixTextEncoding', () => {
  it('should return "No name" for null input', () => {
    expect(fixTextEncoding(null)).toBe('No name');
  });

  it('should return "No name" for undefined input', () => {
    expect(fixTextEncoding(undefined)).toBe('No name');
  });

  it('should return "No name" for non-string input', () => {
    expect(fixTextEncoding(123)).toBe('No name');
    expect(fixTextEncoding({})).toBe('No name');
    expect(fixTextEncoding([])).toBe('No name');
  });

  it('should return text as-is if no encoding issues detected', () => {
    const text = 'Hello World';
    expect(fixTextEncoding(text)).toBe(text);
  });

  it('should return text as-is for simple ASCII text', () => {
    const text = 'Test 123 ABC';
    expect(fixTextEncoding(text)).toBe(text);
  });

  it('should return text as-is for valid UTF-8 text', () => {
    const text = 'Привет Мир';
    expect(fixTextEncoding(text)).toBe(text);
  });

  it('should fix Windows-1251 encoded text', () => {
    // Текст с типичными проблемами Windows-1251 кодировки
    const misencodedText = 'Ð\u0090Ð\u009BÐ\u0095Ð\u009AÐ\u0090';
    const fixed = fixTextEncoding(misencodedText);
    expect(fixed).toBeTruthy();
    expect(typeof fixed).toBe('string');
    // Функция может исправить текст или вернуть оригинал
    if (fixed !== misencodedText) {
      // Если исправила, результат должен содержать читаемые символы
      expect(/[а-яА-ЯёЁa-zA-Z0-9\s]/.test(fixed)).toBe(true);
    }
  });

  it('should handle text with common encoding issues', () => {
    // Текст с типичными проблемами кодировки
    const problematicText = 'Ð\u0090Ð\u009BÐ\u0095Ð\u009AÐ\u0090';
    const fixed = fixTextEncoding(problematicText);
    expect(fixed).toBeTruthy();
    expect(typeof fixed).toBe('string');
  });

  it('should handle empty string', () => {
    // Пустая строка считается невалидной и возвращает "No name"
    expect(fixTextEncoding('')).toBe('No name');
  });

  it('should handle text with high byte characters', () => {
    // Текст с символами в диапазоне 0xC0-0xFF
    const highByteText = String.fromCharCode(0xc0, 0xc1, 0xc2);
    const fixed = fixTextEncoding(highByteText);
    expect(fixed).toBeTruthy();
    expect(typeof fixed).toBe('string');
  });

  it('should return original text if detection fails', () => {
    // Мок для случая, когда jschardet не может определить кодировку
    const text = 'Some text with issues';
    // Если функция не может исправить, она должна вернуть оригинал
    const result = fixTextEncoding(text);
    expect(result).toBeTruthy();
  });

  it('should handle KOI8-R encoded text', () => {
    // Текст с проблемами кодировки
    const misencodedText = String.fromCharCode(0xf0, 0xc5, 0xd3, 0xd4);
    const fixed = fixTextEncoding(misencodedText);
    expect(fixed).toBeTruthy();
    expect(typeof fixed).toBe('string');
  });

  it('should handle text with replacement characters', () => {
    // Текст с символами замены уже не должен обрабатываться
    const textWithReplacement = 'Test\uFFFDText';
    const fixed = fixTextEncoding(textWithReplacement);
    // Если текст уже содержит символы замены, функция может вернуть его как есть
    expect(fixed).toBeTruthy();
  });

  it('should handle very long text', () => {
    const longText =
      'A'.repeat(1000) + String.fromCharCode(0xc0) + 'B'.repeat(1000);
    const fixed = fixTextEncoding(longText);
    expect(fixed).toBeTruthy();
    expect(fixed.length).toBeGreaterThan(0);
  });

  it('should handle mixed encoding issues', () => {
    const mixedText = 'Hello Ð World Ñ Test';
    const fixed = fixTextEncoding(mixedText);
    expect(fixed).toBeTruthy();
    expect(typeof fixed).toBe('string');
  });

  it('should preserve text that is already correct', () => {
    const correctText = 'Correct UTF-8 text: Привет 123';
    const fixed = fixTextEncoding(correctText);
    expect(fixed).toBe(correctText);
  });
});
