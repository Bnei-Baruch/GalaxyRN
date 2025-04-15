import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { baseStyles } from "../constants";
import ListInModal from "../components/ListInModal";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../zustand/settings";
import Icon from "react-native-vector-icons/MaterialIcons";
const languagesOptions = [
  { key: "en", value: "en", text: "English" },
  { key: "es", value: "es", text: "Español" },
  { key: "he", value: "he", text: "עברית" },
  { key: "ru", value: "ru", text: "Русский" },
];
const SelectUiLanguage = () => {
  const { t } = useTranslation();
  const { setUiLang, uiLang } = useSettingsStore();

  const selected = languagesOptions.find((option) => option.value === uiLang);

  const handleLangChange = (lang) => setUiLang(lang.value);
  const renderItem = (item) => (
    <Text style={[baseStyles.text, baseStyles.listItem]}>{item.text}</Text>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, baseStyles.text]}>
        {t("settings.uiLanguage")}
      </Text>

      <ListInModal
        items={languagesOptions}
        selected={selected?.text}
        onSelect={handleLangChange}
        renderItem={renderItem}
        trigger={
          <View style={styles.inputWrapper}>
            <Text style={styles.selected}>{selected?.text}</Text>
            <Icon name="arrow-drop-down" size={30} color="white" />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  selected: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.23)",
    borderRadius: 5,
    padding: 10,
    color: "white",
    flex: 1,
  },
  item: {
    backgroundColor: "red",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
});

export default SelectUiLanguage;
