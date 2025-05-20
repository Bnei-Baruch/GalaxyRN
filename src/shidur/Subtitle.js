import React from "react";
import { View } from "react-native";
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

  const htmlContent = md.render(lastMsg.slide);

  return (
    <View>
      <RenderHtml
        contentWidth={width}
        source={{ html: htmlContent }}
        tagsStyles={renderHtmlStyles}
      />
    </View>
  );
};

export default Subtitle;
