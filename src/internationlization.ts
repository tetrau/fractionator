export class Internationalization {
    constructor() {
        this.getLanugage = this.getLanugage.bind(this);
        this.i18n = this.i18n.bind(this);
    }

    translation: { [t: string]: { [l: string]: string } } = {
        "Paste Text": { "zh-CN": "粘贴文本", "zh-TW": "粘貼文本" },
        "Choose File": { "zh-CN": "选择文件", "zh-TW": "選擇文件" },
        "Fractionate": { "zh-CN": "分馏", "zh-TW": "分餾" },
        "Demo": { "zh-CN": "演示", "zh-TW": "演示" },
        "Paste Text Here": { "zh-CN": "在这里粘贴文本", "zh-TW": "在這裡粘貼文本" },
        "Return": { "zh-CN": "返回", "zh-TW": "返回" }
    }

    getLanugage(): string {
        const languageMapping: { [alias: string]: string } = {
            "en": "en-US", "zh": "zh-CN",
            "zh-cn": "zh-CN", "zh-tw": "zh-TW",
            "zh-HK": "zh-TW", "zh-hk": "zh-TW"
        };
        let language = navigator.language;
        if (languageMapping.hasOwnProperty(language)) {
            language = languageMapping[language];
        }
        return language;
    }

    i18n(text: string | { [lang: string]: string }): string {
        const language = this.getLanugage();
        if (typeof text === "string") {
            if (language !== "en-US") {
                const multilanguage = this.translation[text];
                if (multilanguage.hasOwnProperty(language)) {
                    return multilanguage[language];
                } else {
                    return text;
                }
            }
            else {
                return text;
            }
        } else {
            if (text.hasOwnProperty(language)) {
                return text[language];
            } else {
                return text["en-US"]
            }
        }
    }
}

export function i18n(text: string | { [lang: string]: string }): string {
    return new Internationalization().i18n(text);
}
