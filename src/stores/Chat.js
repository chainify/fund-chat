import { action, observable } from 'mobx';

class ChatStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable message = '';
    @observable sendCdmStatus = 'init';    
    @observable textareaFocused = false;
    @observable timerFrom = null;
    @observable noResponse = null;
    @observable responseTimeout = 360;
    @observable isCleared = false;

    @action
    initChat() {
        this.message = '';
        this.sendCdmStatus = 'init';
        this.textareaFocused = false;
        this.noResponse = null;
        this.timerFrom = null;
        this.isCleared = false;
    }

    @action
    clearChat() {
        const { cdms } = this.stores;
        cdms.list = null;
        this.isCleared = true;
        sessionStorage.clear();
    }
}

export default ChatStore;

