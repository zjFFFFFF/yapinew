import React, { PureComponent as Component } from 'react';
import { Table, Button, Icon, Tooltip, message, Tag, Modal, Row, Col, Card, Tabs } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

@connect(
  state => ({
    curProject: state.project.currProject
  })
)
@withRouter
export default class InterfaceColReport extends Component {
    static propTypes = {
        match: PropTypes.object,
        curProject: PropTypes.object
    }

    state = {
        data: [],
        loading: false,
        viewType: 'list', // list, detail
        reportId: null,
        reportData: null,
        pagination: {
            current: 1,
            pageSize: 10,
            total: 0
        }
    }

    componentDidMount() {
        this.fetchReports();
    }

    fetchReports = async (page = 1) => {
        this.setState({ loading: true });
        const projectId = this.props.match.params.id;
        try {
            const res = await axios.get(`/api/col/test_report/list?project_id=${projectId}&page=${page}&limit=${this.state.pagination.pageSize}`);
            if (res.data.errcode === 0) {
                this.setState({
                    data: res.data.data,
                    loading: false,
                    pagination: {
                        ...this.state.pagination,
                        current: page
                    }
                });
            } else {
                message.error(res.data.errmsg);
                this.setState({ loading: false });
            }
        } catch (e) {
            this.setState({ loading: false });
        }
    }

    viewReport = async (id) => {
        this.setState({ loading: true });
        try {
            const res = await axios.get(`/api/col/test_report/get?id=${id}`);
            if (res.data.errcode === 0) {
                this.setState({
                    reportData: res.data.data,
                    viewType: 'detail',
                    loading: false
                });
            } else {
                message.error(res.data.errmsg);
                this.setState({ loading: false });
            }
        } catch (e) {
            this.setState({ loading: false });
        }
    }

    handlePageChange = (page) => {
        this.fetchReports(page);
    }

    renderList() {
        const columns = [
            {
                title: '运行时间',
                dataIndex: 'add_time',
                key: 'add_time',
                render: text => moment(text * 1000).format('YYYY-MM-DD HH:mm:ss')
            },
            {
                title: 'Timer ID / Col ID',
                dataIndex: 'col_id',
                key: 'col_id',
                render: (text, record) => {
                    return <span>{record.timer_id ? `Timer ID: ${record.timer_id}` : `Col ID: ${text}`}</span>
                }
            },
            {
                title: '环境',
                dataIndex: 'env',
                key: 'env'
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: text => <Tag color={text === 'ok' ? 'green' : 'red'}>{text === 'ok' ? '成功' : '失败'}</Tag>
            },
            {
                title: '操作',
                key: 'action',
                render: (text, record) => (
                    <a onClick={() => this.viewReport(record._id)}>查看报告</a>
                )
            }
        ];

        return (
            <div style={{ padding: '24px' }}>
                <h2 style={{ marginBottom: '16px' }}>测试报告</h2>
                <Table 
                    dataSource={this.state.data} 
                    columns={columns} 
                    rowKey="_id" 
                    loading={this.state.loading} 
                    pagination={{
                        ...this.state.pagination,
                        onChange: this.handlePageChange
                    }}
                />
            </div>
        );
    }

    renderDetail() {
        const { reportData } = this.state;
        if (!reportData) return null;

        const { test_list, status, add_time } = reportData;
        const successNum = test_list.filter(item => item.code === 0).length;
        const failedNum = test_list.length - successNum;
        const totalTime = test_list.reduce((acc, cur) => acc + (cur.runTime || 0), 0);

        const columns = [
            {
                title: '接口名称',
                dataIndex: 'name',
                key: 'name',
                width: 200
            },
            {
                title: 'URL',
                dataIndex: 'url',
                key: 'url',
                 width: 300,
                 render: (text, record) => (
                    <Tooltip title={text}>
                        <span style={{display: 'inline-block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                            <Tag color="blue">{record.method}</Tag> {text}
                        </span>
                    </Tooltip>
                 )
            },
            {
                title: '状态',
                dataIndex: 'code',
                key: 'code',
                width: 100,
                render: code => <Tag color={code === 0 ? 'green' : 'red'}>{code === 0 ? '成功' : '失败'}</Tag>
            },
            {
                title: '耗时',
                dataIndex: 'runTime',
                key: 'runTime',
                width: 100,
                render: text => text ? `${text}ms` : '-'
            },
            {
                title: '验证消息',
                dataIndex: 'validRes',
                key: 'validRes',
                render: (text) => {
                    return text && text.map((item, index) => <div key={index}>{item.message}</div>)
                }
            }
        ];

        return (
            <div style={{ padding: '24px' }}>
                 <div style={{ marginBottom: '16px' }}>
                    <Button onClick={() => this.setState({ viewType: 'list' })}>
                        <Icon type="arrow-left" /> 返回列表
                    </Button>
                </div>
                <Card title={`报告详情 - ${moment(add_time * 1000).format('YYYY-MM-DD HH:mm:ss')}`} style={{ marginBottom: 24 }}>
                    <Row gutter={16} style={{ textAlign: 'center' }}>
                        <Col span={6}>
                            <h3>总测试用例</h3>
                            <div style={{ fontSize: 24 }}>{test_list.length}</div>
                        </Col>
                        <Col span={6}>
                            <h3 style={{ color: 'green' }}>成功</h3>
                            <div style={{ fontSize: 24, color: 'green' }}>{successNum}</div>
                        </Col>
                        <Col span={6}>
                            <h3 style={{ color: 'red' }}>失败</h3>
                            <div style={{ fontSize: 24, color: 'red' }}>{failedNum}</div>
                        </Col>
                         <Col span={6}>
                            <h3>总耗时</h3>
                            <div style={{ fontSize: 24 }}>{totalTime}ms</div>
                        </Col>
                    </Row>
                </Card>
                
                <Table 
                    dataSource={test_list} 
                    columns={columns} 
                    rowKey={(record, index) => index}
                    pagination={false}
                    expandedRowRender={record => (
                        <div style={{ margin: 0, padding: 16, backgroundColor: '#f7f7f7' }}>
                            <Tabs defaultActiveKey="1">
                                <Tabs.TabPane tab="Request Body" key="1">
                                    <pre style={{ maxHeight: 300, overflow: 'auto' }}>
                                        {JSON.stringify(record.data, null, 2)}
                                    </pre>
                                </Tabs.TabPane>
                                <Tabs.TabPane tab="Response Body" key="2">
                                     <pre style={{ maxHeight: 300, overflow: 'auto' }}>
                                        {JSON.stringify(record.res_body, null, 2)}
                                    </pre>
                                </Tabs.TabPane>
                                <Tabs.TabPane tab="Response Headers" key="3">
                                     <pre style={{ maxHeight: 300, overflow: 'auto' }}>
                                        {JSON.stringify(record.res_header, null, 2)}
                                    </pre>
                                </Tabs.TabPane>
                            </Tabs>
                        </div>
                    )}
                />
            </div>
        )
    }

    render() {
        return this.state.viewType === 'list' ? this.renderList() : this.renderDetail();
    }
}
