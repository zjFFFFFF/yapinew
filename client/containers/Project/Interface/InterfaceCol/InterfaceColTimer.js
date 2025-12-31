import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import { Card, Button, Table, Modal, Form, Input, Select, Switch, Icon, message, Tooltip, Row, Col, Popconfirm } from 'antd';
import axios from 'axios';
import { fetchInterfaceColList } from '../../../../reducer/modules/interfaceCol';
import { fetchProjectList } from '../../../../reducer/modules/project';

const Option = Select.Option;
const FormItem = Form.Item;

@connect(
  state => {
    return {
      interfaceColList: state.interfaceCol.interfaceColList,
      projectList: state.project.projectList,
      curProject: state.project.currProject
    };
  },
  {
    fetchInterfaceColList,
    fetchProjectList
  }
)
@withRouter
@Form.create()
export default class InterfaceColTimer extends Component {
  static propTypes = {
    match: PropTypes.object,
    interfaceColList: PropTypes.array,
    fetchInterfaceColList: PropTypes.func,
    curProject: PropTypes.object,
    form: PropTypes.object
  };

  state = {
    timers: [],
    visible: false,
    editId: null,
    envList: []
  };

  componentDidMount() {
    this.getTimers();
    this.props.fetchInterfaceColList(this.props.match.params.id);
    this.getEnvList();
  }

  getTimers = async () => {
    const projectId = this.props.match.params.id;
    const res = await axios.get('/api/col/list_timer?project_id=' + projectId);
    if (res.data.errcode === 0) {
      this.setState({ timers: res.data.data });
    }
  };

  getEnvList = async () => {
    const projectId = this.props.match.params.id;
    const res = await axios.get('/api/project/get?id=' + projectId);
    if (res.data.errcode === 0) {
      this.setState({ envList: res.data.data.env });
    }
  }

  showModal = (item = {}) => {
    this.setState({
      visible: true,
      editId: item._id || null
    });
    const { form } = this.props;
    if (item._id) {
        setTimeout(() => {
            form.setFieldsValue({
                name: item.name,
                col_id: item.col_id,
                env: item.env,
                cron_expression: item.cron_expression,
                status: item.status === 'open',
                notice: item.notice
            });
        }, 0);
    } else {
        form.resetFields();
    }
  };

  handleCancel = () => {
    this.setState({ visible: false });
  };

  handleOk = () => {
    const { form } = this.props;
    const projectId = this.props.match.params.id;
    form.validateFields(async (err, values) => {
      if (!err) {
        const params = {
          ...values,
          project_id: projectId,
          status: values.status ? 'open' : 'closed'
        };
        let res;
        if (this.state.editId) {
          params.id = this.state.editId;
          res = await axios.post('/api/col/up_timer', params);
        } else {
          res = await axios.post('/api/col/add_timer', params);
        }
        
        if (res.data.errcode === 0) {
          message.success(this.state.editId ? '更新成功' : '添加成功');
          this.setState({ visible: false });
          this.getTimers();
        } else {
          message.error(res.data.errmsg);
        }
      }
    });
  };

  deleteTimer = async (id) => {
    const res = await axios.get('/api/col/del_timer?id=' + id);
    if (res.data.errcode === 0) {
      message.success('删除成功');
      this.getTimers();
    } else {
      message.error(res.data.errmsg);
    }
  };

  render() {
    const { timers, visible, envList } = this.state;
    const { interfaceColList } = this.props;
    const { getFieldDecorator } = this.props.form;

    const columns = [
      {
        title: '任务名称',
        dataIndex: 'name',
        key: 'name'
      },
      {
        title: '对应集合',
        dataIndex: 'col_id',
        key: 'col_id',
        render: (col_id) => {
            const col = interfaceColList.find(c => c._id === col_id);
            return col ? col.name : '未知集合';
        }
      },
      {
        title: '运行环境',
        dataIndex: 'env',
        key: 'env'
      },
      {
        title: 'Cron表达式',
        dataIndex: 'cron_expression',
        key: 'cron_expression'
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (text) => <span style={{ color: text === 'open' ? 'green' : 'red' }}>{text === 'open' ? '开启' : '关闭'}</span>
      },
      {
        title: '操作',
        key: 'action',
        render: (text, record) => (
          <span>
            <a onClick={() => this.showModal(record)}>编辑</a>
            <span className="ant-divider" />
            <Popconfirm title="确认删除?" onConfirm={() => this.deleteTimer(record._id)}>
              <a href="#">删除</a>
            </Popconfirm>
          </span>
        )
      }
    ];

    return (
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Button type="primary" onClick={() => this.showModal()}>添加任务</Button>
          <span style={{ marginLeft: 10 }}>
            <Tooltip title="Cron表达式参考: * * * * * (分 时 日 月 周)">
                <Icon type="question-circle-o" />
            </Tooltip>
          </span>
        </div>
        <Table dataSource={timers} columns={columns} rowKey="_id" />

        <Modal
          title={this.state.editId ? "编辑定时任务" : "添加定时任务"}
          visible={visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <Form>
            <FormItem label="任务名称" labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
              {getFieldDecorator('name', {
                rules: [{ required: true, message: '请输入任务名称' }]
              })(<Input />)}
            </FormItem>
            <FormItem label="选择集合" labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
              {getFieldDecorator('col_id', {
                rules: [{ required: true, message: '请选择测试集合' }]
              })(
                <Select placeholder="请选择测试集合">
                  {interfaceColList.map(col => (
                    <Option key={col._id} value={col._id}>{col.name}</Option>
                  ))}
                </Select>
              )}
            </FormItem>
            <FormItem label="运行环境" labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
              {getFieldDecorator('env', {
                rules: [{ required: true, message: '请选择运行环境' }]
              })(
                <Select placeholder="请选择运行环境">
                  <Option key="default" value="unset">默认环境</Option>
                  {envList.map(env => (
                    <Option key={env.name} value={env.name}>{env.name}</Option>
                  ))}
                </Select>
              )}
            </FormItem>
            <FormItem label="Cron表达式" labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
              {getFieldDecorator('cron_expression', {
                rules: [{ required: true, message: '请输入Cron表达式' }]
              })(<Input placeholder="例如: */30 * * * * (每30分钟)" />)}
            </FormItem>
            <FormItem label="是否开启" labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
              {getFieldDecorator('status', { valuePropName: 'checked', initialValue: true })(<Switch />)}
            </FormItem>
            <FormItem label="失败通知" labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
              {getFieldDecorator('notice', { valuePropName: 'checked', initialValue: false })(<Switch />)}
            </FormItem>
          </Form>
        </Modal>
      </div>
    );
  }
}
