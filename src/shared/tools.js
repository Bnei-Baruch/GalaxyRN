export const randomString = (len) => {
  let charSet   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomVal = '';
  for (let i = 0; i < len; i++) {
    let randomPoz = Math.floor(Math.random() * charSet.length);
    randomVal += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomVal;
};

export const geoInfo = (url, cb) => {
  console.log(url);
  fetch(`${url}`).then((response) => {
    if (response.ok) {
      return response.json().then((data) => cb(data));
    } else {
      cb(false);
    }
  }).catch((ex) => console.log(`get geoInfo`, ex));
};