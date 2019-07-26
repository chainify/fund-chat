import { action, observable } from 'mobx';
import { enableBodyScroll } from 'body-scroll-lock';

class IndexStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable isActive = false;
    @observable targetElement = null;

    @action
    closeSession() {
        const { chat, cdms, form } = this.stores;   
        this.isActive = false;
        sessionStorage.clear();
        chat.initChat();
        form.initForm();
        cdms.initCdms();
        enableBodyScroll(this.targetElement);
    }
}

export default IndexStore;

