import React from "react";
import { View } from "react-native";
import markdownit from "markdown-it";
import RenderHtml from "react-native-render-html";
import { useSubtitleStore } from "../zustand/subtitle";

const md = markdownit({ html: true, breaks: false }).disable([
  "lheading",
  "list",
]);

const Subtitle = () => {
  const { isOpen, lastMsg } = useSubtitleStore();

  if (!isOpen || !lastMsg?.slide) return null;

  console.log(
    `[Subtitle View] Rendering subtitle: ${JSON.stringify(lastMsg)}`
  );

  const htmlContent = md.render(lastMsg.slide);

  return (
    <View>
      <RenderHtml
        source={{ html: htmlContent }}
        tagsStyles={{
          body: {
            color: "black",
            backgroundColor: "white",
            padding: 8,
            textAlign: "center",
          },
          // Add more tag styles as needed
        }}
      />
    </View>
  );
};

export default Subtitle;
