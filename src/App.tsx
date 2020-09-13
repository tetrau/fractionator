import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import compactLemmaMapping from './compact_lemma_mapping.json'
import compactWordFrequency from './compact_word_frequency.json'
import demoText from './a_farewell_to_arms.json'

const lemmaMapping: { [word: string]: string } = Object.fromEntries(
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

const wordFrequency: string[] = compactWordFrequency.split(";");

class Tokenizer {
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

class Lemmatizer {
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

interface Distillate {
  category: string;
  distillate: string[]
}

class Fractionator {
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

class Internationalization {
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

function i18n(text: string | { [lang: string]: string }): string {
  return new Internationalization().i18n(text);
}

interface GeneralAppComponentProps {
  setStage: (stage: AppStage) => void;
  setInput: (input: string) => void
}

interface FullAccessAppComponentProps {
  setStage: (stage: AppStage) => void;
  setInput: (input: string) => void
  getInput: () => string;
}

const RequestForInput: React.FunctionComponent<GeneralAppComponentProps> = ({ setStage, setInput }) =>
  <React.Fragment>
    <div className="row">
      <div className="col-12">
        <p className="mb-1">
          {i18n({
            "en-US": "Fractionator is an English learning tool for English language learners. Fractionator can create a word list sorted from least common words to most common words form input text so you can learn the vocabulary of a book or a movie ahead without spoilers and have a not-interrupted-by-dictionary reading or watching experiments.",
            "zh-CN": "分馏器·Fractionator 是一个为英语学习者提供的英语学习工具。分馏器·Fractionator 可以从输入的文本中提取出一个按照词频从最不常见到最常见的单词表。这样你就可以在不被剧透的情况下提前学习所有的词汇，获得一个不被查字典打扰的阅读或观看体验。",
            "zh-TW": "分餾器·Fractionator 是一個為英語學習者提供的英語學習工具。分餾器·Fractionator 可以從輸入的文本中提取出一個按照詞頻從最不常見到最常見的單詞表。這樣你就可以在不被劇透的情況下提前學習所有的詞彙，獲得一個不被查字典打擾的閱讀或觀看體驗。"
          })}
        </p>
        <p className="mb-1">
          {i18n({
            "en-US": "To use Fractionator, click [Paste Text] button, then paste your input text or click [Choose File] button, choose a text file (.txt), or a subtitle file (.srt). Finally, click [Fractionate] button to fractionating result. Try It now by clicking the [Demo] button to fractionate some example text. ",
            "zh-CN": "点击【粘贴文本】按钮，然后黏贴想要分馏的文本，或者点击【选择文件】按钮，选择一个文本文档（.txt）或字幕文档（.srt）来开始使用分馏器·Fractionator。当输入好文字或选择好文件时，点击【分馏】按钮来查看分馏的结果。点击【演示】按钮用预设的样本文本来试一试分馏器·Fractionator 的效果。",
            "zh-TW": "點擊【粘貼文本】按鈕，然後黏貼想要分餾的文本，或者點擊【選擇文件】按鈕，選擇一個文本文檔（.txt）或字幕文檔（.srt）來開始使用分餾器·Fractionator。當輸入好文字或選擇好文件時，點擊【分餾】按鈕來查看分餾的結果。點擊【演示】按鈕用預設的樣本文本來試一試分餾器·Fractionator 的效果。"
          })}
        </p>
        <p className="mb-1">
          {i18n({
            "en-US": "Fractionator is free software, all text is processed locally on your browser without been uploaded to any servers. For more information, visit the project ",
            "zh-CN": "分馏器·Fractionator 是一个自由软件，所有的文字处理都是在浏览器本地进行的，你所输入的任何的内容都不会被上传。更多信息请访问",
            "zh-TW": "分餾器·Fractionator 是一個自由軟件，所有的文字處理都是在瀏覽器本地進行的，你所輸入的任何的內容都不會被上傳。更多信息請訪問"
          })}
          <a href="https://github.com/tetrau/fractionator">
            {i18n({
              "en-US": "homepage",
              "zh-CN": "项目主页",
              "zh-TW": "項目主頁"
            })}
          </a>
        </p>
      </div>
    </div>
    <div className="row">
      <div className="col-12 d-flex justify-content-center">
        <button type="button" className="btn btn-outline-primary" onClick={() => { setStage("RequestForText"); setInput(demoText) }}>{i18n("Demo")}</button>
        <button type="button" className="btn btn-outline-primary" onClick={() => setStage("RequestForText")}>{i18n("Paste Text")}</button>
        <button type="button" className="btn btn-outline-primary" onClick={() => setStage("RequestForFile")}>{i18n("Choose File")}</button>
      </div>
    </div>
  </React.Fragment>

const RequestForText: React.FunctionComponent<FullAccessAppComponentProps> = ({ setStage, getInput, setInput }) =>
  <React.Fragment>
    <div className="row">
      <div className="col-12">
        <textarea style={{ height: window.innerHeight * 0.5 }} className="form-control mb-1" placeholder={i18n("Paste Text Here")} value={getInput()} onChange={e => setInput(e.target.value)} ></textarea>
      </div>
    </div>
    <div className="row">
      <div className="col-12 d-flex justify-content-center">
        <button type="button" className="btn btn-outline-primary" onClick={() => { setStage("RequestForInput"); setInput("") }}>{i18n("Return")}</button>
        <button type="button" className="btn btn-outline-primary" onClick={() => { setStage("RequestForFile"); setInput("") }}>{i18n("Choose File")}</button>
        <button type="button" className="btn btn-outline-danger" onClick={() => setStage("ResultDisplay")}>{i18n("Fractionate")}</button>
      </div>
    </div>
  </React.Fragment>

class RequestForFile extends React.Component<GeneralAppComponentProps, {}> {
  inputFileRef: React.RefObject<HTMLInputElement>
  constructor(props: GeneralAppComponentProps) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.inputFileRef = React.createRef();
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    const input = this.inputFileRef.current;
    if (input && input.files !== null) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const result = fileReader.result;
        if (typeof result === "string") {
          this.props.setInput(result)
        }
      }
      fileReader.readAsText(input.files[0]);
      this.props.setStage("ResultDisplay");
    }
    event.preventDefault();
  }

  render() {
    return <div className="row">
      <div className="col-12">
        <form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-12 d-flex justify-content-center">
              <div className="form-group">
                <input type="file" className="form-control-file" accept=".txt,.srt" ref={this.inputFileRef} />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12 d-flex justify-content-center">
              <button type="button" className="btn btn-outline-primary" onClick={() => { this.props.setStage("RequestForInput"); this.props.setInput("") }}>{i18n("Return")}</button>
              <button type="button" className="btn btn-outline-primary" onClick={() => { this.props.setStage("RequestForText"); this.props.setInput("") }}>{i18n("Paste Text")}</button>
              <input className="btn btn-outline-danger" type="submit" value={i18n("Fractionate")} />
            </div>
          </div>
        </form>
      </div>
    </div>
  }
}

class WordDisplay extends React.Component<{ word: string, meaning: string }, { translate: boolean }> {
  constructor(props: { word: string, meaning: string }) {
    super(props);
    this.state = { translate: false };
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
  }

  handleDoubleClick() {
    this.setState({ translate: !this.state.translate });
  }

  render() {
    if (this.state.translate) {
      return <p className="mb-1 w-100" onDoubleClick={this.handleDoubleClick}>
        <strong>{`${this.props.word}`}</strong>
        {`: ${this.props.meaning}`}
      </p>
    } else {
      return <span onDoubleClick={this.handleDoubleClick} className="mr-1">{`${this.props.word} `}</span>
    }
  }
}

class Dictionary {
  dictionary: { [word: string]: string }

  constructor(dict: { [word: string]: string }) {
    this.dictionary = dict;
    this.define = this.define.bind(this);
  }

  define(word: string): string {
    if (this.dictionary.hasOwnProperty(word)) {
      return this.dictionary[word];
    } else {
      return ""
    }
  }
}

interface DictionaryLibraryStatus {
  selected: string | null;
  dictionaryStatus: {
    [lang: string]: "Ready" | "Downloading" | "Error" | "NotDownloaded"
  }
}

class DictionaryLibrary {
  dictionaryLibrary: {
    [lang: string]: {
      dictionary: Dictionary | null,
      status: "Ready" | "Downloading" | "Error" | "NotDownloaded",
      url: string
    }
  }
  selected: string | null
  updateDictionaryLibraryStatus: (dls: DictionaryLibraryStatus) => void
  constructor(dictionaryURLs: { [lang: string]: string }, updateDictionaryLibraryStatusFunc: (dls: DictionaryLibraryStatus) => void) {
    this.dictionaryLibrary = {};
    this.selected = null;
    for (const language in dictionaryURLs) {
      this.dictionaryLibrary[language] = {
        dictionary: null,
        status: "NotDownloaded",
        url: dictionaryURLs[language]
      }
    }
    this.updateDictionaryLibraryStatus = updateDictionaryLibraryStatusFunc;
    this.downloadDictionary = this.downloadDictionary.bind(this);
    this.dictionaryLibraryStatus = this.dictionaryLibraryStatus.bind(this);
    this.select = this.select.bind(this);
  }

  dictionaryLibraryStatus(): DictionaryLibraryStatus {
    const dls: DictionaryLibraryStatus = { selected: this.selected, dictionaryStatus: {} };
    for (const lang in this.dictionaryLibrary) {
      dls.dictionaryStatus[lang] = this.dictionaryLibrary[lang].status;
    }
    return dls
  }

  unselect(): void {
    this.selected = null;
    this.updateDictionaryLibraryStatus(this.dictionaryLibraryStatus());
  }

  select(lang: string): void {
    if (this.dictionaryLibrary.hasOwnProperty(lang)) {
      this.selected = lang;
      this.updateDictionaryLibraryStatus(this.dictionaryLibraryStatus());
      this.downloadDictionary(lang);
    }
  }

  getDictionary(): Dictionary | null {
    if (this.selected !== null) {
      return this.dictionaryLibrary[this.selected].dictionary;
    } else {
      return null;
    }
  }

  downloadDictionary(language: string) {
    if (this.dictionaryLibrary.hasOwnProperty(language) && this.dictionaryLibrary[language].status !== "Ready") {
      const thisDictionary = this.dictionaryLibrary[language]
      const url = thisDictionary.url;
      thisDictionary.status = "Downloading";
      this.updateDictionaryLibraryStatus(this.dictionaryLibraryStatus());
      fetch(url)
        .then(response => response.json())
        .then(dictionary => {
          thisDictionary.status = "Ready";
          thisDictionary.dictionary = new Dictionary(dictionary);
          this.updateDictionaryLibraryStatus(this.dictionaryLibraryStatus());
        })
        .catch(error => {
          thisDictionary.status = "Error";
          this.updateDictionaryLibraryStatus(this.dictionaryLibraryStatus());
        })
    }
  }
}

const ResultDisplay: React.FunctionComponent<{
  setStage: (stage: AppStage) => void,
  setInput: (input: string) => void,
  getInput: () => string,
  dictionaryLibrary: DictionaryLibrary
}> = ({ setStage, getInput, setInput, dictionaryLibrary }) => {
  const tokens = new Tokenizer().tokenize(getInput());
  const lemmas = new Lemmatizer().lemmatize(tokens);
  const distillates = new Fractionator().fractionate(lemmas);
  function displayWords(words: string[], neverTranslate: boolean): React.ReactNode[] {
    if (dictionaryLibrary.selected !== null
        && !neverTranslate
        && dictionaryLibrary.dictionaryLibrary[dictionaryLibrary.selected].status === "Ready") {
      return words.map(word => {
        let meaning: string = ""
        const dictionary = dictionaryLibrary.getDictionary()
        if (dictionary !== null) {
          meaning = dictionary.define(word);
        }
        return <WordDisplay key={word} word={word} meaning={meaning} />;
      });
    } else {
      return [<p className="text-center" key={`distillate-Unknown`}>{words.join(" ")}</p>]
    }
  }
  function DoubleClickDefineOption(text: string, language: string, dictionaryName: string): string {
    const dictionaryStatus = dictionaryLibrary.dictionaryLibrary[language].status;
    if (dictionaryStatus === "Ready" || dictionaryStatus === "NotDownloaded") {
      return text;
    } else if (dictionaryStatus === "Downloading") {
      return i18n({
        "en-US": `Downloading ${dictionaryName} Dictionary...`,
        "zh-CN": `正在下载${dictionaryName}字典...`,
        "zh-TW": `正在下載${dictionaryName}字典...`
      });
    } else {
      return i18n({
        "en-US": "Dictionary Downloading Failed, Please Reload this Page",
        "zh-CN": "下载字典失败，请刷新页面重试",
        "zh-TW": "下載字典失敗，請刷新頁面重試"
      });
    }
  }
  const display = distillates.flatMap(
    ({ category, distillate }) => {
      if (distillate.length === 0) {
        return []
      } else {
        return [
          <div className="d-flex justify-content-center flex-wrap" key={`words-${category}`}>
            {displayWords(distillate, category === "Unknown")}
          </div>,
          <div className="separator" key={`separator-${category}`}>{category}</div>
        ];
      }
    }
  ).reverse();
  return <React.Fragment>
    <div className="row">
      <div className="col-12">
        {display}
      </div>
    </div>
    <div className="row">
      <div className="col-12 d-flex justify-content-center flex-wrap">
        <button type="button" className="btn btn-outline-primary mt-1 mb-1" onClick={() => { setStage("RequestForInput"); setInput("") }}>{i18n("Return")}</button>
        <button type="button" className="btn btn-outline-primary mt-1 mb-1" onClick={() => { setStage("RequestForText"); setInput("") }}>{i18n("Paste Text")}</button>
        <button type="button" className="btn btn-outline-primary mt-1 mb-1" onClick={() => { setStage("RequestForFile"); setInput("") }}>{i18n("Choose File")}</button>
        <div className="form-group mt-1 mb-1">
          <select className="form-control w-auto" onChange={(event) => {
            const value = event.target.value;
            if (value === "") {
              dictionaryLibrary.unselect();
            } else {
              dictionaryLibrary.select(event.target.value)
            }
          }}>
            <option selected={dictionaryLibrary.selected === null} value="">
              {i18n({
                "en-US": "Double Click Word Show Defination: OFF",
                "zh-CN": "双击单词显示释义：关",
                "zh-TW": "雙擊單詞顯示釋義：關"
              })}
            </option>
            <option selected={dictionaryLibrary.selected === "zh-CN"} value="zh-CN">
              {DoubleClickDefineOption(i18n({
                "en-US": "Double Click Word Show Chinese Defination",
                "zh-CN": "双击单词显示中文释义",
                "zh-TW": "雙擊單詞顯示中文釋義"
              }), "zh-CN",
                i18n({
                  "en-US": "English-Chinese",
                  "zh-CN": "英汉",
                  "zh-TW": "英漢"
                }))}
            </option>
          </select>
        </div>
      </div>
    </div>
  </React.Fragment >
}

type AppStage = "RequestForInput" | "RequestForText" | "ResultDisplay" | "RequestForFile"

class App extends React.Component<{}, {
  stage: AppStage;
  input: string;
  dictionaryLibraryStatus: DictionaryLibraryStatus
}> {
  dictionaryLibrary: DictionaryLibrary
  constructor(props: any) {
    super(props);
    this.dictionaryLibrary = new DictionaryLibrary(
      { "zh-CN": process.env.PUBLIC_URL + "/dictionary.zh-CN.json" },
      (newDictionaryLibraryStatus) => this.setState({ dictionaryLibraryStatus: newDictionaryLibraryStatus })
    );
    let dictionaryLanguage = new Internationalization().getLanugage();
    dictionaryLanguage = dictionaryLanguage === "zh-TW" ? "zh-CN" : dictionaryLanguage
    this.dictionaryLibrary.downloadDictionary(dictionaryLanguage);
    this.state = {
      stage: "RequestForInput",
      input: "",
      dictionaryLibraryStatus: this.dictionaryLibrary.dictionaryLibraryStatus()
    };
    this.setStage = this.setStage.bind(this);
    this.setInput = this.setInput.bind(this);
    this.getInput = this.getInput.bind(this);
  }

  setStage(stage: AppStage): void {
    this.setState({ "stage": stage });
  }

  setInput(input: string): void {
    this.setState({ "input": input });
  }

  getInput(): string {
    return this.state.input;
  }

  render() {
    return <div className="d-flex align-items-center min-vh-100">
      <div className="container">
        {this.state.stage === "RequestForInput" && <RequestForInput setStage={this.setStage} setInput={this.setInput} />}
        {this.state.stage === "RequestForText" && <RequestForText setStage={this.setStage} getInput={this.getInput} setInput={this.setInput} />}
        {this.state.stage === "ResultDisplay" && <ResultDisplay dictionaryLibrary={this.dictionaryLibrary} setStage={this.setStage} getInput={this.getInput} setInput={this.setInput} />}
        {this.state.stage === "RequestForFile" && <RequestForFile setStage={this.setStage} setInput={this.setInput} />}
      </div>
    </div>
  }
}

export default App;
