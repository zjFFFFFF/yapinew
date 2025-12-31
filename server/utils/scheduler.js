const schedule = require('node-schedule');
const yapi = require('../yapi.js');
const projectModel = require('../models/project.js');
const interfaceColModel = require('../models/interfaceCol.js');
const interfaceCaseModel = require('../models/interfaceCase.js');
const timerModel = require('../models/timer.js');
const testLogModel = require('../models/testLog.js');
const { handleParams, crossRequest, handleCurrDomain, checkNameIsExistInArray } = require('../../common/postmanLib');
const { handleParamsValue, ArrayToObject } = require('../../common/utils.js');
const _ = require('underscore');
const createContex = require('../../common/createContext');

const jobs = {};

class Scheduler {
  constructor() {
    this.projectModel = yapi.getInst(projectModel);
    this.interfaceColModel = yapi.getInst(interfaceColModel);
    this.interfaceCaseModel = yapi.getInst(interfaceCaseModel);
    this.timerModel = yapi.getInst(timerModel);
    this.testLogModel = yapi.getInst(testLogModel);
  }

  async init() {
    const timers = await this.timerModel.model.find({ status: 'open' });
    timers.forEach(timer => {
      this.addJob(timer);
    });
    yapi.commons.log(`Initialized ${timers.length} scheduled tasks.`);
  }

  addJob(timer) {
    if (jobs[timer._id]) {
      this.removeJob(timer._id);
    }
    try {
      const job = schedule.scheduleJob(timer.cron_expression, async () => {
        try {
            yapi.commons.log(`Running scheduled task: ${timer.name} (ID: ${timer._id})`);
            await this.runTask(timer);
        } catch (e) {
            yapi.commons.log(`Scheduled task failed: ${timer.name} (ID: ${timer._id}). Error: ${e.message}`, 'error');
        }
      });
      jobs[timer._id] = job;
    } catch (e) {
      yapi.commons.log(`Failed to schedule job ${timer.name}: ${e.message}`, 'error');
    }
  }

  removeJob(timerId) {
    if (jobs[timerId]) {
      jobs[timerId].cancel();
      delete jobs[timerId];
    }
  }

  updateJob(timer) {
    this.removeJob(timer._id);
    if (timer.status === 'open') {
      this.addJob(timer);
    }
  }

  async runTask(timer) {
    const { project_id, col_id, env, uid } = timer;
    const records = {};
    const reports = {};
    const testList = [];

    const colData = await this.interfaceColModel.get(col_id);
    if (!colData) return;

    const projectData = await this.projectModel.get(project_id);
    const caseListResult = await yapi.commons.getCaseList(col_id);
    if (caseListResult.errcode !== 0) return;
    
    const caseList = caseListResult.data;

    // Fetch Env data
    const projectEnv = await this.projectModel.getByEnv(project_id);
    const curEnvItem = projectEnv.env.find(item => item.name === env);
    const curEnv = curEnvItem ? curEnvItem : projectEnv.env[0];

    for (let i = 0; i < caseList.length; i++) {
      let item = caseList[i];
      item.id = item._id;
      item.case_env = env || item.case_env;
      
      // Handle Headers
      item.req_headers = this.handleReqHeader(item.req_headers, projectEnv.env, item.case_env);
      item.pre_script = projectData.pre_script;
      item.after_script = projectData.after_script;
      item.env = projectEnv.env;

      let result;
      try {
        result = await this.handleTest(item, uid, records);
      } catch (err) {
        result = err;
      }
      reports[item.id] = result;
      records[item.id] = {
        params: result.params,
        body: result.res_body
      };
      testList.push(result);
    }

    // Check results and notify
    const failedNum = testList.filter(item => item.code !== 0).length;
    
    // Save to testLog
    try {
        await this.testLogModel.save({
            uid: uid || 0,
            project_id: project_id,
            col_id: col_id,
            timer_id: timer._id,
            env: env,
            test_list: testList,
            status: failedNum === 0 ? 'ok' : 'failed'
        });
    } catch(e) {
        yapi.commons.log('Save test log failed: ' + e.message, 'error');
    }

    if (timer.notice && failedNum > 0) {
      this.sendNotification(project_id, timer.name, testList);
    }
  }

  async handleTest(interfaceData, uid, records) {
    let requestParams = {};
    let options = handleParams(interfaceData, this.handleValue.bind(this, records), requestParams);
    let result = {
      id: interfaceData.id,
      name: interfaceData.casename,
      path: interfaceData.path,
      code: 400,
      validRes: []
    };

    try {
      options.taskId = uid;
      const startTime = Date.now();
      let data = await crossRequest(options, interfaceData.pre_script, interfaceData.after_script, createContex(
        uid,
        interfaceData.project_id,
        interfaceData.interface_id
      ));
      const endTime = Date.now();
      let res = data.res;
      result = Object.assign(result, {
        status: res.status,
        statusText: res.statusText,
        url: data.req.url,
        method: data.req.method,
        data: data.req.data,
        headers: data.req.headers,
        res_header: res.header,
        res_body: res.body,
        runTime: endTime - startTime
      });
      
      if (options.data && typeof options.data === 'object') {
        requestParams = Object.assign(requestParams, options.data);
      }

      let validRes = [];
      let responseData = Object.assign({}, {
        status: res.status,
        body: res.body,
        header: res.header,
        statusText: res.statusText
      });

      await this.handleScriptTest(interfaceData, responseData, validRes, requestParams, uid, records);
      result.params = requestParams;
      if (validRes.length === 0) {
        result.code = 0;
        result.validRes = [{ message: '验证通过' }];
      } else if (validRes.length > 0) {
        result.code = 1;
        result.validRes = validRes;
      }
    } catch (data) {
      result = Object.assign(options, result, {
        res_header: data.header,
        res_body: data.body || data.message,
        status: null,
        statusText: data.message,
        code: 400
      });
    }
    return result;
  }

  async handleScriptTest(interfaceData, response, validRes, requestParams, uid, records) {
    try {
      let test = await yapi.commons.runCaseScript({
        response: response,
        records: records,
        script: interfaceData.test_script,
        script_type: interfaceData.test_script_type,
        params: requestParams
      }, interfaceData.col_id, interfaceData.interface_id, uid);
      
      if (test.errcode !== 0) {
        test.data.logs.forEach(item => {
          validRes.push({ message: item });
        });
      }
    } catch (err) {
      validRes.push({ message: 'Error: ' + err.message });
    }
  }

  handleValue(records, val, global) {
    let globalValue = ArrayToObject(global);
    let context = Object.assign({}, { global: globalValue }, records);
    return handleParamsValue(val, context);
  }

  handleReqHeader(req_header, envData, curEnvName) {
    let currDomain = handleCurrDomain(envData, curEnvName);
    let header = currDomain.header;
    header.forEach(item => {
      if (!checkNameIsExistInArray(item.name, req_header)) {
        item.abled = true;
        req_header.push(item);
      }
    });
    return req_header.filter(item => item && typeof item === 'object');
  }

  sendNotification(projectId, taskName, testList) {
    const successNum = testList.filter(item => item.code === 0).length;
    const failedNum = testList.length - successNum;
    
    yapi.commons.sendNotice(projectId, {
      title: `YApi定时任务失败通知: ${taskName}`,
      content: `
        <html>
        <head>
        <title>测试报告</title>
        <meta charset="utf-8" />
        <body>
        <div>
        <h3>定时任务 [${taskName}] 执行完成</h3>
        <p>一共 ${testList.length} 测试用例，${successNum} 个验证通过， ${failedNum} 个未通过。</p>
        <p>请登录 YApi 查看详细结果。</p>
        </div>
        </body>
        </html>`
    });
  }
}

const scheduler = new Scheduler();
module.exports = scheduler;
