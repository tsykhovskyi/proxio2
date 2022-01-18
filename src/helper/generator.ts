const alphaNumDict = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateAlphaNum(length: number) {
  let str = "";
  for (let i = 0; i < length; i++) {
    str += alphaNumDict.charAt(Math.floor(Math.random() * alphaNumDict.length));
  }
  return str;
}
