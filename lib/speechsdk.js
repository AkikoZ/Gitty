const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const defaultConfig = {
    username: 'f9f1bb02-562b-4adf-893a-2fedcccb0b9a',
    password: '3RPCnSxKcJU4'
};

const nluConfig = {
    username: "4de0937e-adb6-4ac0-83fa-c26560b34c3d",
    password: "78bdd2lkRp6x",
    version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
};

const actions = ['clone', 'commit', 'fetch', 'push', 'pull'];
const types = ['user', 'repository', 'message'];

const promisify = (fn, receiver) => {
    return (...args) => {
        return new Promise((resolve, reject) => {
            fn.apply(receiver, [...args, (err, res) => {
                return err ? reject(err) : resolve(res);
            }]);
        });
    };
};

class Speech2Text {
    constructor(config = defaultConfig) {
        this.speech_to_text = new SpeechToTextV1(config);
    }

    recognize(params) {
        let recognizePromise = promisify(this.speech_to_text.recognize, this.speech_to_text);
        return recognizePromise(params);
    }
}

class NLU {
    constructor(config=nluConfig) {
        this.nlu = new NaturalLanguageUnderstandingV1(config);
    }

    analyzeParams(data, keywords) {
        let analyzePromise = promisify(this.nlu.analyze, this.nlu);
        return analyzePromise({
            'html': data,
            'features': {
                'keywords': {},
            }
        });
    }

    analyzeAction(data) {
        for (let action of actions) {
            if (data.includes(action)) {
                return action;
            }
        }
        return null;
    }

    analyze(data) {
        let command = {};
        command.action = this.analyzeAction(data);
        // a simple tricky
        for(let type of types) {
            let i = data.indexOf(type);
            if (i >= 0) {
                command[type] = data.substring(i+type.length).trim().split(' ')[0];   
            }
        }
        
        return this.analyzeParams(data).then((res)=>{
            let keywords = res.keywords;
            let ret = Object.assign(command, this.formatParams(keywords));
            return Promise.resolve(ret);
        });
    }

    formatParams(data) {
        let params = {
        };
        for(let item of data) {
            for(let type of types) {
                let i = item.text.indexOf(type);
                if (i >= 0) {
                    params[type] = item.text.substring(i+type.length).trim();
                }
            }
        }
        return params;
    }
}

class SpeechSDK {
    constructor() {
        this.Speech2TextSDK = new Speech2Text();
        this.NLUSDK = new NLU();
    }

    recognize(params) {
        return this.Speech2TextSDK.recognize(params);
    }

    analyze(params) {
        return this.NLUSDK.analyze(params);
    }

    analyzeAudio(params) {
        this.recognize(params).then((res)=>{
            console.log('text: ' + res.results[0].alternatives[0].transcript);
            return Promise.resolve(res.results[0].alternatives[0].transcript);
        }).then((data)=>{
            return this.analyze(data);
        });
    }

}

module.exports = SpeechSDK;