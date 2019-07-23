import { action, observable } from 'mobx';

class UtilsStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @action
    sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));    
    }

    @action
    generateRandom(length) {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }
}

export default UtilsStore;

