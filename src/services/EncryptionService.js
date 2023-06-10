import secrets from 'secrets.js';
const CryptoJS = require("crypto-js");

export  class EncryptionService  {

    constructor() {

    }

    static hash =  (dataToHash) => {
        return CryptoJS.SHA256(dataToHash).toString();
    };

    static decrypt = async (dataToDecrypt, secretKey, iv) => {
        const encryptionOptions = {
            iv      : CryptoJS.enc.Hex.parse(iv),
            mode    : CryptoJS.mode.CTR,
            padding : CryptoJS.pad.NoPadding,
            hasher  : CryptoJS.algo.SHA256
        };

        const key           = CryptoJS.enc.Hex.parse(secretKey);
        const ciphertext    = CryptoJS.enc.Hex.parse(dataToDecrypt);
        const decrypted     = CryptoJS.AES.decrypt({ciphertext:ciphertext}, key, encryptionOptions);
        return decrypted.toString(CryptoJS.enc.Utf8);
    };

    static combineShares = async (shares) => {
        let comb = secrets.combine(shares);
        return secrets.hex2str(comb);
    };



}

