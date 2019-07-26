import { h, render, Component } from "preact";
import "./style.scss";
import { observer, inject } from "mobx-preact";
import { autorun } from "mobx";

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

    componentWillUnmount() {
        this.cdmPeriodic();
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
                            <div className="cnfy_cdm">{el.message}</div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}



