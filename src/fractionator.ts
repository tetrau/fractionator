import { lemmaMapping, wordFrequency } from "./data"

export class Tokenizer {
    tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/n't/g, "")
            .split(/[^a-zA-Z-]/)
            .map(t => t.trim())
            .filter(t => t.length > 2)
            .filter(t => t !== "-")
    }
}

export class Lemmatizer {
    lemmaMapping: { [key: string]: string }
    constructor() {
        this.lemmaMapping = lemmaMapping;

    }
    lemmatize(tokens: string[]): string[] {
        return tokens.map(token => {
            if (this.lemmaMapping.hasOwnProperty(token)) {
                return this.lemmaMapping[token];
            }
            else {
                return token;
            }
        })
    }
}

export interface Distillate {
    category: string;
    distillate: string[]
}

export class Fractionator {
    wordFrequency: { [w: string]: number } = Object.fromEntries(wordFrequency.map((word, idx) => [word, idx + 1]))
    fractionate(words: string[]): Distillate[] {
        const catagories: number[] = [800, 1600, 3200, 6400, 12800, 25600, 51200, 102400]
        const unGroupedDistillates: [string, string][] = words.map(word => {
            if (this.wordFrequency.hasOwnProperty(word)) {
                return [word, Math.min(...catagories.filter(c => c > this.wordFrequency[word])).toString()];
            } else {
                return [word, "Unknown"];
            }
        });
        const result: Distillate[] = (catagories.map(c => c.toString()).concat(["Unknown"])).map(
            c => {
                const r: { category: string, distillate: string[] } = { category: c, distillate: [] };
                return r;
            }
        );
        unGroupedDistillates.forEach(distillate => {
            const c = result.find(r => r.category === distillate[1]);
            if (c !== undefined && !c.distillate.includes(distillate[0])) {
                c.distillate.push(distillate[0]);
            }
        });
        result.forEach(d => {
            if (d.category !== "Unknown") {
                const getIndexWithDefault: (word: string) => number = (word) => {
                    if (this.wordFrequency.hasOwnProperty(word)) {
                        return this.wordFrequency[word];
                    } else {
                        return 0;
                    }
                }
                d.distillate.sort((a, b) => getIndexWithDefault(b) - getIndexWithDefault(a));
            }
        })
        return result;
    }
}