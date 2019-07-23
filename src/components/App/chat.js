import { h, render, Component } from "preact";
import "./style.scss";
import { observer, inject } from "mobx-preact";
import { autorun } from 'mobx';
import { Button, Input, Divider } from 'antd';
import Cdms from './cdms';
import mouseTrap from 'react-mousetrap';
const { TextArea } = Input;

@inject('chat', 'cdms', 'alice', 'wrapper', 'form', 'index', 'crypto')
@observer
class Chat extends Component {

    constructor(props) {
        super(props);

        const { cdms, alice, wrapper, chat, form, index } = props;

        this.aliceHeartbeat = autorun(() => {
            if (
                ['success', 'error'].indexOf(alice.heartbeatStatus) > -1 &&
                wrapper.isActive &&
                chat.noResponse === false &&
                cdms.list.length > 0
            ) {
                alice.heartbeat();
            }
        });

        autorun(() => {
            if (chat.timerFrom) {
                this.noResponseTimer = setInterval(() => {
                    const now = Date.now() / 1000 | 0;
                    const diff = now - chat.timerFrom;
                    if (diff > chat.responseTimeout) {
                        chat.noResponse = true;
                        clearInterval(this.noResponseTimer);
                    }
                }, 1000);
            }
        })

        autorun(() => {
            if (
                alice.heartbeatStatus === 'init' &&
                alice.publicKey &&
                cdms.list &&
                cdms.list.length > 0
            ) {
                alice.heartbeat();
            }
        });
    }

    componentDidMount() {
        const { chat, cdms } = this.props;
        if (this.nameInput) {
            this.nameInput.focus();
        }
        
        this.props.bindShortcut('meta+enter', () => {
            if (chat.textareaFocused) {
                chat.message = chat.message + '\r\n';
            }
        });

        this.props.bindShortcut('shift+enter', () => {
            if (chat.textareaFocused) {
                chat.message = chat.message + '\r\n';
            }
        });

        this.props.bindShortcut('enter', () => {
            if (chat.textareaFocused) {
                if (chat.message.trim() !== "") {
                    cdms.sendCdm();
                }
            }
        });
    }

    componentWillUnmount() {
        this.aliceHeartbeat();
    }

    render() {
        const { chat, cdms, crypto } = this.props;
        return (
            <div>
                {chat.noResponse === null && (
                    <div className="noResponse">
                        Загрузка...
                    </div>
                )}
                {chat.noResponse === true && (
                    <div className="noResponse">
                        Если консультант не отвечает, не расстраивайся, напиши в чат через некоторое время или обратись в службу доверия 8(800)200-0122
                    </div>
                )}
                {chat.noResponse === false && (
                    <div className="chat">
                        <Cdms />
                        {cdms.list && cdms.list.length > 0 && <div className="divider"><hr /></div>}
                        {
                            cdms.list && 
                            cdms.list.length === 1 &&
                            cdms.list[0].type === 'outgoing' &&
                            cdms.list[0].sharedWith.length === 2 ? (
                                <div>Твое сообщение отправлено. Дождись ответа консультанта.</div>
                            ) : (
                                <div>
                                    <div class="message">
                                        <div className="textarea">
                                            <TextArea
                                                value={chat.message}
                                                ref={input => { this.nameInput = input; }} 
                                                onChange={e => {
                                                    chat.message = e.target.value;
                                                }}
                                                onPressEnter={e => {
                                                    e.preventDefault();
                                                }}
                                                onFocus={_ => {
                                                    chat.textareaFocused = true;
                                                }}
                                                onBlur={_ => {
                                                    chat.textareaFocused = false;
                                                }}
                                                placeholder="Твое сообщение"
                                                autosize={{ "minRows" : 1, "maxRows" : 8 }}
                                                className="mousetrap"
                                                style={{
                                                    border: 'none',
                                                    background: 'transparent',
                                                    borderRadius: 10,
                                                    margin: 0,
                                                    padding: '0 10px',
                                                    outline: 'none',
                                                    boxShadow: 'none',
                                                    fontSize: '20px',
                                                    lineHeight: '24px',
                                                    resize: 'none',
                                                    caretColor: '#2196f3',
                                                }}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="sendBtn">
                                            <Button
                                                type="primary"
                                                shape="round"
                                                loading={
                                                    cdms.list && cdms.list.filter(el => el.type === 'pending').length > 0
                                                }
                                                disabled={
                                                    chat.message.trim() === ''
                                                }
                                                onClick={_ => {
                                                    cdms.sendCdm();
                                                }}
                                            >
                                                Отпр.
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                )}
            </div>
        )
    }
}

export default mouseTrap(Chat)



