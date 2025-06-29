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
        <View style={styles.content}>
          <RenderHtml
            contentWidth={contentWidth}
            source={source}
            baseStyle={{
              color: 'white',
            }}
            tagsStyles={{
              a: {
                color: '#3498db',
              },
              '*': {
                color: 'white',
              },
            }}
          />
        </View>
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
  content: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
});
