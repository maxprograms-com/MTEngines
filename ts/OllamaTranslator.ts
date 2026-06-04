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

import { XMLAttribute, XMLElement } from 'typesxml';
import { MTEngine } from './MTEngine.js';
import { MTMatch } from './MTMatch.js';
import { MTUtils } from './MTUtils.js';

const CONNECT_TIMEOUT_MS = 5000;
const CHAT_TIMEOUT_MS = 300000;

export class OllamaTranslator implements MTEngine {

    baseUrl: string;
    model: string;
    think: boolean = false;
    srcLang: string = '';
    tgtLang: string = '';

    constructor(baseUrl: string, model: string, think?: boolean) {
        this.baseUrl = baseUrl;
        this.model = model;
        if (think !== undefined) {
            this.think = think;
        }
    }

    setThink(think: boolean): void {
        this.think = think;
    }

    private fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(timer));
    }

    private chat(messages: Array<{ role: string, content: string }>): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.fetchWithTimeout(this.baseUrl + '/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    stream: false,
                    think: this.think
                })
            }, CHAT_TIMEOUT_MS).then((response: Response) => {
                if (!response.ok) {
                    throw new Error('Ollama request failed: ' + response.status + ' ' + response.statusText);
                }
                return response.json();
            }).then((data: any) => {
                resolve(data.message.content);
            }).catch((error: Error) => {
                if (error.name === 'AbortError') {
                    reject(new Error('Request timed out after ' + (CHAT_TIMEOUT_MS / 1000) + 's.'));
                    return;
                }
                reject(error);
            });
        });
    }

    getMTMatch(source: XMLElement, terms: { source: string; target: string; }[]): Promise<MTMatch> {
        let prompt: string = MTUtils.generatePrompt(source, this.srcLang, this.tgtLang, terms);
        let messages: Array<{ role: string, content: string }> = [
            { role: 'system', content: MTUtils.getRole(this.srcLang, this.tgtLang) },
            { role: 'user', content: prompt }
        ];
        return new Promise<MTMatch>((resolve, reject) => {
            this.chat(messages).then((translation: string) => {
                if (translation.startsWith('```xml') && translation.endsWith('```')) {
                    translation = translation.substring(6, translation.length - 3).trim();
                }
                if (translation.startsWith('```') && translation.endsWith('```')) {
                    translation = translation.substring(3, translation.length - 3).trim();
                }
                if (!translation.trim().startsWith('<target') && !translation.trim().endsWith('</target>')) {
                    translation = '<target>' + translation + '</target>';
                }
                let target: XMLElement = MTUtils.toXMLElement(translation);
                let space: XMLAttribute | undefined = source.getAttribute('xml:space');
                if (space) {
                    target.setAttribute(space);
                }
                resolve(new MTMatch(source, target, this.getShortName()));
            }).catch((error: Error) => {
                reject(error);
            });
        });
    }

    handlesTags(): boolean {
        return true;
    }

    fixesMatches(): boolean {
        return true;
    }

    fixMatch(originalSource: XMLElement, matchSource: XMLElement, matchTarget: XMLElement): Promise<MTMatch> {
        let prompt: string = MTUtils.fixMatchPrompt(originalSource, matchSource, matchTarget);
        let messages: Array<{ role: string, content: string }> = [
            { role: 'system', content: MTUtils.getRole(this.srcLang, this.tgtLang) },
            { role: 'user', content: prompt }
        ];
        return new Promise<MTMatch>((resolve, reject) => {
            this.chat(messages).then((translation: string) => {
                if (translation.startsWith('\n\n')) {
                    translation = translation.substring(2);
                }
                while (translation.startsWith('"') && translation.endsWith('"')) {
                    translation = translation.substring(1, translation.length - 1);
                }
                if (translation.startsWith('```xml') && translation.endsWith('```')) {
                    translation = translation.substring(6, translation.length - 3).trim();
                }
                if (!translation.trim().startsWith('<target') && !translation.trim().endsWith('</target>')) {
                    translation = '<target>' + translation + '</target>';
                }
                let target: XMLElement = MTUtils.toXMLElement(translation);
                resolve(new MTMatch(originalSource, target, this.getShortName()));
            }).catch((error: Error) => {
                reject(error);
            });
        });
    }

    fixesTags(): boolean {
        return true;
    }

    fixTags(source: XMLElement, target: XMLElement): Promise<XMLElement> {
        let prompt: string = MTUtils.fixTagsPrompt(source, target, this.srcLang, this.tgtLang);
        let messages: Array<{ role: string, content: string }> = [
            { role: 'system', content: MTUtils.getRole(this.srcLang, this.tgtLang) },
            { role: 'user', content: prompt }
        ];
        return new Promise<XMLElement>((resolve, reject) => {
            this.chat(messages).then((translation: string) => {
                if (translation.startsWith('\n\n')) {
                    translation = translation.substring(2);
                }
                while (translation.startsWith('"') && translation.endsWith('"')) {
                    translation = translation.substring(1, translation.length - 1);
                }
                if (translation.startsWith('```xml') && translation.endsWith('```')) {
                    translation = translation.substring(6, translation.length - 3).trim();
                }
                if (!translation.trim().startsWith('<target') && !translation.trim().endsWith('</target>')) {
                    translation = '<target>' + translation + '</target>';
                }
                let element: XMLElement = MTUtils.toXMLElement(translation);
                resolve(element);
            }).catch((error: Error) => {
                reject(error);
            });
        });
    }

    getName(): string {
        return 'Ollama';
    }

    getShortName(): string {
        return 'Ollama';
    }

    getSourceLanguages(): Promise<string[]> {
        return MTUtils.getLanguages();
    }

    getTargetLanguages(): Promise<string[]> {
        return MTUtils.getLanguages();
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
        let prompt: string = MTUtils.translatePropmt(source, this.srcLang, this.tgtLang);
        let messages: Array<{ role: string, content: string }> = [
            { role: 'system', content: MTUtils.getRole(this.srcLang, this.tgtLang) },
            { role: 'user', content: prompt }
        ];
        return new Promise<string>((resolve, reject) => {
            this.chat(messages).then((translation: string) => {
                if (translation.startsWith('\n\n')) {
                    translation = translation.substring(2);
                }
                while (translation.startsWith('"') && translation.endsWith('"')) {
                    translation = translation.substring(1, translation.length - 1);
                }
                if (source.startsWith('"') && source.endsWith('"')) {
                    translation = '"' + translation + '"';
                }
                resolve(translation);
            }).catch((error: Error) => {
                reject(error);
            });
        });
    }

    async getAvailableModels(): Promise<string[][]> {
        let response: Response;
        try {
            response = await this.fetchWithTimeout(this.baseUrl + '/api/tags', {}, CONNECT_TIMEOUT_MS);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                throw new Error('Ollama did not respond within ' + (CONNECT_TIMEOUT_MS / 1000) + 's. Is it running?');
            }
            throw new Error('Cannot reach Ollama at ' + this.baseUrl + '. Is it running?\n  ' + err.message);
        }
        if (!response.ok) {
            throw new Error('Ollama returned status ' + response.status);
        }
        const data: any = await response.json();
        return (data.models as Array<{ name: string }>).map((m: { name: string }) => [m.name, m.name]);
    }
}
