import { action, observable } from 'mobx';

class IndexStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable fundPublicKey = null;
    @observable sound = null;
    @observable startTime = null;
    @observable endTime = null;

    @observable properTime = null;
}

export default IndexStore;

