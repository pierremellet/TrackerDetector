import {CookieInstance } from "@prisma/client";

 
export class PartialReport {
    constructor(public url: string, public cookies: CookieInstance[]) { }
}
