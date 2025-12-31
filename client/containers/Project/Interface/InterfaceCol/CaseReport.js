import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Tabs } from 'antd';
const TabPane = Tabs.TabPane;
function jsonFormat(json) {
  // console.log('json',json)
  if (json && typeof json === 'object') {
    return JSON.stringify(json, null, '   ');
  }
  return json;
}

const CaseReport = function(props) {
  let params = jsonFormat(props.data);
  let headers = jsonFormat(props.headers, null, '   ');
  let res_header = jsonFormat(props.res_header, null, '   ');
  let res_body = jsonFormat(props.res_body);
  let httpCode = props.status;
  let validRes;
  let scriptOutput = [];
  if (props.validRes && Array.isArray(props.validRes)) {
    validRes = props.validRes.map((item, index) => {
      // 提取脚本输出日志
      if (item.message && typeof item.message === 'string' && item.message.indexOf('print:') === 0) {
        scriptOutput.push(item.message.replace('print:', ''));
        return null; // 不在验证结果中显示
      }
      return <div key={index}>{item.message}</div>;
    });
  }

  return (
    <div className="report">
      <Tabs defaultActiveKey="request">
        <TabPane className="case-report-pane" tab="Request" key="request">
          <Row className="case-report">
            <Col className="case-report-title" span="6">
              Url
            </Col>
            <Col span="18">{props.url}</Col>
          </Row>
          {props.query ? (
            <Row className="case-report">
              <Col className="case-report-title" span="6">
                Query
              </Col>
              <Col span="18">{props.query}</Col>
            </Row>
          ) : null}

          {props.headers ? (
            <Row className="case-report">
              <Col className="case-report-title" span="6">
                Headers
              </Col>
              <Col span="18">
                <pre>{headers}</pre>
              </Col>
            </Row>
          ) : null}

          {params ? (
            <Row className="case-report">
              <Col className="case-report-title" span="6">
                Body
              </Col>
              <Col span="18">
                <pre style={{ whiteSpace: 'pre-wrap' }}>{params}</pre>
              </Col>
            </Row>
          ) : null}
        </TabPane>
        <TabPane className="case-report-pane" tab="Response" key="response">
          <Row  className="case-report">
            <Col className="case-report-title" span="6">
              HttpCode
            </Col>
            <Col span="18">
              <pre>{httpCode}</pre>
            </Col>
          </Row>
          {props.res_header ? (
            <Row className="case-report">
              <Col className="case-report-title" span="6">
                Headers
              </Col>
              <Col span="18">
                <pre>{res_header}</pre>
              </Col>
            </Row>
          ) : null}
          {props.res_body ? (
            <Row className="case-report">
              <Col className="case-report-title" span="6">
                Body
              </Col>
              <Col span="18">
                <pre>{res_body}</pre>
              </Col>
            </Row>
          ) : null}
        </TabPane>
        <TabPane className="case-report-pane" tab="验证结果" key="valid">
          {props.validRes ? (
            <Row className="case-report">
              <Col className="case-report-title" span="6">
                验证结果
              </Col>
              <Col span="18"><pre>
                {validRes}  
              </pre></Col>
            </Row>
          ) : null}
        </TabPane>
        {scriptOutput.length > 0 ? (
          <TabPane className="case-report-pane" tab="脚本输出" key="scriptOutput">
            <Row className="case-report">
              <Col className="case-report-title" span="6">
                脚本输出
              </Col>
              <Col span="18">
                <pre>{scriptOutput.join('\n')}</pre>
              </Col>
            </Row>
          </TabPane>
        ) : null}
      </Tabs>
    </div>
  );
};

CaseReport.propTypes = {
  url: PropTypes.string,
  data: PropTypes.any,
  headers: PropTypes.object,
  res_header: PropTypes.object,
  res_body: PropTypes.any,
  query: PropTypes.string,
  validRes: PropTypes.array,
  status: PropTypes.number
};

export default CaseReport;
