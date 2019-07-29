import { action, observable, toJS } from 'mobx';
import sha256 from 'js-sha256';
import axios from 'axios';
import ifvisible from 'ifvisible.js';
import * as moment from 'moment';
import stringFromUTF8Array from './../utils/batostr';

class CdmsStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable list = null;
    @observable lastCdmHash = null;
    @observable getListStatus = 'init';
    @observable sendCdmStatus = 'init';
    @observable groupHash = null;
    @observable pendnigDB = null;

    @action
    initCdms() {
        this.list = null;
        this.groupHash = null;
        this.pendnigDB = null;
        this.getListStatus ='init';
    }

    @action
    initLevelDB() {
        const levelup = require('levelup');
        const leveljs = require('level-js');
        
        this.pendnigDB = levelup(leveljs(`/root/.leveldb/pending_cdms_${this.groupHash}`));
    }

    @action
    getGroupHash(publicKeys) {
        const sorted = publicKeys.sort().join('');
        return sha256(sorted);
    }

    @action
    getList() {
        const { alice, index, utils, chat, wrapper } = this.stores;
    
        this.getListStatus = 'fetching';
        utils.sleep(this.list ? 1000 : 0).then(_ => {
            if (this.pendnigDB === null) { this.initLevelDB() }
            this.pendnigDB.createReadStream()
                .on('data', data => {
                    const attachmentHash = stringFromUTF8Array(data.key);
                    const message = stringFromUTF8Array(data.value);
                    const now = moment().unix();

                    const list = this.list ? this.list : [];

                    this.list = list.filter(el => el.hash !== attachmentHash).concat([{
                        'hash': attachmentHash,
                        'message': message,
                        'type': 'pending',
                        'timestamp': now
                    }]);
                })
                .on('end', _ => {
                    const formConfig = {}
                    axios
                        .get(`${process.env.API_HOST}/api/v1/cdms/${alice.publicKey}/${this.groupHash}`, formConfig)
                        .then(res => {
                            return res.data.cdms;
                        })
                        .then(list => {
                            return this.decryptList(list);
                        })
                        .then(list => {
                            if (list.length > 0) {
                                const lastCdm = list[list.length-1];
                                const sharedWith = lastCdm.sharedWith.map(el => el.publicKey);
                                const members = [];
                                for (let i = 0; i < sharedWith.length; i += 1) {
                                    if (members.indexOf(sharedWith[i]) < 0) {
                                        members.push(sharedWith[i]);
                                    }
                                }
                                
                                const groupHash = this.getGroupHash(members);
                                if (groupHash !== this.groupHash) {
                                    this.groupHash = groupHash;
                                    this.getList();
                                    throw 'Switching Group Hash';
                                }
                            }
                            return list;
                        })
                        .then(list => {
                            let pendings = this.list && this.list.filter(el => el.type === 'pending');
                            if (pendings) {
                                const pendingIndexesToDelete = [];
                                for (let i = 0; i < pendings.length; i += 1) {
                                    const count = list.filter(el => el.attachmentHash === pendings[i].hash);
                                    if (count.length > 0) {
                                        pendingIndexesToDelete.push(i);
                                        this.pendnigDB.del(pendings[i].hash);
                                    }
                                }

                                pendingIndexesToDelete.sort().reverse();
                                
                                for (let i = 0; i < pendingIndexesToDelete.length; i += 1) {
                                    const index = pendingIndexesToDelete[i];
                                    pendings.splice(index, 1);
                                }
                            } else {
                                pendings = [];
                            }

                            if (wrapper.isActive === false) {
                                this.initCdms();
                                return;
                            }

                            if (list.length > 0 && list[0].type === 'incoming') {
                                list[0].type = 'outgoing';
                            }
                            
                            if (list.length > (this.list ? this.list.filter(el => el.type !== 'pending').length : 0)) {
                                if (ifvisible.now('hidden')) {
                                    index.sound.play();
                                }
                                this.list = list.concat(pendings);
                            } else {
                                this.list = this.list ? this.list : [];
                            }

                            if (this.list.length === 0) {
                                chat.noResponse = false;
                            }
                            if (
                                this.list.length > 0 &&
                                this.list.length === this.list.filter(el => ['outgoing', 'pending'].indexOf(el.type) > -1).length
                            ) {
                                const listEl = this.list[0];
                                if (chat.timerFrom === null) {
                                    chat.timerFrom = listEl.timestamp;
                                    const now = Date.now() / 1000 | 0;
                                    const diff = now - chat.timerFrom;
                                    chat.noResponse = diff > chat.responseTimeout;                                 
                                }
                            }

                            if (this.list.filter(el => ['incoming'].indexOf(el.type) > -1).length > 0) {
                                chat.noResponse = false;
                                if (this.list[this.list.length - 1].message.toLowerCase() === 'консультация завершена') {
                                    chat.clearChat();
                                }
                            }
                            this.getListStatus = 'success';
                        })
                        .catch(e => {
                            console.log('err', e);
                            this.getListStatus = 'error';
                        })
                })
        })
    }

    @action
    sendCdm() {
        const { alice, chat, form, crypto, index } = this.stores;
        this.sendCdmStatus = 'pending';

        if (this.list === null) { return }

        let message = chat.message;
        if (this.list.length === 0) {
            message = `${form.name}, ${form.age}\r\n${chat.message}`;
        } 
        chat.message = '';

        let recipients;
        const incomings = this.list.filter(el => el.type === 'incoming');
        if (incomings.length > 0) {
            const distinct = (value, index, self) =>{
                return self.indexOf(value) === index;
            }
            recipients = incomings[incomings.length - 1].sharedWith.map(el => el.publicKey).filter(distinct);
        } else {
            recipients = [alice.publicKey, index.fundPublicKey];
        }
        console.log('recipients', toJS(recipients));
        
        const cdm = crypto.generateCdm(recipients, message);
        const now = moment().unix();
        const messageHash = sha256(cdm);

        const lastMessage = {
            'hash': messageHash,
            'message': message,
            'type': 'pending',
            'timestamp': now
        };
        
        this.list = this.list.concat([lastMessage]);
        this.pendnigDB.put(messageHash, message);

        const formData = new FormData();
        formData.append('message', cdm);

        axios.post(`${process.env.API_HOST}/api/v1/cdms`, formData, {})
            .then(_ => {
                this.sendCdmStatus = 'success';
            })
            .catch(e => {
                console.log('CDM Send error:', e);
                this.sendCdmStatus = 'error';

                const list = this.list;
                list.splice(-1, 1);
                this.list = list;
            })
    }

    @action
    decryptList(list) {
        const { crypto } = this.stores;
        if (list.length === 0) { return list }
        for (let i = 0; i < list.length; i += 1) {         
            const msg = crypto.decryptMessage(list[i].message, list[i].logicalSender)
            list[i].message = msg;
        }
        return list;
    }
}

export default CdmsStore;

