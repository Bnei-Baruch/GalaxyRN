import React from "react";
import { View, useWindowDimensions } from "react-native";
import markdownit from "markdown-it";
import RenderHtml from "react-native-render-html";

const md = markdownit({ html: true, breaks: false }).disable([
  "lheading",
  "list",
]);

const Subtitle = ({ content, style = {} }) => {
  const { width } = useWindowDimensions();
  const contentWidth = width - 20;

  const htmlContent = md.render(content);

  return (
    <View style={style}>
      <RenderHtml
        contentWidth={contentWidth}
        source={{ html: htmlContent }}
        tagsStyles={{
          body: { color: "white", padding: 8 },
          // Add more tag styles as needed
        }}
      />
    </View>
  );
};

export default MarkdownRenderer;
