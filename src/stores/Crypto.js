import { action, observable } from 'mobx';
import sha256 from 'js-sha256';
import { getSharedKey, encryptMessage, signBytes, base58encode, verifySignature, decryptMessage } from "../components/waves-crypto"

class CryptoStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @action
    wrapCdm(msg) {
        let cdm = '-----BEGIN_CDM_VERSION 3-----';
        cdm += '\r\n-----BEGIN_BLOCKCHAIN WAVES-----';
        cdm += msg;
        cdm += '\r\n-----END_BLOCKCHAIN WAVES-----';
        cdm += '\r\n-----END_CDM_VERSION 3-----';
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
            const sharedKey = base58encode(getSharedKey(alice.privateKey, recipientPublicKey));
            const cypherText = encryptMessage(sharedKey, randMessage, 'chainify');

            const bytes = Uint8Array.from(messageHash)
            const signature = signBytes(bytes, alice.seed);
            // const sigVerify = verifySignature(alice.publicKey, Uint8Array.from(messageHash), signature)
            // console.log('sigVerify', sigVerify);
            
            msg += `\r\n-----BEGIN_RECIPIENT ${recipientPublicKey}-----`;
            msg += `\r\n-----BEGIN_MESSAGE-----\r\n${cypherText}\r\n-----END_MESSAGE-----`;
            msg += `\r\n-----BEGIN_SHA256-----\r\n${messageHash}\r\n-----END_SHA256-----`;
            msg += `\r\n-----BEGIN_SIGNATURE ${alice.publicKey}-----\r\n${signature}\r\n-----END_SIGNATURE ${alice.publicKey}-----`;     
            msg += `\r\n-----END_RECIPIENT ${recipientPublicKey}-----`;
        }
        return msg;
    }

    @action
    verifySig() {
        const bytes = Uint8Array.from('066b07e0be41eba72c3322b537e505e3b29c97383b6dbc197f9f04e7915b8b14')
        console.log(bytes);
        
        const sigVerify = verifySignature('czydvbuFMnmA8Qex6sE4fjS2orjefRJeGzr5SWz1oWR', bytes, '5GiqSDtFwatFTx3E4rPGsCsNtpbs32GMt9cLX2zXUn1Mr5xb1WxaCzcW6ypuUoBuk96kCgDzvSzXLiA9Dgjg63qc')
        console.log('sigVerify', sigVerify);
    }

    @action
    generateCdm(recipients, message) {
        const msg = this.encryptCdm(recipients, message);
        return this.wrapCdm(msg);
    }

    @action
    decryptMessage(cypherText, bobPublicKey) {
        const { alice } = this.stores;
        const sharedKey = base58encode(getSharedKey(alice.privateKey, bobPublicKey));
        let decryptedMessage;
        try {
            decryptedMessage = decryptMessage(sharedKey, cypherText, 'chainify');
        } catch (err) {
            decryptedMessage = '⚠️ Decoding error';
        }
        return decryptedMessage.replace(/@[\w]{64}$/gmi, "");
    }
}

export default CryptoStore;

