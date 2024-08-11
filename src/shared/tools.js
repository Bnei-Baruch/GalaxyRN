export const randomString = (len) => {
  let charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomVal = '';
  for (let i = 0; i < len; i++) {
    let randomPoz = Math.floor(Math.random() * charSet.length);
    randomVal += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomVal;
};
