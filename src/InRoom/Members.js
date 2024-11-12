import { useInRoomStore } from '../zustand/inRoom';
import { StyleSheet, View } from 'react-native';
import Member from './Member';
import { useSettingsStore } from '../zustand/settings';
import MemberNoVideo from './MemberNoVideo';
import MyRoomMedia from '../components/MyRoomVideo';

const Members = () => {
  const members       = useInRoomStore((state) => {
    console.log('Members from map tp list', state.memberByFeed);
    const _ms = Object.values(state.memberByFeed).filter(m => !!m);
    _ms.sort((a, b) => {
      if (!!a.display?.is_group && !b.display?.is_group) {
        return -1;
      }
      if (!a.display?.is_group && !!b.display?.is_group) {
        return 1;
      }
      return a.display?.timestamp - b.display?.timestamp;
    });

    let needAdd = !useSettingsStore.getState().hideSelf;
    return _ms.reduce((acc, x, i) => {
      if (!x)
        return acc;

      if (needAdd && x.timestamp < state.myTymstemp) {
        acc.push('my');
        needAdd = false;
      }

      acc.push(x.id);

      if (needAdd && i === _ms.length - 1) {
        acc.push('my');
      }
      return acc;
    }, []);
  });
  const { audioMode } = useSettingsStore();
  console.log('Members render', members);
  return (
    <View style={styles.container}>
      {
        members.length > 0 ? (
          members
            .map(id => {
              if (!id)
                return null;

              if (id === 'my')
                return <MyRoomMedia key={id} />;

              if (audioMode)
                return <MemberNoVideo key={id} member={id} />;

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
