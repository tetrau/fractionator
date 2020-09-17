export class Dictionary {
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

export interface DictionaryLibraryStatus {
  selected: string | null;
  dictionaryStatus: {
    [lang: string]: "Ready" | "Downloading" | "Error" | "NotDownloaded"
  }
}

export class DictionaryLibrary {
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
