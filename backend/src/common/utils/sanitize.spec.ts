import {
  sanitizeText,
  stripHtml,
  trimString,
  truncateMaxLength,
} from './sanitize';

describe('sanitize utils', () => {
  it('trims surrounding whitespace', () => {
    expect(trimString('  hello  ')).toBe('hello');
  });

  it('truncates to max length', () => {
    expect(truncateMaxLength('abcdef', 4)).toBe('abcd');
    expect(truncateMaxLength('abc', 4)).toBe('abc');
  });

  it('strips HTML tags', () => {
    expect(stripHtml('<b>hello</b> world')).toBe('hello world');
    expect(stripHtml('plain text')).toBe('plain text');
  });

  it('sanitizes text with trim, strip HTML, and max length', () => {
    expect(sanitizeText('  <i>note</i> text  ', { maxLength: 8 })).toBe(
      'note tex',
    );
  });
});
