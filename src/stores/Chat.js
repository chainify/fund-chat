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
    @observable responseTimeout = 240;

    @action
    initChat() {
        this.message = '';
        this.sendCdmStatus = 'init';
        this.textareaFocused = false;
        this.noResponse = null;
        this.timerFrom = null;
    }
}

export default ChatStore;

