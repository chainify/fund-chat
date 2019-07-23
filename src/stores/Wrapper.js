import { action, observable } from 'mobx';

class IndexStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable isActive = false;

    @action
    closeSession() {
        const { chat, cdms, form } = this.stores;   
        this.isActive = false;
        sessionStorage.clear();
        chat.initChat();
        form.initForm();
        cdms.initCdms();
    }
}

export default IndexStore;

