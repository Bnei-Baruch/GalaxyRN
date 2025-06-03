import * as React from "react";
import { useShidurStore } from "../zustand/shidur";
import ListInModal from "../components/ListInModal";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Text } from "react-native";
import AudioSelect from "./AudioSelect";
import VideoSelect from "./VideoSelect";
import { baseStyles } from "../constants";
import { topMenuBtns } from "../topBar/helper";
import { debug } from '../services/logger';

const NAMESPACE = 'OptionsBtn';

const items = [
  { value: "audio", text: "Audio" },
  { value: "video", text: "Video" },
];

export const OptionsBtn = () => {
  const { toggleShidurBar } = useShidurStore();

  const handleOpen = () => {
    toggleShidurBar(false, true);
  };

  const renderItem = (item) => {
    debug(NAMESPACE, "renderItem", item);

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
      onSelect={toggleShidurBar}
      onOpen={handleOpen}
      renderItem={renderItem}
      trigger={
        <Icon name="settings" size={30} color="white" style={topMenuBtns.btn} />
      }
    />
  );
};
