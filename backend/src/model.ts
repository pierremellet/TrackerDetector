export class PartialReport {

    constructor(
        public url: string,
        public cookies: TrackedCookie[] = []
    ) { }

}

export class DriftCookie {
    constructor( 
        public appId: number,
        public versionId: number,
        public  url: string,
        public cookie: TrackedCookie 
    ){}

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
        public duration: number | null) {

    }
}