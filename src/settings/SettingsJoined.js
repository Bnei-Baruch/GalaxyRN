import * as React from "react";
import { View, StyleSheet, Button } from "react-native";
import { useTranslation } from "react-i18next";

import { useMyStreamStore } from "../zustand/myStream";
import { useSettingsStore } from "../zustand/settings";
import PageHeader from "../components/PageHeader";
import SelectUiLanguage from "./SelectUiLanguage";
import LabeledSwitch from "./LabeledSwitch";
import { baseStyles } from "../constants";
import { useInitsStore } from "../zustand/inits";
import AccountSettings from "../auth/AccountSettings";

export const SettingsJoined = ({ toggleVisible }) => {
  const { t } = useTranslation();
  const { cammute, toggleCammute } = useMyStreamStore();
  const { audioMode, toggleAudioMode } = useSettingsStore();
  const { isPortrait } = useInitsStore();

  const handleToggleAudioMode = () => toggleAudioMode();
  const handleCammute = () => toggleCammute();

  return (
    <View style={styles.container}>
      <PageHeader page={t("settings.page")} />
      <View style={[styles.container, !isPortrait && styles.landscape]}>
        <View style={styles.row}>
          {/*user settings*/}
          <AccountSettings />
          <SelectUiLanguage />
        </View>
        <View style={styles.row}>
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
          <View style={styles.containerBack}>
            <Button title={t("settings.backToTen")} onPress={toggleVisible} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
    flex: 1,
    backgroundColor: "black",
  },
  row: {
    flex: 1,
  },
  landscape: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  containerBack: {
    alignItems: "flex-end",
    padding: 10,
  },
});
