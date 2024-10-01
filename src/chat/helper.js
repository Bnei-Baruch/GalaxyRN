const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;()]*[-A-Z0-9+&@#/%=~_|()])/gi;

export const textWithLinks = (text) => {
  const parts = [];
  let start = 0;
  for (const match of text.matchAll(urlRegex)) {
    const url = match[0];
    const index = match.index;
    if (index > start) {
      parts.push(<span key={start}>{text.slice(start, index)}</span>);
    }
    parts.push(
      <a key={index} target="blank_" href={url}>
        {url}
      </a>
    );
    start = index + url.length;
  }
  if (start < text.length) {
    parts.push(<span key={start}>{text.slice(start, text.length)}</span>);
  }
  return parts;
};


const isRTLChar = /[\u0590-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const isAscii = /[\x20-\x7F]/;
const isAsciiChar        = /[a-zA-Z]/;
export const isRTLString = (text) => {
  let rtl = 0;
  let ltr = 0;
  for (let i = 0; i < text.length; i++) {
    if (!isAscii.test(text[i]) || isAsciiChar.test(text[i])) {
      if (isRTLChar.test(text[i])) {
        rtl++;
      } else {
        ltr++;
      }
    }
  }
  return rtl > ltr;
};