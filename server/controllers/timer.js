const timerModel = require('../models/timer.js');
const yapi = require('../yapi.js');
const baseController = require('./base.js');
const scheduler = require('../utils/scheduler.js');

class timerController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.timerModel = yapi.getInst(timerModel);
  }

  /**
   * 添加定时任务
   * @interface /col/add_timer
   * @method POST
   */
  async addTimer(ctx) {
    try {
      let params = ctx.request.body;
      params.uid = this.getUid();
      let result = await this.timerModel.save(params);
      scheduler.addJob(result.toObject());
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 获取项目下的定时任务列表
   * @interface /col/list_timer
   * @method GET
   */
  async listTimer(ctx) {
    try {
      let project_id = ctx.query.project_id;
      let result = await this.timerModel.list(project_id);
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  
  /**
   * 获取单个定时任务详情
   * @interface /col/get_timer
   * @method GET
   */
  async getTimer(ctx) {
     try {
      let id = ctx.query.id;
      let result = await this.timerModel.get(id);
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 更新定时任务
   * @interface /col/up_timer
   * @method POST
   */
  async updateTimer(ctx) {
    try {
      let params = ctx.request.body;
      let id = params.id;
      delete params.id;
      let result = await this.timerModel.update(id, params);
      let timer = await this.timerModel.get(id);
      scheduler.updateJob(timer.toObject());
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 删除定时任务
   * @interface /col/del_timer
   * @method GET
   */
  async delTimer(ctx) {
    try {
      let id = ctx.query.id;
      await this.timerModel.del(id);
      scheduler.removeJob(id);
      ctx.body = yapi.commons.resReturn(null);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
}

module.exports = timerController;
