import { h, render, Component } from "preact";
import { observer, inject } from "mobx-preact";
import { autorun } from 'mobx';
import { Row, Col, Input, Button, Icon } from 'antd';

@inject('form', 'alice', 'cdms', 'index')
@observer
export default class Form extends Component {

    constructor(props) {
        super(props);
        const { alice, cdms, form, index } = props;
       
        autorun(() => {
            if (
                alice.publicKey && 
                cdms.list && 
                cdms.list.length > 0
            ) {
                form.submitted = true;
            }
        })

        autorun(() => {
            if (alice.publicKey && index.fundPublicKey) {
                console.log('alice.publicKey && index.fundPublicKey');
                const publicKeys = [alice.publicKey, index.fundPublicKey];
                const groupHash = cdms.getGroupHash(publicKeys);
                cdms.groupHash = groupHash;
            }
        });

        autorun(() => {
            if (cdms.getListStatus === 'init' && cdms.groupHash !== null) {
                cdms.getList();
            }
        });
    }

    render() {
        const { form, cdms } = this.props;
        const imputStyle = {
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
        };

        return (
            <div className="formContainer">
                <div className="formContent">
                    <Row>
                        <Col xs={{ span: 24 }} sm={{ span: 12 }} md={{ span: 8 }} lg={{ span: 8 }}>
                            <Input
                                size="large"
                                placeholder="Твое имя"
                                value={form.name}
                                onChange={e => {
                                    form.name = e.target.value;
                                }}
                                autoFocus
                                style={imputStyle}
                            />
                            <p>&nbsp;</p>
                        </Col>
                        <Col xs={{ span: 24 }} sm={{ span: 12 }} md={{ span: 8, offset: 1 }} lg={{ span: 8, offset: 1  }}>
                            <Input
                                size="large"
                                placeholder="Твой возраст"
                                value={form.age}
                                onChange={e => {
                                    form.age = e.target.value;
                                }}
                                onFocus={_ => {
                                    form.age = form.age.replace(/[\W]/gmi, "");
                                }}
                                onBlur={_ => {
                                    if (
                                        form.age.length > 0 &&
                                        form.age.replace(/\d/gmi, "").length === 0
                                    ) {
                                        form.age = `${form.age} лет`;
                                    }
                                }}
                                style={imputStyle}
                            />
                            <p>&nbsp;</p>
                        </Col>
                        <Col xs={{ span: 24}} md={{ span: 6, offset: 1  }} lg={{ span: 6, offset: 1  }}>
                            <Button
                                type="default"
                                onClick={_ => {
                                    form.submitted = true;
                                }}
                                block
                                size="large"
                                style={{ 
                                    // marginBottom: '1em'
                                }}
                                type="primary"
                                disabled={
                                    form.name.trim() === '' || form.age.trim() === ''
                                }
                            >
                                Продолжить
                            </Button>
                        </Col>
                    </Row>
                </div>
            </div>
        )
    }
}



