import { h, render, Component } from "preact";
import "./style.scss";
import { observer, inject } from "mobx-preact";
import { autorun } from "mobx";

@inject('cdms', 'wrapper')
@observer
export default class Cdms extends Component {

    constructor(props) {
        super(props);
        const { wrapper, cdms } = props

        this.cdmPeriodic = autorun(() => {
            if (
                ['success', 'error'].indexOf(cdms.getListStatus) > -1 &&
                wrapper.isActive &&
                cdms.list.length > 0
            ) {
                cdms.getList();
            }
        });
    }

    componentDidMount() {
        const { cdms } = this.props;
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
            <div className="cdms" ref={el => { this.cdmsDiv = el; }}>
                <div className="list">
                    {cdms.list && cdms.list.map(el => (
                        <div
                            key={`row_${el.hash}`}
                            className={`row ${el.type}`}
                        >
                            <div className="cdm">{el.message}</div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}



