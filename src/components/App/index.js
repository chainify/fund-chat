import { h, render, Component } from "preact";
import { Provider, observer } from "mobx-preact";

import stores from '../../stores/stores';

import Wrapper from './wrapper';
import Chat from './chat';
import Form from './form';

import './style.scss';
import './antd.scss';

@observer
export default class App extends Component {

    constructor() {
        super();
    }

    componentDidMount() {
        const { index } = stores;
        index.fundPublicKey = this.props.fundpubkey;
        index.endTime = this.props.endtime;
        index.startTime = this.props.starttime;
        index.sound = new Audio(this.props.soundpath);

        const d = new Date();
        const h = d.getHours();
        
        index.properTime = h > index.startTime && h < index.endTime;
    }

    render() {
        return (
            <Provider {...stores}>
                <Wrapper>
                    <div>
                        {stores.index.properTime === false ? (
                            <div className="cnfy_noResponse">
                                Время работы службы с {stores.index.startTime} до {stores.index.endTime} по московскому времени.
                            </div>
                        ) : (
                            stores.chat.isCleared ? (
                                <div className="cnfy_noResponse">
                                    Консультация завершена. Для твоей безопасности мы стерли все сообщения из чата.
                                </div>
                            ) : (
                                stores.form.submitted ? <Chat /> : <Form />
                            )
                        )}
                    </div>
                </Wrapper>
            </Provider>
        )
    }
}



