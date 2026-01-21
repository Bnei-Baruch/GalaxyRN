import * as React from 'react';
import { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import Text from '../../components/CustomText';

const customHTMLElementModels = {
  font: {
    tagName: 'font',
    mixedUAStyles: {
      color: 'white',
    },
    contentModel: 'textual',
  },
};

export const StudyMaterialItem = ({ msg }) => {
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const contentWidth = width - 20;

  const { Title, Description } = msg;

  const toggleOpen = () => {
    setOpen(!open);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleOpen} style={styles.title}>
        <Text style={{ color: 'white' }}>{Title}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.content}>
          <RenderHtml
            contentWidth={contentWidth}
            source={{
              html: Description,
            }}
            baseStyle={{
              color: 'white',
              fontSize: 14,
            }}
            tagsStyles={{
              div: { color: 'white' },
              p: { color: 'white' },
              span: { color: 'white' },
              b: { color: 'white', fontWeight: 'bold' },
              u: { color: 'white', textDecorationLine: 'underline' },
              a: { color: 'blue' },
              font: { color: 'white' },
            }}
            customHTMLElementModels={customHTMLElementModels}
            ignoredStyles={['color', 'background-color', 'font-family']}
            enableExperimentalBRCollapsing={true}
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
    backgroundColor: '#333',
  },
});
