export class PartialReport {

    constructor(
        public pageURL: string,
        public cookies: CookieContextsInstance[] = [],
        public contexts: Context[] = []
    ) { }

}

export type Context = {
    id: number
    url: string
    initiator: string
}

export type CookieContextsInstance = {
    cookie: TrackedCookie,
    contextIds: number[]
}

export enum URLType {
    EXACT = "EXACT",
    PREFIX = "PREFIX"
}

export class DriftCookie {
    constructor(
        public appId: number,
        public versionId: number,
        public url: string,
        public cookie: TrackedCookie
    ) { }

}

export class TrackedCookie {

    constructor(
        public name: string,
        public domain: string,
        public path: string,
        public httpOnly: boolean,
        public hostOnly: boolean,
        public secure: boolean,
        public session: boolean,
        public timestamp: number,
        public expirationDate: number | null,
        public duration: number | null) {

    }
}