import { h, render, Component } from "preact";
import "./style.scss";
import { observer, inject } from "mobx-preact";
import { autorun } from 'mobx';
import { Button, Input } from 'antd';
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
                        if (cdms.list && cdms.list.filter(el => el.type === 'incoming').length === 0) {
                            chat.noResponse = true;
                        }
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
        if (this.messageTextArea) {
            this.messageTextArea.focus();
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
                if (
                    chat.message.trim() !== "" &&
                    cdms.list &&
                    cdms.list.filter(el => el.type === 'pending').length === 0
                ) {
                    cdms.sendCdm();
                }
            }
        });
    }

    componentWillUnmount() {
        this.aliceHeartbeat();
    }

    render() {
        const { chat, cdms } = this.props;
        const inputStyle = {
            border: 'none',
            background: 'transparent',
            margin: 0,
            padding: '0 10px!important',
            color: '#333!importsant',
            outline: 'none',
            boxShadow: 'none',
            fontSize: '20px',
            lineHeight: '24px',
            width: '100%',
            resize: 'none',
            caretColor: '#2196f3',
            fontFamily: 'Roboto, sans-serif'
        }
        return (
            <div>
                {chat.noResponse === null && (
                    <div className="cnfy_noResponse">
                        Загрузка...
                    </div>
                )}
                {chat.noResponse === true && (
                    <div className="cnfy_noResponse">
                        Если консультант не отвечает, не расстраивайся, напиши в чат через некоторое время или обратись в службу доверия 8(800)200-0122
                    </div>
                )}
                {chat.noResponse === false && (
                    <div className="cnfy_chat">
                        <Cdms />
                        {cdms.list && cdms.list.length > 0 && <div className="cnfy_divider"><hr /></div>}
                        {
                            cdms.list && 
                            cdms.list.length === 1 &&
                            cdms.list[0].type === 'outgoing' &&
                            cdms.list[0].sharedWith.length === 2 ? (
                                <div>Твое сообщение отправлено. Дождись ответа консультанта.</div>
                            ) : (
                                <div>
                                    <div className="cnfy_message">
                                        <div className="cnfy_textarea">
                                            <TextArea
                                                value={chat.message}
                                                ref={input => { this.messageTextArea = input; }} 
                                                onChange={e => {
                                                    chat.message = e.target.value;
                                                }}
                                                onFocus={_ => {
                                                    chat.textareaFocused = true;
                                                }}
                                                onBlur={_ => {
                                                    chat.textareaFocused = false;
                                                }}
                                                onPressEnter={e => {
                                                    e.preventDefault();
                                                }}
                                                placeholder="Твое сообщение"
                                                rows={8}
                                                className="mousetrap cnfy_input"
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div className="cnfy_sendBtn">
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



