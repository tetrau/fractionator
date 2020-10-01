import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import { Tokenizer, Lemmatizer, Fractionator } from './fractionator'
import demoText from './a_farewell_to_arms.json'
import { Internationalization, i18n } from './internationlization';
import { PDFFileTextExtractorController, FileTextExtractor, TextFileTextExtractorController } from './file_text_extractor';
import { DictionaryLibrary, DictionaryLibraryStatus } from "./dictionary";
import * as multilaanguage from "./multilanguage";

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
          {i18n(multilaanguage.desc)}
        </p>
        <p className="mb-1">
          {i18n(multilaanguage.instruction)}
        </p>
        <p className="mb-1">
          {i18n(multilaanguage.privacyStatement)}
          <a href="https://github.com/tetrau/fractionator">
            {i18n(multilaanguage.homePageLink)}
          </a>
        </p>
      </div>
    </div>
    <div className="row">
      <div className="col-12 d-flex justify-content-center">
        <button type="button" className="btn btn-outline-primary" onClick={() => { setStage("RequestForText"); setInput(demoText) }}>{i18n(multilaanguage.demoBtn)}</button>
        <button type="button" className="btn btn-outline-primary" onClick={() => setStage("RequestForText")}>{i18n(multilaanguage.pasteTextBtn)}</button>
        <button type="button" className="btn btn-outline-primary" onClick={() => setStage("RequestForFile")}>{i18n(multilaanguage.chooseFileBtn)}</button>
      </div>
    </div>
  </React.Fragment>

const RequestForText: React.FunctionComponent<FullAccessAppComponentProps> = ({ setStage, getInput, setInput }) =>
  <React.Fragment>
    <div className="row">
      <div className="col-12">
        <textarea style={{ height: window.innerHeight * 0.5 }} className="form-control mb-1" placeholder={i18n(multilaanguage.pasteTextHere)} value={getInput()} onChange={e => setInput(e.target.value)} ></textarea>
      </div>
    </div>
    <div className="row">
      <div className="col-12 d-flex justify-content-center">
        <button type="button" className="btn btn-outline-primary" onClick={() => { setStage("RequestForInput"); setInput("") }}>{i18n(multilaanguage.returnBtn)}</button>
        <button type="button" className="btn btn-outline-primary" onClick={() => { setStage("RequestForFile"); setInput("") }}>{i18n(multilaanguage.chooseFileBtn)}</button>
        <button type="button" className="btn btn-outline-danger" onClick={() => setStage("ResultDisplay")}>{i18n(multilaanguage.fractionateBtn)}</button>
      </div>
    </div>
  </React.Fragment>

class RequestForFile extends React.Component<GeneralAppComponentProps, { file: File | null }> {
  inputFileRef: React.RefObject<HTMLInputElement>
  extractor: null | FileTextExtractor
  constructor(props: GeneralAppComponentProps) {
    super(props);
    this.handleFileChoosed = this.handleFileChoosed.bind(this);
    this.gotoResultDisplay = this.gotoResultDisplay.bind(this);
    this.inputFileRef = React.createRef();
    this.state = { file: null };
    this.extractor = null
  }

  handleFileChoosed(): void {
    const input = this.inputFileRef.current;
    if (input && input.files !== null && input.files.length > 0) {
      const file: File = input.files[0];
      this.setState({ file: file });
    }
  }

  gotoResultDisplay(): void {
    if (this.extractor !== null) {
      this.extractor.extract((text) => {
        if (text !== null) {
          this.props.setInput(text);
          this.props.setStage("ResultDisplay");
        }
      })
    }
  }

  render() {
    return <div className="row">
      <div className="col-12">
        <div className="row">
          <div className="col-12 d-flex justify-content-center">
            <div className="form-group">
              <input type="file" className="form-control-file" onChange={this.handleFileChoosed} accept=".txt,.srt,.pdf" ref={this.inputFileRef} />
              {this.state.file !== null && this.state.file.name.toLowerCase().endsWith(".pdf") &&
                <PDFFileTextExtractorController file={this.state.file} setExtractor={(e) => this.extractor = e} />}
              {this.state.file !== null && !this.state.file.name.toLowerCase().endsWith(".pdf") &&
                <TextFileTextExtractorController file={this.state.file} setExtractor={(e) => this.extractor = e} />}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12 d-flex justify-content-center">
            <button type="button" className="btn btn-outline-primary" onClick={() => { this.props.setStage("RequestForInput"); this.props.setInput("") }}>{i18n(multilaanguage.returnBtn)}</button>
            <button type="button" className="btn btn-outline-primary" onClick={() => { this.props.setStage("RequestForText"); this.props.setInput("") }}>{i18n(multilaanguage.pasteTextBtn)}</button>
            <button type="button" className="btn btn-outline-danger" onClick={this.gotoResultDisplay}>{i18n(multilaanguage.fractionateBtn)}</button>
          </div>
        </div>
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
  function DoubleClickDefineOption(text: string, language: string): string {
    const dictionaryStatus = dictionaryLibrary.dictionaryLibrary[language].status;
    if (dictionaryStatus === "Ready" || dictionaryStatus === "NotDownloaded") {
      return text;
    } else if (dictionaryStatus === "Downloading") {
      return i18n(multilaanguage.downloadingDictionary);
    } else {
      return i18n(multilaanguage.dictionaryDownloadFailed);
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
        <button type="button" className="btn btn-outline-primary mt-1 mb-1" onClick={() => { setStage("RequestForInput"); setInput("") }}>{i18n(multilaanguage.returnBtn)}</button>
        <button type="button" className="btn btn-outline-primary mt-1 mb-1" onClick={() => { setStage("RequestForText"); setInput("") }}>{i18n(multilaanguage.pasteTextBtn)}</button>
        <button type="button" className="btn btn-outline-primary mt-1 mb-1" onClick={() => { setStage("RequestForFile"); setInput("") }}>{i18n(multilaanguage.chooseFileBtn)}</button>
        <div className="form-group mt-1 mb-1">
          <select className="form-control w-auto" value={dictionaryLibrary.selected === null ? "" : dictionaryLibrary.selected} onChange={(event) => {
            const value = event.target.value;
            if (value === "") {
              dictionaryLibrary.unselect();
            } else {
              dictionaryLibrary.select(event.target.value)
            }
          }}>
            <option value="">
              {i18n(multilaanguage.dictionaryOff)}
            </option>
            <option value="zh-CN">
              {DoubleClickDefineOption(i18n(multilaanguage.dictionaryChineseOn), "zh-CN")}
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
