import * as React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

import { topMenuBtns } from "./helper";
import { useInitsStore } from "../zustand/inits";
import { useTranslation } from "react-i18next";
import { baseStyles } from "../constants";

export const LeaveBtn = () => {
  const { setReadyForJoin } = useInitsStore();
  const { t } = useTranslation();

  const handlePress = () => setReadyForJoin(false);


  return (
    <TouchableOpacity onPress={handlePress} style={styles.btn}>
      <Text style={styles.text}>
        {t("bottomBar.leave")}
        </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    ...topMenuBtns.btn,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "red",
    borderRadius: 5,
  },
  text: {
    ...baseStyles.text,
    color: "white",
  },
});
