import * as React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { topMenuBtns } from '../bottomBar/moreBtns/helper';
import Text from '../components/CustomText';
import ListInModal from '../components/ListInModal';
import { baseStyles } from '../constants';
import { useUiActions } from '../zustand/uiActions';
import VideoSelect from './VideoSelect';
import AudioSelectModal from './audioSelect/AudioSelectModal';

const items = [
  { value: 'audio', text: 'Audio' },
  { value: 'video', text: 'Video' },
];

const OptionsBtn = () => {
  const { toggleShowBars } = useUiActions();

  const handleOpen = () => toggleShowBars(false, true);
  const handleSelect = () => toggleShowBars();

  const renderItem = item => {
    switch (item.value) {
      case 'audio':
        return (
          <>
            <AudioSelectModal />
          </>
        );
      case 'video':
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

export default OptionsBtn;
