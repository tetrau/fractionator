import compactLemmaMapping from './compact_lemma_mapping.json'
import compactWordFrequency from './compact_word_frequency.json'

export const lemmaMapping: { [word: string]: string } = Object.fromEntries(
    compactLemmaMapping.split(";").flatMap(
        wordFormsLine => {
            const splitedWordFormsLine = wordFormsLine.split(":");
            const word = splitedWordFormsLine[0];
            const forms = splitedWordFormsLine[1].split(",");
            return forms.map(f => {
                const compactForm = ["ing", "ed", "s", "es", "er", "est"];
                if (compactForm.includes(f)) {
                    return [word + f, word];
                } else {
                    return [f, word];
                }
            });
        }
    )
)

export const wordFrequency: string[] = compactWordFrequency.split(";");

const words: Set<string> = new Set(wordFrequency.concat(Object.keys(lemmaMapping)));

export function isWord(word: string): boolean {
    return words.has(word);
}