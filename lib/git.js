const {exec} = require('child_process');

function jsonFiller(strings, ...keys) {
    return (function(dict) {
        let result = [strings[0]];
        keys.forEach(function(key, i) {
            result.push(dict[key], strings[i + 1]);
        });
        return result.join('');
    });
}

function urlWithCredentials(url, username, password) {
    let pos = url.indexOf('://') + 3;
    return [url.slice(0, pos), username, ':', password, '@', url.slice(pos)].join('');
}

const cmds = {
    'commit': jsonFiller`git -C ${'path'} commit -m "${'message'}"`,
    'clone': jsonFiller`git -C ${'path'} clone ${'url'}`,
    'fetch': jsonFiller`git -C ${'path'} fetch ${'url'}`,
    'pull': jsonFiller`git -C ${'path'} pull ${'url'}`,
    'push': jsonFiller`git -C ${'path'} push ${'url'}`,
    'get-remote-url': jsonFiller`git -C ${'path'} remote get-url origin`
};

function callCmd(cmd, args, func) {
    if (cmd === 'push') args['url'] = urlWithCredentials(args['url'], args['username'], args['password']);
    let cmdFull = cmds[cmd](args);
    console.log(cmdFull);

    exec(cmdFull, func);
}

module.exports = callCmd;
