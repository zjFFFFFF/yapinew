const yapi = require('../yapi.js');
const baseController = require('./base.js');
const testLogModel = require('../models/testLog.js');

class testLogController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = yapi.getInst(testLogModel);
  }

  /**
   * 获取测试报告列表
   * @interface /test/log/list
   * @method GET
   * @category TestLog
   * @foldnumber 10
   * @param {Number} project_id
   * @param {Number} page
   * @param {Number} limit
   */
  async list(ctx) {
    try {
      let project_id = ctx.request.query.project_id;
      let page = ctx.request.query.page || 1;
      let limit = ctx.request.query.limit || 20;

      if (!project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'project_id不能为空'));
      }

      let result = await this.Model.list(project_id, parseInt(limit), parseInt(page));
      ctx.body = yapi.commons.resReturn(result);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }

  /**
   * 获取测试报告详情
   * @interface /test/log/get
   * @method GET
   * @category TestLog
   * @foldnumber 10
   * @param {Number} id
   */
  async get(ctx) {
    try {
      let id = ctx.request.query.id;
      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'id不能为空'));
      }
      let result = await this.Model.get(id);
      ctx.body = yapi.commons.resReturn(result);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }

  /**
   * 保存测试报告
   * @interface /test/log/add
   * @method POST
   * @category TestLog
   * @foldnumber 10
   * @param {Object} data
   */
  async add(ctx) {
    try {
      let params = ctx.request.body;
      params.uid = this.getUid();
      
      if (!params.project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'project_id不能为空'));
      }
      if (!params.col_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'col_id不能为空'));
      }

      let result = await this.Model.save(params);
      ctx.body = yapi.commons.resReturn(result);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }
}

module.exports = testLogController;
