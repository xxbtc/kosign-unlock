import secrets from 'secrets.js';
import { CURRENT_VAULT_VERSION, VAULT_VERSIONS } from '../config/vaultConfig';

const CryptoJS = require("crypto-js");

export  class EncryptionService  {

    constructor() {

    }

    static hash =  (dataToHash) => {
        return CryptoJS.SHA256(dataToHash).toString();
    };

    static decrypt = async (dataToDecrypt, secretKey, iv, version = CURRENT_VAULT_VERSION) => {
        // Version validation
        if (!VAULT_VERSIONS[version]) {
            throw new Error(`Unsupported vault version: ${version}. Please update your software.`);
        }

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
        console.log('combineShares called with', shares.length, 'shares');
        
        try {
            let comb = secrets.combine(shares);
            return secrets.hex2str(comb);
        } catch (error) {
            console.error('Error in combineShares:', error);
            throw new Error(`Failed to combine shares: ${error.message}`);
        }
    };

}

