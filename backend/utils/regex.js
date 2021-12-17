module.exports.testUrl = (string) => {
  const pattern = /^(https?:\/\/)([\w\-._~:/?%#[\]@!$&'()*+,;=]+)/;
  return pattern.test(string);
};
