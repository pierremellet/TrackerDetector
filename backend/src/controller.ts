import { Application, Application_URL, Application_Version, CookieInstance, CookieTemplate, Prisma, prisma, PrismaClient } from "@prisma/client";
import { concatMap, groupBy, interval, map, mergeAll, mergeMap, Observable, of, reduce, Subject, tap, windowCount } from "rxjs";
import rootLogger from "./logger"
import { AppConfig } from "./utils";
import { PartialReport, TrackedCookie } from "./model";
import topics from './topics';

export class TrackerFinderController {

    private _log = rootLogger(this.config).getChildLogger({ name: "TrackerFinderController" });

    public _URLPrefixIndex: (Application_URL & { applicationVersion: Application_Version; })[] = [];

    constructor(private config: AppConfig, private prisma: PrismaClient) {

        // Index version URL prefix
        this.updateURLIndexOnApplicationVersionUpdate();

        // Process incomming partial report in order to group and aggregate reports by URL 
        this.handleIncommingReports(config);

        // Process sanitized reports to find if report match with a version
        this.handleIncommingSanitizedReports();

        // Process cookie doesn't match any application requirement
        this.handleDriftCookies();
    }


    private handleDriftCookies() {
        topics.driftCookiesSubject
            .subscribe(drift => {
                this.prisma.cookieInstance.create({
                    data: {
                        domain: drift.cookie.domain,
                        hostOnly: drift.cookie.hostOnly,
                        httpOnly: drift.cookie.httpOnly,
                        name: drift.cookie.name,
                        path: drift.cookie.path,
                        secure: drift.cookie.secure,
                        session: drift.cookie.session,
                        timestamp: (new Date()).getTime(),
                        url: drift.url,
                        applicationVersion: {
                            connect: {
                                id: drift.versionId
                            }
                        }
                    }
                }).then(cookie => {
                    this._log.info(`Save drift Cookie for version id(${drift.versionId}), with id(${cookie.id}) and name(${cookie.name})`);
                }).catch(err => this._log.error(err));
            });
    }

    private handleIncommingSanitizedReports() {
        topics.sanitizedPartialReportSubject.pipe(
            map(async (report) => {

                var matchVersionIds = this._URLPrefixIndex.filter(u => {
                    if (u.type === "PREFIX") {
                        return report.url.startsWith(u.url);
                    }
                    if (u.type === "EXACT") {
                        return report.url === u.url;
                    }
                    return false;
                }).map(v => v.applicationVersionId);

                const matchVersions = await this.prisma.application_Version.findMany({
                    where: {
                        id: {
                            in: matchVersionIds
                        }
                    },
                    include: {
                        cookieTemplates: true,
                        application: true
                    }
                });

                const reportAndVersions: {
                    versions: (Application_Version & {
                        cookieTemplates: CookieTemplate[];
                        application: Application;
                    })[];
                    report: PartialReport;
                } = {
                    'versions': matchVersions,
                    'report': report
                };
                return reportAndVersions;
            }),
            concatMap(report => report)
        ).subscribe(async (reportAndVersion) => {
            const versions = reportAndVersion.versions;
            if (!versions || versions.length == 0) {
                this._log.error(`No version found for report URL ${reportAndVersion.report.url}`);
            } else {
                versions.forEach(version => {
                    reportAndVersion.report.cookies.forEach(cookieInstance => {
                        var match = false;
                        version.cookieTemplates.forEach((cookieTemplate: CookieTemplate) => {
                            const regex = new RegExp(cookieTemplate.nameRegex);
                            if (cookieInstance.name.match(regex)) {
                                match = true;
                            }
                        });
                        if (!match) {
                            topics.driftCookiesSubject.next({
                                appId: version.application.id,
                                versionId: version.id,
                                url: reportAndVersion.report.url,
                                cookie: cookieInstance
                            });
                        }
                    });
                });
            }
        });
    }

    private handleIncommingReports(config: AppConfig) {
        topics.rawPartialReportSubject.pipe(
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
            topics.sanitizedPartialReportSubject.next(sanitizedReport);
        });
    }

    private updateURLIndexOnApplicationVersionUpdate() {
        topics.applicationVersionChanged.subscribe(async () => {
            this._URLPrefixIndex = [];

            const urls = await this.prisma.application_URL.findMany({
                include: {
                    applicationVersion: true
                }
            });

            this._URLPrefixIndex = urls;
            this._log.debug(`Version cache updated`);
        });
    }

    public deleteCookieInstancesForVersion(versionID: number): Promise<number> {
        return this.prisma.cookieInstance.deleteMany({
            where: {
                applicationVersion: {
                    id: versionID
                }
            }
        }).then(res => res.count);
    }


    private dedupCookies(group: Observable<PartialReport>): TrackedCookie[] {
        const cookies: TrackedCookie[] = [];
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

    async convertCookieInstanceToTemplate(versionId: number, cookieInstanceId: number) {
        const cookieInstance = await this.prisma.cookieInstance.findUnique({
            where: {
                id: cookieInstanceId
            }
        })

        if (cookieInstance) {
            return this.prisma.cookieTemplate.create({
                data: {
                    nameRegex: cookieInstance.name,
                    domain: cookieInstance.domain,
                    hostOnly: cookieInstance.hostOnly,
                    path: cookieInstance.path,
                    secure: cookieInstance.secure,
                    httpOnly: cookieInstance.httpOnly,
                    session: cookieInstance.session,
                    applicationVersion: {
                        connect: {
                            id: versionId
                        }
                    }
                }
            })
        }
        return null;
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
                    url: u.url,
                    type: u.type
                },
                update: {
                    url: u.url,
                    type: u.type
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



