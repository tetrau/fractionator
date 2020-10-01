export class Internationalization {
    constructor() {
        this.getLanugage = this.getLanugage.bind(this);
        this.i18n = this.i18n.bind(this);
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

    i18n(text: { [lang: string]: string }): string {
        const language = this.getLanugage();
        if (text.hasOwnProperty(language)) {
            return text[language];
        } else {
            return text["en-US"]
        }
    }
}

export function i18n(text: { [lang: string]: string }): string {
    return new Internationalization().i18n(text);
}
