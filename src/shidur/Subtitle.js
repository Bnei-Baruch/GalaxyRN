import markdownit from 'markdown-it';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { SHIDUR_SUBTITLE_ZINDEX } from '../constants';
import { MSGS_QUESTION, useSubtitleStore } from '../zustand/subtitle';

// Same `@text@` -> <small>text</small> rule as galaxy3 and subtitles-broadcast.
const smallPlugin = md => {
  md.inline.ruler.after('emphasis', 'small', (state, silent) => {
    const start = state.pos;
    const src = state.src;
    // Opening '@' must be followed by a non-space, non-'@' char.
    if (src.charCodeAt(start) !== 0x40) return false;
    const next = src.charCodeAt(start + 1);
    if (next === 0x40 || next === 0x20) return false;
    const end = src.indexOf('@', start + 1);
    // Closing '@' must exist within this inline block and not follow a space.
    if (end === -1 || end >= state.posMax || src.charCodeAt(end - 1) === 0x20) return false;
    if (!silent) {
      state.push('small_open', 'small', 1);
      state.push('text', '', 0).content = src.slice(start + 1, end);
      state.push('small_close', 'small', -1);
    }
    state.pos = end + 1;
    return true;
  });
};

const md = markdownit({ html: true, breaks: false })
  .disable(['lheading', 'list'])
  .use(smallPlugin);

const Subtitle = () => {
  const { isOpen, lastMsg = {} } = useSubtitleStore();
  const { width } = useWindowDimensions();

  if (!isOpen || !lastMsg?.slide) return null;

  const { isLtr = false, slide = '' } = lastMsg || {};
  const rendered = md.render(slide);
  const htmlContent = `<div dir="${isLtr ? 'ltr' : 'rtl'}">${rendered}</div>`;

  let textAlign = 'left';
  if (lastMsg?.slide_type === MSGS_QUESTION.slide_type) {
    textAlign = 'center';
  } else {
    textAlign = isLtr ? 'left' : 'right';
  }

  return (
    <View style={styles.subtitle}>
      <RenderHtml
        contentWidth={width}
        source={{ html: htmlContent }}
        tagsStyles={{
          body: {
            color: 'black',
          },
          small: {
            fontSize: '0.8em',
          },
        }}
        baseStyle={{ textAlign }}
        defaultTextProps={{
          selectable: false,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    position: 'absolute',
    top: 'auto',
    minHeight: '24%',
    backgroundColor: 'white',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 5,
    zIndex: SHIDUR_SUBTITLE_ZINDEX,
  },
});

export default Subtitle;
