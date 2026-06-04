# MTEngines

TypeScript library for Machine Translation (MT) using various engines. It provides a unified interface to interact with different MT and AI services, allowing you to translate text between multiple languages.

Interface `MTEngine` provides these methods:

```typescript
    getName(): string;
    getShortName(): string;
    getSourceLanguages(): Promise<string[]>;
    getTargetLanguages(): Promise<string[]>;
    setSourceLanguage(lang: string): void;
    getSourceLanguage(): string;
    setTargetLanguage(lang: string): void;
    getTargetLanguage(): string;
    translate(source: string): Promise<string>;
    getMTMatch(source: string): Promise<MTMatch>;
    handlesTags(): boolean;
    fixesMatches(): boolean;
    fixMatch(originalSource: XMLElement, matchSource: XMLElement, matchTarget: XMLElement): Promise<MTMatch>;
    fixesTags(): boolean;
    fixTags(source: XMLElement, target: XMLElement): Promise<XMLElement>;
```

All supported engines implement the `MTEngine` interface. Methods `fixMatch()` and `fixTags()` are only implemented by AI-based engines (`QwenTranslator`, `ChatGPTTranslator`, `AnthropicTranslator`, `MistralTranslator` and `GeminiTranslator`), all other engines throw an error when they are called.

`Ollama` engine allows you to work with locally instaled models served by the [Ollama](https://ollama.com/) platform without sending source text to external servers.

When creating an instance of `OllamaTranslator`, you must pass the URL where Ollama is running (usually `http://localhost:11434`), the name of the model to use and optionally a `think` boolean parameter that when set to `true` can speed up the translation process.

## Supported Engines

- Alibaba Qwen Models
- Anthropic Claude
- DeepL (Free and Pro)
- Google Cloud Translation
- Google Gemini
- Microsoft Azure Translator Text
- Mistral AI
- ModernMT
- Ollama
- OpenAI ChatGPT

## Installation

```bash
npm install mtengines
```

> **Note**: The library requires Node.js 24 or newer to ensure the built-in `fetch` API is available at runtime.

## Examples

```typescript
import { GoogleTranslator } from "mtengines";

class TestGoogle {

    constructor() {
        let translator: GoogleTranslator = new GoogleTranslator('yourApiKey');
        translator.setSourceLanguage("en");
        translator.setTargetLanguage("ja");
         translator.translate("Hello World").then((result: string) => {
            console.log(result);
        }, (error: any) => {
            console.error(error);
        });
    }
}

new TestGoogle();
```

`QwenTranslator`, `ChatGPTTranslator`, `AnthropicTranslator`, `MistralTranslator`, `GeminiTranslator` and `Ollama` need that you either indicate the model to use when creating the instance, or set the model to use by calling the `setModel()` method like in the following example:

```typescript
import { ChatGPTTranslator } from "mtengines";
class TestChatGPT {

    constructor() {
        let translator: ChatGPTTranslator = new ChatGPTTranslator('yourApiKey');
        translator.setModel("gpt-4");
        translator.setSourceLanguage("en");
        translator.setTargetLanguage("fr");
         translator.translate("Hello World").then((result: string) => {
            console.log(result);
        }, (error: any) => {
            console.error(error);
        });
    }
}

new TestChatGPT();
```

You can get a list of models supported by `QwenTranslator`, `ChatGPTTranslator`, `AnthropicTranslator`, `MistralTranslator`, `OllamaTranslator` and `GeminiTranslator` by calling the `getAvailableModels()` method:

```typescript
import { AnthropicTranslator } from "mtengines";
class TestModels {   

    constructor() {
        let claude: AnthropicTranslator = new AnthropicTranslator('yourApiKey');
        claude.getAvailableModels().then((models: string[][]) => {
            console.log('Claude available models:');
            console.log(models);
        }, (error) => {
            console.error(error);
        });
    }
}
new TestModels();
```

Expected output:

``` text
Claude available models:
[
  [ 'claude-opus-4-5-20251101', 'Claude Opus 4.5' ],
  [ 'claude-haiku-4-5-20251001', 'Claude Haiku 4.5' ],
  [ 'claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5' ],
  [ 'claude-opus-4-1-20250805', 'Claude Opus 4.1' ],
  [ 'claude-opus-4-20250514', 'Claude Opus 4' ],
  [ 'claude-sonnet-4-20250514', 'Claude Sonnet 4' ],
  [ 'claude-3-7-sonnet-20250219', 'Claude Sonnet 3.7' ],
  [ 'claude-3-5-haiku-20241022', 'Claude Haiku 3.5' ],
  [ 'claude-3-haiku-20240307', 'Claude Haiku 3' ],
  [ 'claude-3-opus-20240229', 'Claude Opus 3' ]
]
```

*Note*: Only `QwenTranslator` has a set of preconfigured models that depend on the selected working `region`, for all other AI-based engines the list of available models is retrieved at runtime.
