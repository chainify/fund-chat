import { h, render, Component } from "preact";
import { observer, inject } from "mobx-preact";
import { Row, Col, Button, Icon, Popconfirm, message } from 'antd';
import { autorun } from 'mobx';

@inject('alice', 'wrapper', 'form', 'cdms', 'chat')
@observer
export default class Wrapper extends Component {

    constructor(props) {
        super(props);
        const { wrapper, alice, chat, cdms, form } = props;

        autorun(() => {
            if (wrapper.isActive === true) {
                alice.initAlice();
            }
        });
    }

    componentDidMount() {
        const { wrapper } = this.props;
        
        window.changeChatState = () => {
            wrapper.isActive = !wrapper.isActive;
        }
    }

    render() {
        const { wrapper, form } = this.props;
        return (
            <div className={`wrapper ${wrapper.isActive && 'active'}`}>
                <div className="closeButton">
                    <Popconfirm
                        placement="rightBottom"
                        title="Закрыть сессию?"
                        onConfirm={_ => {
                            wrapper.closeSession();
                        }}
                        okText="Да, закрыть"
                        cancelText="Отмена"
                        icon={<Icon type="question-circle-o" style={{ color: '#ffc107' }} />}
                    >
                        <Button shape="circle">
                            <Icon type="close" />
                        </Button>
                    </Popconfirm>
                </div>
                <Row>
                    <Col xs={{ offset: 2, span: 20}} lg={{ offset: 4, span: form.submitted ? 16 : 12 }}>
                        {this.props.children}
                    </Col>
                </Row>
            </div>
        )
    }
}



