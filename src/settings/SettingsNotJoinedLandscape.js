import * as React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import SelectUiLanguage from "./SelectUiLanguage";
import MyVideo from "../components/MyVideo";
import LabeledSwitch from "./LabeledSwitch";
import { useSettingsStore } from "../zustand/settings";
import { useMyStreamStore } from "../zustand/myStream";
import PageHeader from "../components/PageHeader";
import RoomSelect from "./RoomSelect";
import { baseStyles } from "../constants";
import AccountSettings from "../auth/AccountSettings";

export const SettingsNotJoinedLandscape = () => {
  const { t } = useTranslation();
  const { cammute, toggleCammute } = useMyStreamStore();
  const { audioMode, toggleAudioMode } = useSettingsStore();

  const handleToggleAudioMode = () => toggleAudioMode();
  const handleCammute = () => toggleCammute();

  return (
    <View style={styles.container}>
      <PageHeader page={t("settings.page")} />
      {/*user settings*/}
      <View style={styles.forms}>
        <View style={{ width: "43%" }}>
          <AccountSettings />
          <MyVideo styles={{ aspectRatio: 16 / 9, width: "100%" }} />
        </View>
        <View style={{ width: "50%" }}>
          <SelectUiLanguage />

          <LabeledSwitch
            label={t("settings.cammute")}
            value={cammute}
            onValueChange={handleCammute}
          />
          <LabeledSwitch
            label={t("settings.audioMode")}
            value={audioMode}
            onValueChange={handleToggleAudioMode}
          />
          <View style={baseStyles.full} />
          <RoomSelect />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 3,
    flex: 1,
    backgroundColor: "black",
  },
  forms: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
});
