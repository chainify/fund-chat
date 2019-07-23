import { action, observable } from 'mobx';
import axios from 'axios';
import { Seed } from '@waves/signature-generator'
import { publicKey, privateKey } from "../components/waves-crypto";

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
        const {  utils, wrapper } = this.stores;
        const formConfig = {};
        const formData = new FormData();
        formData.append('publicKey', this.publicKey);
        this.heartbeatStatus = 'pending';
        utils.sleep(1000).then(_ => {
            axios.post(`${process.env.API_HOST}/api/v1/accounts`, formData, formConfig)
                .then(_ => {  
                    this.heartbeatStatus = 'success';
                })
                .catch(e => {
                    this.heartbeatStatus = 'error';
                });
        })
    }

    @action
    initAlice() {
        const { form } = this.stores;
        const newSeed = Seed.create().phrase;
        const seedPhrase = sessionStorage.getItem('seedPhrase');
        console.log('alice init', seedPhrase);
        
        if (seedPhrase) {
            console.log('existing user');
            this.seed = seedPhrase;
        } else {
            sessionStorage.setItem('seedPhrase', newSeed);
            this.seed = newSeed;
        }

        this.publicKey = publicKey(this.seed);
        this.privateKey = publicKey(this.seed);
        this.heartbeatStatus = 'init';
    }
}

export default FormStore;

