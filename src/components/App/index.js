import { h, render, Component } from "preact";
import {address, keyPair, publicKey, base58encode, signBytes, getSharedKey, encryptMessage, decryptMessage, buildAddress, base58decode} from "../waves-crypto";
import sha256 from 'js-sha256';
import axios from 'axios';
import { Seed } from '@waves/signature-generator'
import MessageList from "../MessageList";
import "./style.scss";

export default class App extends Component {

  constructor() {
    super();
    this.state.messages = [];
    this.state.pendingMessages = [];
    this.state.isChatOpened = false;
    this.state.message = "";
    this.state.isLogined = false;
    this.state.name = "";
    this.state.age = "";
    this.state.question = "";
    // this.state.seed = "canvas okay bus gorilla chest debate upgrade marriage raw arrange member tobacco";
    this.state.seed = this.getSeed();
    this.messagesList = {}
  }
  
  componentDidMount() {
    this.getSeed();
    this.getMessages();
    window.changeChatState = () => {
       this.setState({isChatOpened: !this.state.isChatOpened});
       if (this.state.isChatOpened) {
        setTimeout(this.scrollToBottom,100);
       }
    };
  }

  getSeed() {
    const sessionSeed = sessionStorage.getItem('seed');
    if (!sessionSeed) {
      const newSeed = Seed.create().phrase;
      sessionStorage.setItem('seed', newSeed);
      return newSeed;
    } else {
      return sessionSeed;
    }
  }
  
  changePopupState = () => {
    this.setState({isChatOpened: !this.state.isChatOpened});

  }
  
  handleChange = (event) => {
    this.setState({[event.target.name]: event.target.value});
  }
  
  generateEncryptedMessage(message, recipientPubKey) {
    const signature = Waves.sign
  }

  handleWelcomeFormSubmit = (event) => {
    event.preventDefault();
    const message = `Имя: ${this.state.name}, возраст: ${this.state.age}, \r\n${this.state.question}`;
    this.sendMessage(message, 'initial');
  }

  handleSendMessageFormSubmit = (event) => {
    event.preventDefault();
    const message = this.state.message;
    this.sendMessage(message);
  }

  decryptMessage(message) {
    const recipientPublicKey = this.props.fundpubkey;
    const seed = this.state.seed;
    const alice = keyPair(seed);
    const sharedKey = base58encode(getSharedKey(alice.private, recipientPublicKey));
    return decryptMessage(sharedKey, message, 'chainify');
  }

  scrollToBottom = () => {
    const messagesList = this.state.messagesList;
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  setMessagesListRef = (component) => {
    this.state.messagesList = component;
  }

  getMessages = (initial = false) => {
    const address = `http://142.93.166.125/api/v1/cdm/${publicKey(this.state.seed)}/${this.props.fundpubkey}`;
    setInterval(() => {
      axios.get(address).then((res) => {
        const cdms = res.data.cdms;
        const cdmstxIds = cdms.map(cdm => cdm.txId);
        const decryptedMessages = cdms.map((cdm) => {
          return {message: this.decryptMessage(cdm.message), timestamp: cdm.timestamp, type: cdm.type, recipient: cdm.recipient}
        })
        const nonDeliveredMessages = this.state.pendingMessages.filter(message => !cdmstxIds.includes(message.txId));
        if (nonDeliveredMessages.length === 0) {
          this.setState({pendingMessages: []});
        }
        const hasToScroll = this.state.messages.length !== decryptedMessages.length;
        this.setState({messages: decryptedMessages});
        if (hasToScroll) {
          this.scrollToBottom();
        }
      }).catch((e) => console.log(e))
    }, 1000);
  }
  
  sendMessage(message, initial = '') {
    const hasAnswer = (initial === 'initial') || (this.state.messages.length > 1);
    if (hasAnswer) {
      const fundAddress = buildAddress(base58decode(this.props.fundpubkey), 'T');
      const recipientPublicKey = this.props.fundpubkey;
      const seed = this.state.seed;
      const alice = keyPair(seed);
      const sharedKey = getSharedKey(alice.private, recipientPublicKey);
      const sha = sha256(message);
      const signature = signBytes(Buffer.from(sha), seed);
      const b58sk  = base58encode(sharedKey);
      const cypherText = encryptMessage(b58sk, message, 'chainify');
      let encryptedMessage = '';
      encryptedMessage += '-----BEGIN_BLOCKCHAIN WAVES-----';
      encryptedMessage += `\r\n-----BEGIN_PK ${recipientPublicKey}-----\r\n${cypherText}\r\n-----END_PK ${recipientPublicKey}-----`;
      if (this.state.messages.length > 1) {
        const operatorPubKey = this.state.messages[1].recipient;
        const cypherTextForOperator = encryptMessage(base58encode(getSharedKey(alice.private, operatorPubKey)), message, 'chainify');
        encryptedMessage += `\r\n-----BEGIN_PK ${operatorPubKey}-----\r\n${cypherTextForOperator}\r\n-----END_PK ${operatorPubKey}-----`;
      }
      encryptedMessage += `\r\n-----BEGIN_SHA256-----\r\n${sha}\r\n-----END_SHA256-----`;
      encryptedMessage += `\r\n-----BEGIN_SIGNATURE ${alice.public}-----\r\n${signature}\r\n-----END_SIGNATURE ${alice.public}-----`;
      encryptedMessage += '\r\n-----END_BLOCKCHAIN WAVES-----';
      const timestamp = Date.now()/1000;
      const newMessage = {
        message: message,
        type: 'outgoing',
        timestamp
      }
      const formData = new FormData();
      formData.append('message', encryptedMessage);
      formData.append('recipient', fundAddress);
      const formDataNewClient = new FormData();
      formDataNewClient.append('publicKey', alice.public);
      const that = this;
      // setInterval(() => {
      //   axios.post('http://142.93.166.125/api/v1/accounts', formDataNewClient, {}).catch((e) => console.log(e));
      // }, 1000);
      axios.post('http://142.93.166.125/api/v1/cdm', formData, {})
        .then(function(response){
          newMessage.txId = response.data.tx.id;
          that.setState({pendingMessages: [...that.state.pendingMessages, newMessage]}, () => that.scrollToBottom());
          if (initial === 'initial') {
            setInterval(() => {
              axios.post('http://142.93.166.125/api/v1/accounts', formDataNewClient, {}).catch((e) => console.log(e));
            }, 1000);
          } else {
            return true
          }
        })
        .catch(function (error) {
          console.log(error);
        })
    }
  }

  renderWelcomeForm() {
    if (this.state.messages.length === 0 && this.state.pendingMessages.length === 0) {
      return (
        <form action="" class="cdm-welcome-form" onSubmit={this.handleWelcomeFormSubmit}>
          <div class="cdm-welcome-form__row">
            <div className="cdm-welcome-form__input">
              <input type="text" name="name" placeholder="имя" onInput={this.handleChange} class="cdm-input"/>
            </div>
            <div className="cdm-welcome-form__input">
              <input type="text" name="age" placeholder="возраст" onInput={this.handleChange} class="cdm-input"/>
            </div>
          </div>
          <textarea placeholder="Ваш вопрос" name="question" class="cdm-welcome-form__question cdm-textarea" onInput={this.handleChange}></textarea>
          <button type="submit" class="cdm-welcome-form__submit cdm-btn">Отправить</button>
        </form>
      )
    } else {
      return false
    }
  }

  renderSendMessageForm() {
    const hasNoAnswer = (this.state.messages.length === 1 || (this.state.messages.length === 0 && this.state.pendingMessages.length === 1));
    if (this.state.messages.length === 0 && this.state.pendingMessages.length === 0 || hasNoAnswer) {
      return false
    } else {
      return (
        <form onSubmit={this.handleSendMessageFormSubmit} class="cdm-chat__inputform">
        <textarea type="text" name="message" placeholder="введите сообщение" onInput={this.handleChange} class="cdm-textarea"></textarea>
        <button type="submit" class="cdm-chat__sendbtn">Отправить</button>
        </form>
      )
    }
  }
  
	render(props, state) {
	 const chatClass = this.state.isChatOpened ? "cdm-chat cdm-chat--opened" : 'cdm-chat';
   const chatStarted = (state.messages.length === 0 && state.pendingMessages.length === 0);

	 return (
	  <article class={chatClass}>
	    <div class="cdm-chat__wrapper">
	    <div class="cdm-chat__container">
	      <div class="cdm-chat__content">
          { chatStarted && (<div class="cdm-chat__welcome"><h3 class="cdm-chat__welcometext">
            Здравствуйте! <br/> Задайте свой вопрос консультанту
          </h3> </div>)}
          {this.renderWelcomeForm()}
	        <MessageList messages={this.state.messages} pendingMessages={this.state.pendingMessages} setMessagesListRef={this.setMessagesListRef}/>
	        {this.renderSendMessageForm()}
	     </div>
	    </div>
	    <button href="#" class="cdm-chat__close" onClick={this.changePopupState}>x</button>
	   </div>
	  </article>
	 )
	}
}



