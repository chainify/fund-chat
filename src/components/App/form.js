import { h, render, Component } from "preact";
import { observer, inject } from "mobx-preact";
import { autorun } from 'mobx';
import { Row, Col, Button } from 'antd';

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
        const inputStyle = {
            border: 'none',
            background: 'transparent',
            margin: 0,
            padding: '0 10px',
            outline: 'none',
            boxShadow: 'none',
            fontSize: '20px',
            lineHeight: '40px',
            height: '40px',
            resize: 'none',
            caretColor: '#2196f3',
            fontFamily: 'Roboto, sans-serif'
        }
        return (
            <div className="cnfy_formContainer">
                <div className="cnfy_formContent">
                    <Row>
                        <Col xs={{ span: 24 }} sm={{ span: 12 }} md={{ span: 8 }} lg={{ span: 8 }}>
                            <input
                                name="name"
                                type="text"
                                placeholder="Твое имя"
                                value={form.name}
                                onInput={e => {                                    
                                    form.name = e.target.value;
                                }}
                                autoFocus
                                className="cnfy_input"
                                style={inputStyle}
                            />
                            <p>&nbsp;</p>
                        </Col>
                        <Col xs={{ span: 24 }} sm={{ span: 12 }} md={{ span: 8, offset: 1 }} lg={{ span: 8, offset: 1  }}>
                            <input
                                name="age"
                                type="text"
                                placeholder="Твой возраст"
                                value={form.age}
                                onInput={e => {
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
                                className="cnfy_input"
                                style={inputStyle}
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



