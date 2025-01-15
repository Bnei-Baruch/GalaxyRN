import { useInRoomStore } from '../../zustand/inRoom';
import { StyleSheet, View } from 'react-native';
import Feed from './Feed';
import { useSettingsStore } from '../../zustand/settings';
import MyRoomMedia from './MyRoomVideo';
import FeedAudioMode from './FeedAudioMode';
import { useMyStreamStore } from '../../zustand/myStream';
import { useRef } from 'react';
import { useUiActions } from '../../zustand/uiActions';
import MyAudioMode from './MyAudioMode';

const Feeds = () => {
  const { hideSelf, audioMode } = useSettingsStore();
  const { cammute, timestamp }  = useMyStreamStore();
  const { setFeedsPos }         = useUiActions();

  const ref = useRef({});

  const feedIds      = useInRoomStore((state) => {
    const _ms = Object.values(state.feedById);
    _ms.sort((a, b) => {
      if (!!a.display?.is_group && !b.display?.is_group) {
        return -1;
      }
      if (!a.display?.is_group && !!b.display?.is_group) {
        return 1;
      }
      return a.display?.timestamp - b.display?.timestamp;
    });

    let notAddMy = hideSelf;
    if (_ms.length === 0) {
      return notAddMy ? [] : ['my'];
    }

    return _ms.reduce((acc, x, i) => {
      if (!x)
        return acc;

      if (!notAddMy) {
        const next = _ms[i + 1];
        if (x.display?.timestamp > timestamp || !next) {
          acc.push('my');
          notAddMy = true;
        }
      }

      acc.push(x.id);
      return acc;
    }, []);
  });
  const handleLayout = (event) => setFeedsPos(event.nativeEvent.layout.y);

  return (
    <View style={styles.container} onLayout={handleLayout} ref={ref}>
      {
        feedIds.length > 0 ? (
          feedIds
            .map(id => {
              if (!id)
                return null;
              if (id === 'my')
                return (audioMode && cammute) ? <MyAudioMode key={id} /> : <MyRoomMedia key={id} />;

              if (audioMode)
                return <FeedAudioMode key={id} id={id} />;

              return <Feed key={id} id={id} />;
            })
        ) : <MyRoomMedia />
      }
    </View>
  );
};
export default Feeds;

const styles = StyleSheet.create({
  container: {
    flex          : 1,
    flexDirection : 'row',
    flexWrap      : 'wrap',
    justifyContent: 'space-around',
    minHeight     : '100%'
  }
});
