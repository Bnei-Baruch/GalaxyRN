import React from "react";
import { View, useWindowDimensions } from "react-native";
import markdownit from "markdown-it";
import RenderHtml from "react-native-render-html";
import { renderHtmlStyles } from "../constants";
import { useSubtitleStore } from "../zustand/subtitle";

const md = markdownit({ html: true, breaks: false }).disable([
  "lheading",
  "list",
]);

const Subtitle = () => {
  const { isOpen, lastMsg } = useSubtitleStore();
  const { width } = useWindowDimensions();

  if (!isOpen || !lastMsg?.slide) return null;
  
  const { isLtr, slide } = lastMsg;
  
  const htmlContent = md.render(slide);
  const tagsStyles = renderHtmlStyles(isLtr);
  
  return (
    <View>
      <RenderHtml
        contentWidth={width}
        source={{ html: htmlContent }}
        tagsStyles={tagsStyles}
      />
    </View>
  );
};

export default Subtitle;
