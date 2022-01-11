import { Application, Application_URL, Application_Version, CookieInstance, CookieTemplate, Prisma, prisma, PrismaClient } from "@prisma/client";
import { concatMap, groupBy, map, mergeAll, reduce, Subject, tap, windowCount } from "rxjs";
import rootLogger from "./logger"
import { PubSub } from 'graphql-subscriptions';
export class TrackerFinderController {


    private _log = rootLogger.getChildLogger({ name: "TrackerFinderController" });


    // Topic for received cookie pending processing
    public rawPartialReportSubject = new Subject<PartialReport>();

    // Topic for patial reports ready for processing
    private sanitizedPartialReportSubject = new Subject<PartialReport>();


    private driftedCookiesSubject = new Subject<{
        versionId: number,
        cookie: CookieInstance
    }>();

    constructor(private pubsub: PubSub, private prisma: PrismaClient) {
        // Process incomming cookies
        this.rawPartialReportSubject.pipe(
            tap(report => this._log.info(`Partial report received for URL : ${report.url}`)),
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
            map(async report => {
                const reportAndVersions: {
                    versions: Promise<any[]>,
                    report: PartialReport
                } = {
                    'versions': this.prisma.application_Version.findMany({
                        where: {
                            urls: {
                                some: {
                                    url: report.url
                                }
                            }
                        },
                        include: {
                            cookies:true
                        }
                    }),
                    'report': report
                }
                return reportAndVersions;
            }),
            concatMap(report => report),

            tap(async reportAndVersion => {
                const versions = await reportAndVersion.versions;
                if (!versions || versions.length) {
                    this._log.error(`No version founded for report URL ${reportAndVersion.report.url}`);
                }
                versions.forEach(version => {
                    reportAndVersion.report.cookies.forEach(cookieInstance => {
                        var match = false;
                        version.cookies.forEach((cookieTemplate: CookieTemplate ) => {
                            var regex = new RegExp(cookieTemplate.nameRegex);
                            if (cookieInstance.name.match(regex)) {
                                match = true;
                            }
                        });
                        if (!match) {
                            this.driftedCookiesSubject.next({
                                versionId: version.id,
                                cookie: cookieInstance
                            })
                        }
                    })
                });



            })
        ).subscribe();

        this.driftedCookiesSubject.subscribe(drift => {
            this._log.warn(`Found cookie ${drift.cookie.name} not defined in version : ${drift.versionId}}`);
            this.pubsub.publish('COOKIE_NOT_EXIST_' + drift.versionId, { appVerCookieNotFounded: drift.cookie });
        })
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

 
    async createApplicationVersion(appId: number, versionName: string): Promise<Application_Version> {
        return await this.prisma.application_Version.create({
            data: {
                name: versionName,
                application: {
                    connect: {
                        id: appId
                    }
                }
            }
        });
    }
    async updateApplicationVersion(version: any): Promise<Application_Version> {
        const urlsData = version.urls.filter((u: any) => !u.disabled).map((u: any) => {
            return {
                where: {
                    id: parseInt(u.id, 10) || 0
                },
                create: {
                    url: u.url
                },
                update: {
                    url: u.url
                }
            }
        });

        const urlsToDelete = version.urls.filter((u: any) => u.disabled).map((u: any) => {
            return {
                id: parseInt(u.id, 10)
            }
        });

        const cookiesData = version.cookies.filter((u: any) => !u.disabled).map((u: any) => {
            return {
                where: {
                    id: parseInt(u.id, 10) || 0
                },
                create: {
                    nameRegex: u.nameRegex,
                    httpOnly: u.httpOnly
                },
                update: {
                    nameRegex: u.nameRegex,
                    httpOnly: u.httpOnly

                }
            }
        });

        const cookiesToDelete = version.cookies.filter((u: any) => u.disabled).map((u: any) => {
            return {
                id: parseInt(u.id, 10)
            }
        });

        return this.prisma.application_Version.update({
            data: {
                name: version.name,
                enable: version.enable,
                urls: {
                    upsert: urlsData,
                    deleteMany: urlsToDelete
                },
                cookies: {
                    upsert: cookiesData,
                    deleteMany: cookiesToDelete
                }
            },
            where: {
                id: version.id
            }
        });
    }

    async createApplication(appName: string): Promise<Application> {
        return this.prisma.application.create({
            data: {
                name: appName
            }
        })
    }

    async deleteApplication(appId: number): Promise<Application> {
        await this.prisma.application_Version.deleteMany({
            where: {
                applicationId: appId
            }
        });
        return this.prisma.application.delete({
            where: {
                id: appId
            }
        })
    };

    async updateApplication(appId: number, name: string): Promise<Application> {
        return this.prisma.application.update({
            where: {
                id: appId
            },
            data: {
                name: name
            }
        });
    }

    public getApplication(id: number): Promise<Application | null> {
        this._log.debug(`Get application ${id}`);
        return this.prisma.application.findUnique({
            where: {
                'id': id
            },
            include: {
                versions : true
            }
        });
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


