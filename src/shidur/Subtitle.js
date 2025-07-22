import markdownit from 'markdown-it';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { SHIDUR_SUBTITLE_ZINDEX } from '../constants';
import { MSGS_QUESTION, useSubtitleStore } from '../zustand/subtitle';

const md = markdownit({ html: true, breaks: false }).disable([
  'lheading',
  'list',
]);

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
