import { action } from 'mobx';
import sha256 from 'js-sha256';
import stringFromUTF8Array from './../utils/batostr';
import { crypto } from '@waves/ts-lib-crypto';
const { signBytes, verifySignature, base58Encode, sharedKey, messageEncrypt, messageDecrypt, keyPair } = crypto({output: 'Base58'});
 

class CryptoStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @action
    wrapCdm(messages) {
        let cdm = '<?xml version="1.0"?>';
        cdm += '\r\n<cdm>';
        cdm += '\r\n<version>5</version>';
        cdm += '\r\n<blockchain>Waves</blockchain>';
        cdm += '\r\n<network>Mainnet</network>';
        cdm += '\r\n<messages>';
        cdm += messages;
        cdm += '\r\n</messages>';
        cdm += '\r\n</cdm>';
        return cdm;
    }

    @action
    encryptCdm(recipients, message) {
        const { alice, utils } = this.stores;     
        const rawMessage = message.trim();
        const rand = sha256(utils.generateRandom(64));
        const randMessage = rawMessage + '@' + rand;
        const messageHash = sha256(randMessage);

        let msg = '';
        for( let i = 0; i < recipients.length; i += 1) {
            
            const recipientPublicKey = recipients[i];
            const cypherBytes = messageEncrypt(sharedKey(alice.privateKey, recipientPublicKey, 'chainify'), randMessage);
            const cypherText = base58Encode(cypherBytes);

            const bytes = Uint8Array.from(messageHash)
            const signature = signBytes(keyPair(alice.seed), bytes);
            // const sigVerify = verifySignature(alice.publicKey, bytes, signature)
            
            msg += `\r\n<message>`
            msg += `\r\n<recipient>\r\n<publickey>${recipientPublicKey}</publickey>\r\n</recipient>`;
            msg += `\r\n<ciphertext>${cypherText}</ciphertext>`;
            msg += `\r\n<sha256>${messageHash}</sha256>`;
            msg += `\r\n<senders>\r\n<sender>\r\n<publickey>${alice.publicKey}</publickey>\r\n<signature>${signature}</signature>\r\n</sender>\r\n</senders>`;
            msg += `\r\n</message>`;
        }
        return msg;
    }

    @action
    verifySig() {
        const bytes = Uint8Array.from('066b07e0be41eba72c3322b537e505e3b29c97383b6dbc197f9f04e7915b8b14');
        const sigVerify = verifySignature('czydvbuFMnmA8Qex6sE4fjS2orjefRJeGzr5SWz1oWR', bytes, '5GiqSDtFwatFTx3E4rPGsCsNtpbs32GMt9cLX2zXUn1Mr5xb1WxaCzcW6ypuUoBuk96kCgDzvSzXLiA9Dgjg63qc');
    }

    @action
    generateCdm(recipients, message) {
        const msg = this.encryptCdm(recipients, message);
        return this.wrapCdm(msg);
    }

    @action
    decryptMessage(cypherText, bobPublicKey) {
        const { alice } = this.stores;
        // const sharedKey = base58Encode(sk(alice.privateKey, bobPublicKey));
        let decryptedMessage;
        try {
            decryptedMessage = messageDecrypt(sharedKey(alice.privateKey, bobPublicKey, 'chainify'), cypherText);
        } catch (err) {
            decryptedMessage = '⚠️ Decoding error';
        }
        return decryptedMessage.replace(/@[\w]{64}$/gmi, "");
    }
}

export default CryptoStore;

