var push = require('pushsafer-notifications');

var p = new push({
  k: 'bydK4Sl6cNGxFvxs2V7W',
  debug: true
});
const pushNoti = (message: string, title: string) => {
    p.send({
        m: message,
        t: title,
        s: "8", // sound
        v: "3", // vibration
        i: "1", // icon
    });
}

export default pushNoti;