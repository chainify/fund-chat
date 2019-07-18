import { h, render, Component } from "preact";
import {address, keyPair, publicKey, base58encode, signBytes, getSharedKey, encryptMessage, decryptMessage, buildAddress, base58decode} from "../waves-crypto";
import sha256 from 'js-sha256';
import axios from 'axios';
import { Seed } from '@waves/signature-generator'
import MessageList from "../MessageList";
import "./style.scss";

let fundInterval;

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
    this.state.operatorGroupHash = "";
    this.state.sessionFinished = false;
    this.state.operators = [];
    // this.state.seed = "canvas okay bus gorilla chest debate upgrade marriage raw arrange member tobacco";
    this.state.seed = this.getSeed();
    this.state.messagesList = {}
    this.state.wasInitialSent = false;
    this.state.areWorkingHours = true;
  }
  
  componentDidMount() {
    this.getSeed();
    this.getMessages();
    this.setSound();
    this.checkWorkingHours();
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
          axios.post('https://nolik.im/api/v1/accounts', formDataNewClient, {}).catch((e) => console.log(e));
        }, 1000);
       } else {
        clearInterval(window.isOnline);
       }
    };
  }

  setSound() {
    this.setState({
      sound: new Audio(this.props.soundpath)
    });
  }

  checkWorkingHours() {
    const currentDate = new Date();
    const timezoneOffset = currentDate.getTimezoneOffset()/60 + 3; // from Moscow time
    // console.log(timezoneOffset);
    const normalizedHours = currentDate.getHours() -  timezoneOffset;
    // console.log(normalizedHours);
    const areWorkingHours = (normalizedHours >= this.props.starttime) && (normalizedHours <= this.props.endtime);
    this.setState({areWorkingHours});
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
    let decryptedMessage = '';
    try {
      decryptedMessage = decryptMessage(sharedKey, message, 'chainify');
    } catch (err) {
      decryptedMessage = '⚠️ Decoding error';
    }
    // console.log(decryptMessage(sharedKey, '1BV7+N+3Fmayme1cU3mQkW/+5/qqPUv8ZEvk8Wi0AVXKySGe5huxRaGFsuYbvoTwPTdRnO1qkZRb7Hv2sYDTL7lJ/019SLAXetrr+nVf4BiNVGrl9loVj/z3je6q1QtFvLywCSQqOMs1/7wkys/cBGs2diYmKHtG6z7xrEVzvttsqbdTaUXTunOnkgEstZ/WOJ93n6KZT65EB7mHzVl0rGA6Lmb9YeH3vSAmohgm3g4FkRZdLOH/7UFXpazPVuuNtD5XucthR9iVecWnTRD/vFr9UKr4ZT94Qa3V6ONbx1egyQCcGYUdiNNVK0SyymkC', 'chainify'));
    return decryptedMessage.replace(/@[\w]{64}$/gmi, "");
  }

  wasChatClosed(cdms) {
    if (cdms.length > 0) {
      let decryptedMessage = '';
      const cdm = cdms[cdms.length-1];
      if (cdm.type==='incoming') {
        decryptedMessage = this.decryptMessage(cdm.message, cdm.logicalSender);
      }
      return decryptedMessage.toLowerCase() === 'консультация завершена';
    }
    return false;
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
    let operatorGroupHash = '';
    let operators = [];
    const alicePubKey = publicKey(this.state.seed);
    // console.log('alicePublicKey', alicePubKey);
    const groupHash = sha256([this.props.fundpubkey,alicePubKey].sort().join(''));
    endpoint = `https://nolik.im/api/v1/cdms/${publicKey(this.state.seed)}/${groupHash}`;
    fundInterval = setInterval(() => {
      
      if (this.state.wasInitialSent && this.state.isChatOpened) {
        // begin getting first message
        axios.get(endpoint).then((res) => {
          const cdms = res.data.cdms;
          if (this.wasChatClosed(cdms)) {
            clearInterval(operatorInterval);
            this.setState({sessionFinished: true});
            const newSeed = Seed.create().phrase;
            sessionStorage.setItem('seed', newSeed);
            this.setState({seed: newSeed});
            clearInterval(operatorInterval);
          }
          if (cdms.length > 0) {
            const cdmstxIds = cdms.map(cdm => cdm.txId);
            const decryptedMessages = cdms.map((cdm) => {
              let decryptedMessage = '';
              if (cdm.type==='incoming') {
                decryptedMessage = this.decryptMessage(cdm.message, cdm.logicalSender);
              } else {
                decryptedMessage = this.decryptMessage(cdm.message, cdm.recipient);
              }
              return {message: decryptedMessage, timestamp: cdm.timestamp, type: cdm.type, recipient: cdm.recipient}
            });
            const nonDeliveredMessages = this.state.pendingMessages.filter(message => !cdmstxIds.includes(message.txId));
            if (nonDeliveredMessages.length === 0) {
              this.setState({pendingMessages: []});
            }
            const hasToScroll = this.state.messages.length !== decryptedMessages.length;
            
            const initialMessage = {
              message: decryptedMessages[0],
              timestamp: cdms[0].timestamp,
              type: cdms[0].type,
            }
            this.setState({initialMessage: initialMessage, messages: decryptedMessages});
            if (hasToScroll) {
              this.scrollToBottom();
            }
            
            // end getting first message
            
            if (this.state.operatorGroupHash ==='') {
              const groupsEndPoint = `https://nolik.im/api/v1/groups/${publicKey(this.state.seed)}`;
              const groupInterval = setInterval(() => {
                if (!this.state.operatorGroupHash) {
                  axios.get(groupsEndPoint).then(res => {
                    
                    const groups = res.data.groups;
                    const operatorGroup = groups.filter(group => group.lastCdm && (group.lastCdm.hash === cdms[0].hash))[0];             
                    const filteredOperators = operatorGroup.lastCdm.sharedWith.filter(item => [this.props.fundpubkey, publicKey(this.state.seed)].indexOf(item.publicKey) === -1);
                    let operatorPubKey = '';
                    
                    if (filteredOperators.length > 0) {
                      operatorPubKey = filteredOperators[0].publicKey;
                      this.setState({operators:[operatorPubKey]});
                      clearInterval(groupInterval);
                    }
                    if (operatorPubKey !== '') {
                      operatorGroupHash = sha256([operatorPubKey,this.props.fundpubkey,alicePubKey].sort().join(''));
                      this.setState({operatorGroupHash});
                    }
                  })
                } 
              }, 1000); 
            }
            if (this.state.operatorGroupHash!=='') {
                clearInterval(fundInterval);
                
                const alicePubKey = publicKey(this.state.seed);
                endpoint = `https://nolik.im/api/v1/cdms/${publicKey(this.state.seed)}/${operatorGroupHash}`;
                const operatorInterval = setInterval(() => {

                  if (this.state.wasInitialSent && this.state.isChatOpened) {
                      axios.get(endpoint).then((res) => {
                        const cdms = res.data.cdms;
                        if (this.wasChatClosed(cdms)) {
                          clearInterval(operatorInterval);
                          this.setState({sessionFinished: true});
                          const newSeed = Seed.create().phrase;
                          sessionStorage.setItem('seed', newSeed);
                          this.setState({seed: newSeed});
                          clearInterval(operatorInterval);
                        }
                        const cdmstxIds = cdms.map(cdm => cdm.txId);
                        const decryptedMessages = cdms.map((cdm) => {
                          let decryptedMessage = '';
                          if (cdm.type==='incoming') {
                            decryptedMessage = this.decryptMessage(cdm.message, cdm.logicalSender);
                          } else {
                            decryptedMessage = this.decryptMessage(cdm.message, cdm.recipient);
                          }
                          return {message: decryptedMessage, timestamp: cdm.timestamp, type: cdm.type, recipient: cdm.recipient}
                        }).splice(1);
                        const nonDeliveredMessages = this.state.pendingMessages.filter(message => !cdmstxIds.includes(message.txId));
                        if (nonDeliveredMessages.length === 0) {
                          this.setState({pendingMessages: []});
                        }
                        const hasToScroll = this.state.messages.length !== decryptedMessages.length;
                        
                        this.setState({messages: [initialMessage.message, ...decryptedMessages]});
                    
                        if (hasToScroll) {
                          this.scrollToBottom();
                          if (document.visibilityState!=="visible" && this.state.isChatOpened){
                            this.state.sound.play();
                          }
                        }
                      }).catch((e) => console.log(e))
                    }
                  }, 1000);
                }
            } //end if operatorGroupHash
        }).catch((e) => console.log(e))
      }
    }, 1000);
  }

  generateCypherText(message, messageHash, alice, recipientPublicKey) {
    const sharedKey = base58encode(getSharedKey(alice.private, recipientPublicKey));
    const cypherText = encryptMessage(sharedKey, message, 'chainify');
    let res = `\r\n-----BEGIN_PUBLIC_KEY ${recipientPublicKey}-----\r\n${cypherText}\r\n-----END_PUBLIC_KEY ${recipientPublicKey}-----`;
    res += `\r\n-----BEGIN_SHA256 ${recipientPublicKey}-----\r\n${messageHash}\r\n-----END_SHA256 ${recipientPublicKey}-----`;
    return res;
  }

  generateMessageFile(message, messageHash, signature, alice, fundPubKey, operators) {
    let encryptedMessage = '';
    encryptedMessage += '-----BEGIN_CDM VERSION_2-----\r\n';
    encryptedMessage += '-----BEGIN_BLOCKCHAIN WAVES-----';
    encryptedMessage += this.generateCypherText(message, messageHash, alice, alice.public);
    encryptedMessage += this.generateCypherText(message, messageHash, alice, fundPubKey);
    // messages for operators
    if (operators.length > 0) {
      encryptedMessage += this.state.operators.map((operator) => {
        return this.generateCypherText(message, messageHash, alice, operator);
      })
    }
    encryptedMessage += `\r\n-----BEGIN_SIGNATURE ${alice.public}-----\r\n${signature}\r\n-----END_SIGNATURE ${alice.public}-----`;
    encryptedMessage += '\r\n-----END_BLOCKCHAIN WAVES-----\r\n';
    encryptedMessage += '-----END_CDM VERSION_2-----';
    return encryptedMessage;
  }



  getMessageWithRandom(message) {
    function generateRandom(length) {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var result = '';
      for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
      return result;
    }
    const rand = sha256(generateRandom(64));
    const randMessage = message + '@' + rand;
    return randMessage;
  }
  
  sendMessage(message, initial = '') {
    const hasAnswer = (initial === 'initial') || (this.state.messages.length > 1);
    if (hasAnswer) { 
      const {fundpubkey} = this.props;
      const operators = this.state.operators;
      const seed = this.state.seed;
      const alice = keyPair(seed);
      const randMessage = this.getMessageWithRandom(message);
      const messageHash = sha256(randMessage);
      const signature = signBytes(Buffer.from(messageHash), seed);
      let encryptedMessageFile = this.generateMessageFile(randMessage, messageHash, signature, alice, fundpubkey, operators);
      const timestamp = Date.now()/1000;
      const newMessage = {
        message: message,
        type: 'outgoing',
        timestamp
      }
      const formData = new FormData();
      formData.append('message', encryptedMessageFile);
      // console.log(encryptedMessageFile);
      const that = this;
      axios.post('https://nolik.im/api/v1/cdms', formData, {})
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
          <textarea placeholder="" name="question" class="cdm-welcome-form__question cdm-textarea" onInput={this.handleChange}></textarea>
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
	      
          {this.state.areWorkingHours ? (
            <div class="cdm-chat__content">
              {this.renderWelcomeForm()}
              {!this.state.sessionFinished && <MessageList messages={this.state.messages} pendingMessages={this.state.pendingMessages} wasForwarded={this.state.operator!==''} setMessagesListRef={this.setMessagesListRef}/>}
              {!this.state.sessionFinished && this.renderSendMessageForm()}
            </div>
          ) : (
            <div class="cdm-chat__content">
              <p class="cdm-chat__workinghours">Время работы с 15 до 22</p>
            </div>
          )}
	    </div>
	    <button href="#" class="cdm-chat__close" onClick={this.changePopupState}>x</button>
	   </div>
	  </article>
	 )
	}
}



