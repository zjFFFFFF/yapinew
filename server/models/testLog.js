const yapi = require('../yapi.js');
const baseModel = require('./base.js');

class testLogModel extends baseModel {
    getName() {
        return 'test_log';
    }

    getSchema() {
        return {
            uid: Number,
            project_id: { type: Number, required: true },
            col_id: { type: Number, required: true },
            timer_id: Number,
            env: String,
            test_list: Array, // Details of each case execution
            add_time: Number,
            status: String // 'ok' or 'error' (or 'failed')
        };
    }

    save(data) {
        data.add_time = yapi.commons.time();
        const log = new this.model(data);
        return log.save();
    }

    list(project_id, limit = 20, page = 1) {
        return this.model.find({
            project_id: project_id
        })
            .sort({ add_time: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
    }
    
    get(id) {
        return this.model.findOne({
            _id: id
        }).exec();
    }
}

module.exports = testLogModel;
