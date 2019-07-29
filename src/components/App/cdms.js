import { h, render, Component } from "preact";
import "./style.scss";
import { observer, inject } from "mobx-preact";
import { autorun } from "mobx";
import { Icon, Divider } from 'antd'

@inject('cdms')
@observer
export default class Cdms extends Component {

    constructor(props) {
        super(props);
        const { cdms } = props

        autorun(() => {
            if (cdms.lastCdmHash) {
                cdms.getList();
            }
        })
    }

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.cdmsDiv.scrollTop = this.cdmsDiv.scrollHeight - this.cdmsDiv.clientHeight;
    }

    render() {
        const { cdms } = this.props;
        return (
            <div className="cnfy_cdms" ref={el => { this.cdmsDiv = el; }}>
                <div className="cnfy_list">
                    {cdms.list && cdms.list.map(el => (
                        <div
                            key={`row_${el.hash}`}
                            className={`cnfy_row ${el.type}`}
                        >
                            <div className="cnfy_cdm">
                                <div className="cnfy_message_body">{el.message}</div>
                                <div className="cnfy_message_footer">
                                    {el.type === 'pending' && <span><Icon type="loading" /> Отправка сообщения</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}



