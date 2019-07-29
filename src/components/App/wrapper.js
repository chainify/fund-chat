import { h, render, Component } from "preact";
import { observer, inject } from "mobx-preact";
import { Row, Col, Button, Icon, Popconfirm } from 'antd';
import { autorun } from 'mobx';
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';

const targetElement = document.querySelector("#someElementId");


@inject('alice', 'wrapper', 'form', 'cdms')
@observer
export default class Wrapper extends Component {

    constructor(props) {
        super(props);
        const { wrapper, alice } = props;

        autorun(() => {
            if (wrapper.isActive === true) {
                alice.initAlice();
                wrapper.targetElement = document.querySelector('body');
                disableBodyScroll(wrapper.targetElement);
            }
        });
    }

    componentDidMount() {
        const { wrapper } = this.props;
        
        window.changeChatState = () => {
            wrapper.isActive = !wrapper.isActive;
        }
    }

    componentWillUnmount() {
        clearAllBodyScrollLocks();
    }

    render() {
        const { wrapper, form, cdms } = this.props;
        return (
            <div className={`cnfy_wrapper ${wrapper.isActive && 'cnfy_active'}`}>
                <div className="cnfy_closeButton">
                    <Popconfirm
                        placement="rightBottom"
                        title={`Закрыть сессию?${cdms.list && cdms.list.length > 0 ? ' Все сообщения будут стерты.' : ''}`}
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



