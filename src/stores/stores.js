import Index from './Index';
import Wrapper from './Wrapper';
import Form from './Form';
import Chat from './Chat';
import Cdms from './Cdms';
import Utils from './Utils';
import Alice from './Alice';
import Crypto from './Crypto';


const stores = {};

stores.index = new Index(stores);
stores.wrapper = new Wrapper(stores);
stores.form = new Form(stores);
stores.chat = new Chat(stores);
stores.cdms = new Cdms(stores);
stores.utils = new Utils(stores);
stores.alice = new Alice(stores);
stores.crypto = new Crypto(stores);

export default stores;
