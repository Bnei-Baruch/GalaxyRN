import { useInRoomStore } from '../zustand/inRoom';
import { StyleSheet, View } from 'react-native';
import Member from './Member';
import { useSettingsStore } from '../zustand/settings';
import MemberNoVideo from './MemberNoVideo';
import MyRoomMedia from '../components/MyRoomVideo';

const Members = () => {
  const members       = useInRoomStore((state) => Object
    .values(state.memberByFeed)
    .map(x => x.id)
    .filter(x => !!x));
  const { audioMode } = useSettingsStore();

  return (
    <View style={styles.container}>
      <MyRoomMedia />
      {
        members
          .map(id => (
            !audioMode ?
              <Member key={id} id={id} />
              : <MemberNoVideo key={id} member={id} />
          ))

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
  }
});
