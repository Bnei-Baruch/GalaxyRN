import { Dimensions } from 'react-native';

class FeedSize {
  constructor() {
    this.update();
  }

  update = (isPortrait) => {
    const { height, width } = Dimensions.get('window');
    this.isPortrait         = isPortrait ?? height >= width;

    if (this.isPortrait) {
      this.width = parseInt(width / 2, 10);
      //this.height = parseInt(this.width * 9 / 16, 10);
    } else {
      this.width = parseInt((width / 4), 10);
      //this.height = parseInt(height / 3, 10);
      //this.width  = parseInt((this.width / 4), 10);
      //this.width  = parseInt(this.height * 16 / 9, 10);
    }
  };

  get = () => ({ width: this.width, height: this.height });

  getAspectRatio = (_isPortrait) => (_isPortrait ?? !this.isPortrait) ? 16 / 9 : 9 / 16;
}

export const feedSize = new FeedSize();
