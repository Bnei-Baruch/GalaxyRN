import { useInRoomStore } from '../zustand/inRoom';
import { StyleSheet, View } from 'react-native';
import Member from './Member';
import { useSettingsStore } from '../zustand/settings';
import MyRoomMedia from '../components/MyRoomVideo';
import MemberNoVideo from './MemberNoVideo';
import { useMyStreamStore } from '../zustand/myStream';

const Members = () => {
  const { hideSelf, audioMode } = useSettingsStore();
  const { cammute, timestamp }  = useMyStreamStore();

  const memberIds = useInRoomStore((state) => {
    const _ms = Object.values(state.memberByFeed);
    _ms.sort((a, b) => {
      if (!!a.display?.is_group && !b.display?.is_group) {
        return -1;
      }
      if (!a.display?.is_group && !!b.display?.is_group) {
        return 1;
      }
      return a.display?.timestamp - b.display?.timestamp;
    });

    let notAddMy = hideSelf || (cammute && audioMode);
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

  return (
    <View style={styles.container}>
      {
        memberIds.length > 0 ? (
          memberIds
            .map(id => {
              if (!id)
                return null;

              if (id === 'my')
                return <MyRoomMedia key={id} />;

              if (audioMode)
                return <MemberNoVideo key={id} id={id} />;

              return <Member key={id} id={id} />;
            })
        ) : <MyRoomMedia />
      }
    </View>
  );
};
export default Members;

const styles = StyleSheet.create({
  container: {
    flex          : 1,
    flexDirection : 'row',
    flexWrap      : 'wrap',
    justifyContent: 'space-around',
    minHeight     : '100%',
  }
});
