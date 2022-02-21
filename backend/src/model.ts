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
        public cookie: TrackedCookie,
        public ressourceURLs: Context[],
    ) { }

}

export type TrackedCookie = {

    name: string,
    domain: string,
    path: string,
    httpOnly: boolean,
    hostOnly: boolean,
    secure: boolean,
    session: boolean,
    timestamp: number,
    expirationDate: number | null,
    duration: number | null
}