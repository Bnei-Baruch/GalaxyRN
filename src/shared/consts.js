export const videos_options = [
  {key: 1, label: "240p", value: 11},
  {key: 2, label: "360p", value: 1},
  {key: 3, label: "720p", value: 16},
  {key: 4, label: "NoVideo", value: -1},
];

export const audiog_options = [
  {key: 101, value: 101, label: "Workshop", disabled: true, icon: "tags", selected: true},
  {key: 1, value: 64, label: "Source"},
  {key: 2, value: 2, label: "Hebrew"},
  {key: 3, value: 3, label: "Russian"},
  {key: 4, value: 4, label: "English"},
  {key: 6, value: 6, label: "Spanish"},
  {key: 5, value: 5, label: "French"},
  {key: 8, value: 8, label: "Italian"},
  {key: 7, value: 7, label: "German"},
  {key: 100, value: 100, label: "Source", disabled: true, icon: "tags", selected: true},
  {key: "he", value: 15, label: "Hebrew"},
  {key: "ru", value: 23, label: "Russian"},
  {key: "en", value: 24, label: "English"},
  {key: "es", value: 26, label: "Spanish"},
  {key: "fr", value: 25, label: "French"},
  {key: "it", value: 28, label: "Italian"},
  {key: "de", value: 27, label: "German"},
  {key: "tr", value: 42, label: "Turkish"},
  {key: "pt", value: 41, label: "Portuguese"},
  {key: "bg", value: 43, label: "Bulgarian"},
  {key: "ka", value: 44, label: "Georgian"},
  {key: "ro", value: 45, label: "Romanian"},
  {key: "hu", value: 46, label: "Hungarian"},
  {key: "sv", value: 47, label: "Swedish"},
  {key: "lt", value: 48, label: "Lithuanian"},
  {key: "hr", value: 49, label: "Croatian"},
  {key: "ja", value: 50, label: "Japanese"},
  {key: "sl", value: 51, label: "Slovenian"},
  {key: "pl", value: 52, label: "Polish"},
  {key: "no", value: 53, label: "Norwegian"},
  {key: "lv", value: 54, label: "Latvian"},
  {key: "ua", value: 55, label: "Ukrainian"},
  {key: "nl", value: 56, label: "Dutch"},
  {key: "cn", value: 57, label: "Chinese"},
  {key: "et", value: 58, label: "Amharic"},
  {key: "in", value: 59, label: "Hindi"},
  {key: "ir", value: 60, label: "Persian"},
  {key: "ar", value: 62, label: "Arabic"},
  {key: "in", value: 63, label: "Indonesian"},
  {key: "hy", value: 65, label: "Armenian"},
  {key: 99, value: 99, label: "Special", disabled: true, icon: "tags", selected: true},
  {key: "heru", value: 10, label: "Heb-Rus"},
  {key: "heen", value: 17, label: "Heb-Eng"},
];

export const media_object = {
  audio: {
    context: null,
    device: null,
    devices: [],
    error: null,
    stream: null,
  },
  video: {
    setting: {width: 320, height: 180, ideal: 15},
    device: null,
    devices: [],
    error: null,
    stream: null,
  },
};
