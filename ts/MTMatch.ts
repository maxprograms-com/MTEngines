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
import { randomUUID } from "node:crypto";
import { XMLElement } from "typesxml";
import type { Match as SharedMatch, MatchType } from "typesmatch";

export class MTMatch implements SharedMatch {

    id: string;
    source: XMLElement;
    target: XMLElement;
    origin: string;
    type: MatchType;
    similarity: number;
    properties: Record<string, string>;

    constructor(source: XMLElement, target: XMLElement, origin: string) {
        this.id = randomUUID();
        this.source = source;
        this.target = target;
        this.origin = origin;
        this.type = 'mt';
        this.similarity = 0;
        this.properties = {};
    }

    toJSON(): any {
        return {
            id: this.id,
            source: this.source.toString(),
            target: this.target.toString(),
            origin: this.origin,
            type: this.type,
            similarity: this.similarity,
            properties: this.properties
        }
    }
}
