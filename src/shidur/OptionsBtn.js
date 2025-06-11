import * as React from "react";
import { Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ListInModal from "../components/ListInModal";
import { baseStyles } from "../constants";
import logger from "../services/logger";
import { topMenuBtns } from "../topBar/helper";
import { useUiActions } from "../zustand/uiActions";
import AudioSelect from "./AudioSelect";
import VideoSelect from "./VideoSelect";

const NAMESPACE = "OptionsBtn";

const items = [
  { value: "audio", text: "Audio" },
  { value: "video", text: "Video" },
];

export const OptionsBtn = () => {
  const { toggleShowBars } = useUiActions();

  const handleOpen = () => toggleShowBars(false, true);
  const handleSelect = () => toggleShowBars();

  const renderItem = (item) => {
    logger.debug(NAMESPACE, "renderItem", item);

    switch (item.value) {
      case "audio":
        return (
          <>
            <AudioSelect />
          </>
        );
      case "video":
        return (
          <>
            <VideoSelect />
          </>
        );
      default:
        return (
          <Text style={[baseStyles.text, baseStyles.listItem]}>
            {item.text}
          </Text>
        );
    }
  };
  return (
    <ListInModal
      items={items}
      onSelect={handleSelect}
      onOpen={handleOpen}
      renderItem={renderItem}
      trigger={
        <Icon name="settings" size={30} color="white" style={topMenuBtns.btn} />
      }
    />
  );
};
