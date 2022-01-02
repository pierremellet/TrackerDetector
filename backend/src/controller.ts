import { Application, Application_URL, CookieInstance, prisma } from "@prisma/client";
import { StorageService } from "./storage";
import { concatMap, filter, from, groupBy, map, mergeAll, mergeMap, of, reduce, Subject, switchMap, tap, windowCount } from "rxjs";
import rootLogger from "./logger"

export class TrackerFinderController {


    private _log = rootLogger.getChildLogger({ name: "TrackerFinderController" });


    // Topic for received cookie pending processing
    public rawPartialReportSubject = new Subject<PartialReport>();

    // Topic for patial reports ready for processing
    private sanitizedPartialReportSubject = new Subject<PartialReport>();

 
    constructor(private storageService: StorageService) {
        // Process incomming cookies
        this.rawPartialReportSubject.pipe(
            map(report => this.removeURLParams(report)),
            windowCount(3),
            map(win => win.pipe(
                groupBy(report => report.url),
                map(grp => grp.pipe(
                    concatMap(g => g.cookies),
                    map(c => {
                        c.timestamp = new Date().getTime();
                        return c;
                    }),
                    reduce(this.accDeduplicate, []),
                    map(c => new PartialReport(c[0].url, c))
                )),
                mergeAll()
            )),
            mergeAll()
        ).subscribe(sanitizedReport => {
            this.sanitizedPartialReportSubject.next(sanitizedReport);
        })

        // Process sanitized reports
        this.sanitizedPartialReportSubject.pipe(
            concatMap(report => from(report.cookies))
        ).subscribe(async c => {
            const cookie = await this.storageService.getCookieByNameAndURL(c.name, c.url);
            if (!cookie) {
                const createdCookie = await this.storageService.saveCookie(c);
                this._log.debug(`Cookie ${createdCookie.name} Created with id ${createdCookie.id}`);

            }
        });

 
    }

  

    private accDeduplicate(acc: CookieInstance[], val: CookieInstance): CookieInstance[] {
        if (acc.findIndex(c => c.name === val.name) === -1) {
            acc.push(val);
        }
        return acc;
    }

    public handleDiscoveredCookies(report: PartialReport): any {
        report.cookies.forEach(c => {
            c.url = report.url; // Define URL from wich cookie is discovered
        });
        this.rawPartialReportSubject.next(report);
    }


    private removeURLParams(report: PartialReport): PartialReport {
        const paramStartPost = report.url.indexOf('?');
        if (paramStartPost !== -1) {
            report.url = report.url.substring(0, paramStartPost);
        }
        report.cookies.map(c => c.url = report.url);
        return report;
    }
 


}


export class ApplicationReport {
    constructor(public application: Application, public urls: ApplicationURLReport[]) { }
}

export class ApplicationURLReport {
    constructor(public applicationURL: Application_URL, public cookies: CookieInstance[]) { }
}

export class PartialReport {
    constructor(public url: string, public cookies: CookieInstance[]) { }
}


