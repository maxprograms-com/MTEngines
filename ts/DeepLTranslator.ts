/*******************************************************************************
 * Copyright (c) 2023-2026 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

import { LanguageUtils } from "typesbcp47";
import { XMLAttribute, XMLElement } from "typesxml";
import { Constants } from "./Constants.js";
import { MTEngine } from "./MTEngine.js";
import { MTMatch } from "./MTMatch.js";
import { MTUtils } from "./MTUtils.js";

export class DeepLTranslator implements MTEngine {

    srcLang: string = '';
    tgtLang: string = '';
    apiKey: string;
    proPlan: boolean;
    translateUrl: string;
    languageUrl: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.proPlan = !apiKey.endsWith(':fx');
        this.translateUrl = this.proPlan ? "https://api.deepl.com/v1/translate" : "https://api-free.deepl.com/v2/translate";
        this.languageUrl = this.proPlan ? "https://api.deepl.com/v1/languages?type="
            : "https://api-free.deepl.com/v2/languages?type=";
    }

    getName(): string {
        return 'DeepL API';
    }

    getShortName(): string {
        return 'DeepL';
    }

    getSourceLanguages(): Promise<string[]> {
        return this.getLanguages('source');
    }

    getTargetLanguages(): Promise<string[]> {
        return this.getLanguages('target');
    }

    setSourceLanguage(lang: string): void {
        this.srcLang = lang;
    }

    getSourceLanguage(): string {
        return this.srcLang;
    }

    setTargetLanguage(lang: string): void {
        this.tgtLang = lang;
    }

    getTargetLanguage(): string {
        return this.tgtLang;
    }

    translate(source: string): Promise<string> {
        if (this.srcLang === '' || this.tgtLang === '') {
            return Promise.reject(new Error('Source and Target languages must be set before translation.'));
        }
        let params: string = "&text=" + encodeURIComponent(source)
            + "&source_lang=" + this.srcLang.toUpperCase()
            + "&target_lang=" + this.tgtLang.toUpperCase()
            + "&tag_handling=xml&split_sentences=nonewlines";
        return new Promise<string>((resolve, reject) => {
            fetch(this.translateUrl, {
                method: 'POST',
                headers: [
                    ['Authorization', 'DeepL-Auth-Key ' + this.apiKey],
                    ['User-Agent', Constants.TOOL + ' ' + Constants.VERSION],
                    ['Content-Type', 'application/x-www-form-urlencoded'],
                    ['Accept', 'application/json'],
                    ['Content-Length', params.length.toString()]
                ],
                body: params
            }).then(async (response: Response) => {
                if (response.ok) {
                    let json: any = await response.json();
                    resolve(json.translations[0].text);
                } else {
                    let json: any = await response.json().catch(() => null);
                    let message: string = json?.message ?? response.statusText;
                    reject(new Error(message));
                }
            }).catch((error: Error) => {
                reject(error);
            });
        });
    }

    getLanguages(type: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            fetch(this.languageUrl + type, {
                method: 'GET',
                headers: [
                    ['Authorization', 'DeepL-Auth-Key ' + this.apiKey]
                ]
            }).then(async (response: Response) => {
                if (response.status === 200) {
                    let json: any = await response.json();
                    let languages: string[] = [];
                    for (let language of json) {
                        if (language.language) {
                            const code = LanguageUtils.normalizeCode(language.language);
                            if (code) {
                                languages.push(code);
                            }
                        }
                    }
                    resolve(languages);
                } else {
                    let json: any = await response.json().catch(() => null);
                    let message: string = json?.message ?? (response.status + ': ' + response.statusText);
                    reject(new Error(message));
                }
            }).catch((error: Error) => {
                reject(error);
            });
        });
    }

    getMTMatch(source: XMLElement, terms: { source: string, target: string }[]): Promise<MTMatch> {
        return new Promise<MTMatch>((resolve, reject) => {
            let content: string = MTUtils.getElementContent(source);
            this.translate(content).then((translation: string) => {
                try {
                    let target: XMLElement = MTUtils.toXMLElement('<target>' + translation + '</target>');
                    let space: XMLAttribute | undefined = source.getAttribute('xml:space');
                    if (space) {
                        target.setAttribute(space);
                    }
                    resolve(new MTMatch(source, target, this.getShortName()));
                } catch (error) {
                    if (error instanceof Error) {
                        reject(error);
                        return;
                    }
                    reject(error as Error);
                }
            }).catch((error: Error) => {
                reject(error);
            });
        });
    }

    handlesTags(): boolean {
        return true;
    }

    fixesMatches(): boolean {
        return false;
    }

    fixMatch(originalSource: XMLElement, matchSource: XMLElement, matchTarget: XMLElement): Promise<MTMatch> {
        return Promise.reject(new Error('fixMatch not implemented for DeepL API'));
    }

    fixesTags(): boolean {
        return false;
    }

    fixTags(source: XMLElement, target: XMLElement): Promise<XMLElement> {
        return Promise.reject(new Error('fixTags not implemented for DeepL API'));
    }

}