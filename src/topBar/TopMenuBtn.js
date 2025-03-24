import * as React from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
import { StudyMaterialsBtn } from "./StudyMaterialsBtn";
import { DonateBtn } from "./DonateBtn";
import { SupportBtn } from "./SupportBtn";
import { SettingsBtn } from "./SettingsBtn";
import LogoutBtn from "./LogoutBtn";
import ListInModal from "../components/ListInModal";
import { useUiActions } from "../zustand/uiActions";
import VersionInfo from "../components/VersionInfo";

export const TopMenuBtn = () => {
  const { toggleShowBars } = useUiActions();

  const items = [
    { component: <StudyMaterialsBtn />, key: 1 },
    { component: <DonateBtn />, key: 2 },
    { component: <SupportBtn />, key: 3 },
    { component: <SettingsBtn />, key: 4 },
    { component: <LogoutBtn />, key: 5 },
    { component: <VersionInfo />, key: 6 },
  ];

  const renderItem = (item) => item.component;

  const handlePress = () => toggleShowBars(false, true);

  return (
    <ListInModal
      onOpen={handlePress}
      items={items}
      renderItem={renderItem}
      trigger={<Icon name="menu" size={30} color="white" />}
    />
  );
};
