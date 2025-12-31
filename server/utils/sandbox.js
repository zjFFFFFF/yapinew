const vm = require('vm');

module.exports = async function sandboxFn(context, script) {
  try {
    const sandbox = context || {};
    const scriptObj = new vm.Script(script);
    const vmContext = new vm.createContext(sandbox);
    scriptObj.runInContext(vmContext, {
      timeout: 3000
    });
    return sandbox;
  } catch (err) {
    throw err;
  }
}
