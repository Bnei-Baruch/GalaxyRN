import { Dimensions } from 'react-native';

class FeedWidth {
  w              = Dimensions.get('window').width / 2 - 1;
  isPortrait     = true;
  set            = (isPortrait) => {
    this.w          = isPortrait ? Dimensions.get('window').width / 2 - 1 : Dimensions.get('window').width / 4 - 1;
    this.isPortrait = isPortrait;
  };
  get            = () => this.w;
  getAspectRatio = (_isPortrait) => (_isPortrait ?? !this.isPortrait) ? 16 / 9 : 9 / 16;
}

export const feedWidth = new FeedWidth();
