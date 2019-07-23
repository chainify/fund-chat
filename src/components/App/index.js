import { h, render, Component } from "preact";
import { Provider, observer } from "mobx-preact";

import Wrapper from './wrapper';
import Chat from './chat';
import Form from './form';

import './style.scss';
import 'antd/dist/antd.css'

import stores from '../../stores/stores';

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
    }

    render() {
        return (
            <Provider {...stores}>
                <Wrapper>
                    <div>
                        {stores.form.submitted ? <Chat /> : <Form />}
                    </div>
                </Wrapper>
            </Provider>
        )
    }
}



