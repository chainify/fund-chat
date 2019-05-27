import { h, render, Component } from "preact";

const formatTwoDigits = (n) => {
    return n < 10 ? '0' + n : n;
}
export default class MessageList extends Component {
  renderMessage(message, pending = false) {
    let messageClass = "cdm-chat-message cdm-chat-message--" + message.type;
    if (pending) {
      messageClass += " cdm-chat-message--pending";
    }
    const timestamp = new Date(+message.timestamp*1000);
    const time = `${formatTwoDigits(timestamp.getHours())}:${formatTwoDigits(timestamp.getMinutes())}`
    const key = pending ? message.timestamp : message.id;
    return (
      <li class={messageClass} key={key}><span class="cdm-chat-message__text">{message.message}<time class="cdm-chat-message__time">{time}</time></span></li>
    )
  }
  
  render(props, state) {
    const wasStarted = (props.messages.length === 0 && props.pendingMessages.length === 0);
    const hasNoAnswer = (props.messages.length === 1 || (props.messages.length === 0 && props.pendingMessages.length === 1));
    const wasForwarded = props.wasForwarded;
    const chatClass = wasStarted ? 'cdm-chat-messages' : 'cdm-chat-messages cdm-chat-messages--started';
    return (
      <ul class={chatClass} id="cdm-chat-messages" ref={ c => this.props.setMessagesListRef(c) }>
        {props.messages.map((message)=>this.renderMessage(message))}
        {props.pendingMessages.map((message)=>this.renderMessage(message, true))}
        {hasNoAnswer && !wasForwarded && (<li class="cdm-chat-message cdm-chat-message--wait">Если консультант не отвечает, не расстраивайся, напиши в чат через некоторое время или обратись в службу доверия 8 800 2000122</li>)}
        {wasForwarded && hasNoAnswer && (<li class="cdm-chat-message cdm-chat-message--wait">Ваше сообщение передано консультанту. Он ответит в течение 3-х минут.</li>)}
      </ul>
    )
  }
}