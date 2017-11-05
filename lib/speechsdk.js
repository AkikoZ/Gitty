const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
const ConversationV1 = require('watson-developer-cloud/conversation/v1');

const fs = require('fs');

const defaultConfig = {
    username: 'f9f1bb02-562b-4adf-893a-2fedcccb0b9a',
    password: '3RPCnSxKcJU4'
};

const nluConfig = {
    username: "4de0937e-adb6-4ac0-83fa-c26560b34c3d",
    password: "78bdd2lkRp6x",
    version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
};

const speakConfig = {
    username: "b141ce19-915e-4f22-9608-cad4b2848e17",
    password: "u4bSsYx1iX1y"
};

const conversationConfig = {
    username: "1ab67dd9-cfaa-4051-b633-fdc0037a0486",
    password: "jPd8cCsgN08j",
    version_date: ConversationV1.VERSION_DATE_2017_05_26
}

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

class Text2Speech {
    constructor(config=speakConfig) {
        this.text_to_speech = new TextToSpeechV1(config);
    }

    synthesize(text, voice='en-US_AllisonVoice', accept='audio/flac') {
        let synthesizePromise = promisify(this.text_to_speech.synthesize, this.text_to_speech);
        return synthesizePromise({'text': text, 'voice': voice, 'accept': accept});
    }
}

class Conversation {
    constructor(config=conversationConfig) {
        this.conversation = new ConversationV1(config);
    }

    message(text) {
        let messagePromise = promisify(this.conversation.message, this.conversation);
        return messagePromise({input: {'text': text}, workspace_id: '0bf46738-ec16-4d98-b9fd-ea130b2c89f4'});
    }
}

class SpeechSDK {
    constructor() {
        this.Speech2TextSDK = new Speech2Text();
        this.NLUSDK = new NLU();
        this.Text2SpeechSDK = new Text2Speech();
        this.ConversationSDK = new Conversation();
    }

    recognize(params) {
        return this.Speech2TextSDK.recognize(params);
    }

    analyze(params) {
        return this.NLUSDK.analyze(params);
    }

    synthesize(text, voice='en-US_AllisonVoice', accept='audio/flac') {
        return this.Text2SpeechSDK.synthesize(text, voice, accept);
    }

    message(text) {
        return this.ConversationSDK.message(text);
    }

    talkToGitty(words) {
        return this.message(words).then((res)=>{
            return Promise.resolve(res.output.text[0]);
        }).then((response)=>{
            return this.synthesize(response);
        });
    }

    analyzeAudio(params) {
        return this.recognize(params).then((res)=>{
            let text = res.results[0].alternatives[0].transcript;
            console.log('text: ' + text);
            return Promise.resolve(text);
        }).then((data)=>{
            return this.analyze(data);
        });
    }

}

module.exports = SpeechSDK;