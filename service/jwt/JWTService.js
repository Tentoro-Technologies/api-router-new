const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');

const secret = "Let everyone believe in the false , let not truth be the false";

module.exports.generateEncryptedToken = function(info) {
    const token = jwt.sign({details : info}, secret);
    const encryptedToken = CryptoJS.AES.encrypt(token, secret).toString();
    return encryptedToken;
  }

  module.exports.decryptAndValidateToken =function(encryptedToken) {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, secret);
    const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);
  
    try {
      const decoded = jwt.verify(decryptedToken, secret);
      return { valid: true, decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
  
