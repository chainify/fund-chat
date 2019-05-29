import { h, render, Component } from "preact";
import {address, keyPair, publicKey, base58encode, signBytes, getSharedKey, encryptMessage, decryptMessage, buildAddress, base58decode} from "../waves-crypto";
import sha256 from 'js-sha256';
import axios from 'axios';
import { Seed } from '@waves/signature-generator'
import MessageList from "../MessageList";
import "./style.scss";

let fundInterval;
const sound = new Audio("./assets/notification.mp3");

export default class App extends Component {

  constructor() {
    super();
    this.state.messages = [];
    this.state.initialMessage = {};
    this.state.pendingMessages = [];
    this.state.isChatOpened = false;
    this.state.message = "";
    this.state.isLogined = false;
    this.state.name = "";
    this.state.age = "";
    this.state.question = "";
    this.state.operator = "";
    this.state.sessionFinished = true;
    // this.state.seed = "canvas okay bus gorilla chest debate upgrade marriage raw arrange member tobacco";
    this.state.seed = this.getSeed();
    this.state.messagesList = {}
    this.state.wasInitialSent = false;
  }
  
  componentDidMount() {
    this.getSeed();
    this.getMessages();
    if (sessionStorage.getItem('wasInitialSent')) {
      this.setState({wasInitialSent: true});
    }
    window.changeChatState = () => {
       this.setState({isChatOpened: !this.state.isChatOpened});
       if (this.state.isChatOpened) {
        setTimeout(this.scrollToBottom,100);
        const formDataNewClient = new FormData();
        formDataNewClient.append('publicKey', publicKey(this.state.seed));
        window.isOnline = setInterval(() => {
          axios.post('https://chainify.org/api/v1/accounts', formDataNewClient, {}).catch((e) => console.log(e));
        }, 1000);
       } else {
        clearInterval(window.isOnline);
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
    if (message === '') { return }
    this.sendMessage(message);
    this.setState({message: ''});
  }

  decryptMessage(message,recipientPublicKey) {
    const seed = this.state.seed;
    const alice = keyPair(seed);
    const sharedKey = base58encode(getSharedKey(alice.private, recipientPublicKey));
    const decryptedMessage = decryptMessage(sharedKey, message, 'chainify');
    return decryptedMessage;
  }

  scrollToBottom = () => {
    const messagesList = this.state.messagesList;
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  setMessagesListRef = (component) => {
    this.state.messagesList = component;
  }

  getMessages = () => {
    let endpoint = '';
    let operator = '';
    endpoint = `https://chainify.org/api/v1/cdm/${publicKey(this.state.seed)}/${this.props.fundpubkey}`;
    fundInterval = setInterval(() => {
      
      if (this.state.wasInitialSent && this.state.isChatOpened) {
        axios.get(endpoint).then((res) => {
          const cdms = res.data.cdms;
          if (cdms.length > 0) {
            const cdmstxIds = cdms.map(cdm => cdm.txId);
            const decryptedMessages = cdms.map((cdm) => {
              return {message: this.decryptMessage(cdm.message, this.props.fundpubkey), timestamp: cdm.timestamp, type: cdm.type, recipient: cdm.recipient}
            });
            const nonDeliveredMessages = this.state.pendingMessages.filter(message => !cdmstxIds.includes(message.txId));
            if (nonDeliveredMessages.length === 0) {
              this.setState({pendingMessages: []});
            }
            const hasToScroll = this.state.messages.length !== decryptedMessages.length;
            operator = cdms[0].forwardedTo[0];
            const initialMessage = {
              message: decryptedMessages[0],
              timestamp: cdms[0].timestamp,
              type: cdms[0].type,
            }
            this.setState({initialMessage: initialMessage, messages: decryptedMessages});
            if (hasToScroll) {
              this.scrollToBottom();
            }
            if (operator) {
              this.setState({operator})
              clearInterval(fundInterval);
              endpoint = `https://chainify.org/api/v1/cdm/${publicKey(this.state.seed)}/${operator}`;
              const operatorInterval = setInterval(() => {
                if (this.state.wasInitialSent && this.state.isChatOpened) {
                    axios.get(endpoint).then((res) => {
                      const cdms = res.data.cdms;
                      if (cdms.length > 0 && cdms[cdms.length-1].hash === '7f642be8c8c3b67d3a1119fb9ab69e8c5505347140f2e78b5833f96997fd8424') {
                        clearInterval(operatorInterval);
                        this.setState({sessionFinished: true});
                        const newSeed = Seed.create().phrase;
                        sessionStorage.setItem('seed', newSeed);
                        this.setState({seed: newSeed});
                        clearInterval(operatorInterval);
                      }
                      const cdmstxIds = cdms.map(cdm => cdm.txId);
                      const decryptedMessages = cdms.map((cdm) => {
                        return {message: this.decryptMessage(cdm.message, operator), timestamp: cdm.timestamp, type: cdm.type}
                      });
                      const nonDeliveredMessages = this.state.pendingMessages.filter(message => !cdmstxIds.includes(message.txId));
                      if (nonDeliveredMessages.length === 0) {
                        this.setState({pendingMessages: []});
                      }
                      const hasToScroll = this.state.messages.length !== decryptedMessages.length;
                      
                      this.setState({messages: [initialMessage.message, ...decryptedMessages]});
                  
                      if (hasToScroll) {
                        this.scrollToBottom();
                        if (document.visibilityState!=="visible" && this.state.isChatOpened){
                          sound.play();
                        }
                      }
                    }).catch((e) => console.log(e))
                  }
                }, 1000);
              }
            }
        }).catch((e) => console.log(e))
      }
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
        const operatorPubKey = this.state.operator;
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
      console.log(recipientPublicKey);
      formData.append('recipient', recipientPublicKey);
      const formDataNewClient = new FormData();
      formDataNewClient.append('publicKey', alice.public);
      const that = this;
      axios.post('https://chainify.org/api/v1/cdm', formData, {})
        .then(function(response){
          newMessage.txId = response.data.tx.id;
          that.setState({pendingMessages: [...that.state.pendingMessages, newMessage]}, () => {that.scrollToBottom()});
          if (initial === 'initial') {
            that.setState({wasInitialSent: true});
            sessionStorage.setItem('wasInitialSent', 'true');
          }
        })
        .catch(function (error) {
          console.log(error);
        })
    }
  }

  renderWelcomeForm() {
    if (this.state.messages.length === 0 && this.state.pendingMessages.length === 0 || this.state.sessionFinished) {
      return (
        <form action="" class="cdm-welcome-form" onSubmit={this.handleWelcomeFormSubmit}>
          {this.state.sessionFinished && <p class="cdm-welcome-form__ended">Чат завершен. Для твоей безопасности мы удалили все сообщения.</p>}
          <div class="cdm-welcome-form__row">
            <div className="cdm-welcome-form__input">
              <input type="text" name="name" placeholder="имя или ник" onInput={this.handleChange} class="cdm-input"/>
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
    if (this.state.messages.length === 0 && this.state.pendingMessages.length === 0 || hasNoAnswer || this.sessionFinished) {
      return false
    } else {
      return (
        <form onSubmit={this.handleSendMessageFormSubmit} class="cdm-chat__inputform">
        <textarea type="text" value={this.state.message} name="message" placeholder="твой вопрос" onInput={this.handleChange} class="cdm-textarea"></textarea>
        <button type="submit" class="cdm-chat__sendbtn" disabled={this.state.message === ''}>Отправить</button>
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
          {/*{ chatStarted && (<div class="cdm-chat__welcome"><h3 class="cdm-chat__welcometext">
            Здравствуйте! <br/> Задайте свой вопрос консультанту
          </h3> </div>)}*/}
          {this.renderWelcomeForm()}
	        <MessageList messages={this.state.messages} pendingMessages={this.state.pendingMessages} wasForwarded={this.state.operator!==''} setMessagesListRef={this.setMessagesListRef}/>
	        {!this.state.sessionFinished && this.renderSendMessageForm()}
	     </div>
	    </div>
	    <button href="#" class="cdm-chat__close" onClick={this.changePopupState}>x</button>
	   </div>
	  </article>
	 )
	}
}



