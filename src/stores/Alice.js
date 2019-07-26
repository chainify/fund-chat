import { action, observable } from 'mobx';
import axios from 'axios';
import { randomSeed, publicKey, privateKey } from '@waves/ts-lib-crypto';

class FormStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.heartbeat = this.heartbeat.bind(this);
        this.initAlice = this.initAlice.bind(this);
    }

    @observable seed = null;
    @observable publicKey = null;
    @observable privateKey = null;
    @observable heartbeatStatus = 'init';

    @action
    heartbeat() {
        const {  utils, cdms } = this.stores;
        const formConfig = {};
        const formData = new FormData();
        formData.append('publicKey', this.publicKey);
        this.heartbeatStatus = 'pending';
        utils.sleep(1000).then(_ => {
            axios.post(`${process.env.API_HOST}/api/v1/heartbeat`, formData, formConfig)
                .then(res => {
                    const lastCdmHash = res.data.lastCdm ? res.data.lastCdm[0] : null;
                    
                    if (cdms.lastCdmHash !== lastCdmHash) {
                        cdms.lastCdmHash = lastCdmHash;
                    }
                    this.heartbeatStatus = 'success';
                })
                .catch(e => {
                    this.heartbeatStatus = 'error';
                });
        })
    }

    @action
    initAlice() {
        const newSeed = randomSeed();
        const seedPhrase = sessionStorage.getItem('seedPhrase');
        
        if (seedPhrase) {
            this.seed = seedPhrase;
        } else {
            sessionStorage.setItem('seedPhrase', newSeed);
            this.seed = newSeed;
        }

        this.publicKey = publicKey(this.seed);
        this.privateKey = privateKey(this.seed);
        this.heartbeatStatus = 'init';
    }
}

export default FormStore;

