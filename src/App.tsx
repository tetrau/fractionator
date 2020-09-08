import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import lemmaMapping from './lemma_mapping.json'
import wordFrequency from './word_frequency.json'

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
    this.lemmaMapping = lemmaMapping

  }
  lemmatize(tokens: string[]): string[] {
    return tokens.map(token => {
      if (this.lemmaMapping.hasOwnProperty(token)) {
        return this.lemmaMapping[token]
      }
      else {
        return token
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
        return [word, Math.min(...catagories.filter(c => c > this.wordFrequency[word])).toString()]
      } else {
        return [word, "Unknown"]
      }
    })
    const result: Distillate[] = (catagories.map(c => c.toString()).concat(["Unknown"])).map(
      c => {
        const r: { category: string, distillate: string[] } = { category: c, distillate: [] }
        return r
      }
    )
    unGroupedDistillates.forEach(distillate => {
      const c = result.find(r => r.category === distillate[1])
      if (c !== undefined && !c.distillate.includes(distillate[0])) {
        c.distillate.push(distillate[0])
      }
    })
    return result
  }
}

interface GeneralAppComponentProps {
  setStage: (stage: AppStage) => void;
  setInput: (input: string) => void
}

const RequestForInput: React.FunctionComponent<GeneralAppComponentProps> = ({ setStage, setInput }) =>
  <div className="row">
    <div className="col-12 d-flex justify-content-center">
      <button type="button" className="btn btn-outline-primary" onClick={() => setStage("TextInputReady")}>Paste Text</button>
      <button type="button" className="btn btn-outline-primary">Choose File</button>
    </div>
  </div>

const TextInputReady: React.FunctionComponent<GeneralAppComponentProps> = ({ setStage, setInput }) =>
  <React.Fragment>
    <div className="row">
      <div className="col-12">
        <textarea className="form-control" onChange={e => setInput(e.target.value)} ></textarea>
      </div>
    </div>
    <div className="row">
      <div className="col-12 d-flex justify-content-center">
        <button type="button" className="btn btn-outline-primary" onClick={() => setStage("TextInputReady")}>Choose File</button>
        <button type="button" className="btn btn-outline-primary" onClick={() => setStage("ResultDisplay")}>Fractionate</button>
      </div>
    </div>
  </React.Fragment>

interface ResultDisplayProps {
  setStage: (stage: AppStage) => void;
  setInput: (input: string) => void
  getInput: () => string;

}

const ResultDisplay: React.FunctionComponent<ResultDisplayProps> = ({ setStage, getInput, setInput }) => {
  const tokens = new Tokenizer().tokenize(getInput())
  const lemmas = new Lemmatizer().lemmatize(tokens)
  const distillates = new Fractionator().fractionate(lemmas)
  const display = distillates.flatMap(
    ({ category, distillate }) => {
      if (distillate.length === 0) {
        return []
      } else {
        return <React.Fragment>
          <div className="separator">{category}</div>
          <p className="text-center">{distillate.join(" ")}</p>
        </React.Fragment>
      }
    }
  ).reverse()
  return <React.Fragment>
    <div className="row">
      <div className="col-12">
        {display}
      </div>
    </div>
    <div className="row">
      <div className="col-12 d-flex justify-content-center">
        <button type="button" className="btn btn-outline-primary" onClick={() => { setStage("TextInputReady"); setInput("") }}>Paste Text</button>
        <button type="button" className="btn btn-outline-primary">Choose File</button>
      </div>
    </div>
  </React.Fragment>
}

type AppStage = "RequestForInput" | "TextInputReady" | "ResultDisplay"

interface AppState {
  stage: AppStage;
  input: string
}

class App extends React.Component<{}, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      stage: "RequestForInput",
      input: ""
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
        {this.state.stage === "TextInputReady" && <TextInputReady setStage={this.setStage} setInput={this.setInput} />}
        {this.state.stage === "ResultDisplay" && <ResultDisplay setStage={this.setStage} getInput={this.getInput} setInput={this.setInput} />}
      </div>
    </div>
  }
}

export default App;
