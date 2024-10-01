import { StyleSheet, View, Button } from 'react-native';
import { isRTLString, textWithLinks } from './helper';
import { useChatStore } from '../zustand/chat';

export const RoomChatForm = () => {

  return (
      <Input
        ref="input"
        fluid
        type="text"
        placeholder={t("virtualChat.enterMessage")}
        action
        value={this.state.input_value}
        onChange={(v, { value }) => this.setState({ input_value: value })}
      >
        <input
          dir={isRTLString(this.state.input_value) ? "rtl" : "ltr"}
          style={{ textAlign: isRTLString(this.state.input_value) ? "right" : "left" }}
        />
        <Button size="mini" positive onClick={this.newChatMessage}>
          {t("virtualChat.send")}
        </Button>
      </Input>
  );
};

const styles = StyleSheet.create({
  container   : {
    flex           : 1,
    padding        : 24,
    backgroundColor: '#eaeaea',
  },
  containerRtl: {
    direction: 'rtl',
    textAlign: 'right',
  },
  containerLtr: {
    direction: 'ltr',
    textAlign: 'left',
  },
  time        : {
    color: 'grey'
  }
});
