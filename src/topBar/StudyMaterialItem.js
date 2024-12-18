import * as React from 'react';
import { useState } from 'react';
import { Text, View, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import RenderHtml from 'react-native-render-html';

export const StudyMaterialItem = ({ msg }) => {
  const [open, setOpen] = useState(false);
  const { width }       = useWindowDimensions() - 20;

  const { Title, Description } = msg;

  const source     = {
    html: Description.toString()
  };
  const toggleOpen = () => setOpen(!open);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggleOpen}
        style={styles.title}
      >
        <Text>{Title}</Text>
      </TouchableOpacity>

      {
        open && (
          <View style={styles.content}>
            <RenderHtml contentWidth={width} source={source} />
          </View>
        )
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomColor: '#555',
    borderBottomWidth: 1
  },
  title    : {
    backgroundColor  : '#CCC',
    paddingVertical  : 10,
    paddingHorizontal: 5
  },
  content  : {
    paddingHorizontal: 5
  }
});
