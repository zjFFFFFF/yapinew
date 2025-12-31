const yapi = require('../yapi.js');
const baseModel = require('./base.js');

class timerModel extends baseModel {
  getName() {
    return 'timer';
  }

  getSchema() {
    return {
      name: String,
      project_id: { type: Number, required: true },
      col_id: { type: Number, required: true }, // Interface Collection ID
      env: String, // Environment name
      cron_expression: String, // Cron expression
      status: { type: String, default: 'open' }, // open, closed
      uid: Number,
      add_time: Number,
      up_time: Number,
      notice: { type: Boolean, default: false } // Whether to notify on failure
    };
  }

  save(data) {
    data.add_time = yapi.commons.time();
    data.up_time = yapi.commons.time();
    return this.model.create(data);
  }

  list(project_id) {
    return this.model.find({
      project_id: project_id
    }).sort({ _id: -1 }).exec();
  }

  get(id) {
    return this.model.findOne({
      _id: id
    }).exec();
  }

  update(id, data) {
    data.up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      data
    );
  }

  del(id) {
    return this.model.remove({
      _id: id
    });
  }
}

module.exports = timerModel;
