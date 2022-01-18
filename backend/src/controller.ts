import { Application, Application_Version, CookieInstance, CookieTemplate, Prisma, prisma, PrismaClient } from "@prisma/client";
import { concatMap, groupBy, map, mergeAll, mergeMap, Observable, of, reduce, Subject, tap, windowCount } from "rxjs";
import rootLogger from "./logger"
import { AppConfig } from "./utils";
import { PartialReport } from "./model";
export class TrackerFinderController {


    private _log = rootLogger(this.config).getChildLogger({ name: "TrackerFinderController" });

    /**
     * Topic for received cookie pending processing
     */
    public rawPartialReportSubject = new Subject<PartialReport>();

    // Topic for patial reports ready for processing
    public sanitizedPartialReportSubject = new Subject<PartialReport>();

    // Topic for observed cookies that doesn't correspond to the expectations of the version
    public driftedCookiesSubject = new Subject<{
        appId: number,
        versionId: number,
        cookie: CookieInstance
    }>();

    constructor(private config: AppConfig, private prisma: PrismaClient) {

        // Process incomming partial report in order to group and aggregate reports by URL 
        this.rawPartialReportSubject.pipe(
            tap(report => this._log.debug(`Partial report received for URL : ${report.url}`)),
            map(report => this.removeURLParams(report)),
            windowCount(config.input_buffer),
            map(win => win.pipe(
                groupBy(report => report.url),
                mergeMap(group => {
                    return of(new PartialReport(group.key, this.dedupCookies(group)));
                })
            )),
            mergeAll()
        ).subscribe(sanitizedReport => {
            this.sanitizedPartialReportSubject.next(sanitizedReport);
        })

        // Process sanitized reports to find if report match with a version
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
                            cookieTemplates: true,
                            application: true
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
                    this._log.error(`No version found for report URL ${reportAndVersion.report.url}`);
                }
                versions.forEach(version => {
                    reportAndVersion.report.cookies.forEach(cookieInstance => {
                        var match = false;
                        version.cookies.forEach((cookieTemplate: CookieTemplate) => {
                            var regex = new RegExp(cookieTemplate.nameRegex);
                            if (cookieInstance.name.match(regex)) {
                                match = true;
                            }
                        });
                        if (!match) {
                            this.driftedCookiesSubject.next({
                                appId: version.application.id,
                                versionId: version.id,
                                cookie: cookieInstance
                            })
                        }
                    })
                });



            })
        ).subscribe();

     
    }



    private dedupCookies(group: Observable<PartialReport>): CookieInstance[] {
        const cookies: CookieInstance[] = [];
        group.forEach(report => {
            report.cookies.forEach(cookie => {
                if (cookies.findIndex(c => c.name === cookie.name) === -1) {
                    cookies.push(cookie);
                }
            });
        });
        return cookies;
    }

    private accDeduplicate(acc: CookieInstance[], val: CookieInstance): CookieInstance[] {
        if (acc.findIndex(c => c.name === val.name) === -1) {
            acc.push(val);
        }
        return acc;
    }



    private removeURLParams(report: PartialReport): PartialReport {
        const paramStartPost = report.url.indexOf('?');
        if (paramStartPost !== -1) {
            report.url = report.url.substring(0, paramStartPost);
        }
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
            const data = {
                nameRegex: u.nameRegex,
                httpOnly: u.httpOnly,
                domain: u.domain,
                path: u.path,
                hostOnly: u.hostOnly,
                secure: u.secure,
                session: u.session
            };
            return {
                where: {
                    id: parseInt(u.id, 10) || 0
                },
                create: data,
                update: data
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
                cookieTemplates: {
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
                versions: true
            }
        });
    }

}



