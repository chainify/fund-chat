import { action, observable } from 'mobx';

class FormStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable name = '';
    @observable age = '';
    @observable submitted = false;

    @action
    initForm() {
        this.name = '';
        this.age = '';
        this.submitted = false;
    }
}

export default FormStore;

