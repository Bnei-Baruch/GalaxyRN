import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialIcons";
import ListInModal from "../components/ListInModal";
import { baseStyles } from "../constants";
import logger from "../services/logger";
import { audio_options2 } from "../shared/consts";
import { useShidurStore } from "../zustand/shidur";
import { useUiActions } from "../zustand/uiActions";

const NAMESPACE = "AudioSelect";

const AudioSelect = () => {
  const { audio, setAudio } = useShidurStore();
  const { toggleShowBars } = useUiActions();
  const { t } = useTranslation();

  const handleSetAudio = (item) => {
    logger.debug(NAMESPACE, "handleSetAudio", item);
    setAudio(item.value, item.eng_text);
    toggleShowBars(false, true);
  };

  const renderItem = (item) => {
    if (item.header) {
      return (
        <View style={[styles.container, styles.header]} key={item.key}>
          <Icon name={item.icon} color="white" size={30}></Icon>
          <Text style={[baseStyles.text, baseStyles.listItem]}>
            {t(item.text)}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container} key={item.key}>
        <Icon name={item.icon} color="white" size={20}></Icon>
        <Text style={[baseStyles.text, baseStyles.listItem]}>{item.text}</Text>
      </View>
    );
  };

  const selected = audio_options2.find((option) => option.value === audio);

  const trigger = (
    <View style={styles.container} key={selected.key}>
      <View style={styles.withArrow}>
        <Icon name={selected.icon} color="white" size={20}></Icon>
        <Text style={[baseStyles.text, baseStyles.listItem]}>
          {selected.text}
        </Text>
      </View>
      <Icon name="keyboard-arrow-down" color="white" size={20}></Icon>
    </View>
  );

  return (
    <ListInModal
      items={audio_options2}
      selected={selected?.text}
      onSelect={handleSetAudio}
      renderItem={renderItem}
      trigger={trigger}
    />
  );
};
export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "white",
  },
  withArrow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
  },
});

export default AudioSelect;
