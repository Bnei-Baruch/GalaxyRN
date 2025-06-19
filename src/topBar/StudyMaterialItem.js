import * as React from 'react';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHtml from 'react-native-render-html';

export const StudyMaterialItem = ({ msg }) => {
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const contentWidth = width - 20;

  const { Title, Description } = msg;

  const source = {
    html: Description.toString(),
  };
  const toggleOpen = () => setOpen(!open);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleOpen} style={styles.title}>
        <Text style={{ color: 'white' }}>{Title}</Text>
      </TouchableOpacity>

      {open && (
        <RenderHtml
          contentWidth={contentWidth}
          source={source}
          tagsStyles={{
            body: {
              color: 'black',
              backgroundColor: 'white',
              padding: 8,
              dir: isLtr ? 'ltr' : 'rtl',
            },
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  title: {
    backgroundColor: '#555',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
});
