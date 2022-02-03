import { Application, Application_URL, Application_Version, CookieCategory, CookieTemplate, Domain, PrismaClient, UnknowURL } from "@prisma/client";
import { bufferTime, concatMap, filter, groupBy, map, mergeAll, mergeMap, Observable, of, switchMap, tap, windowCount, windowTime, } from "rxjs";
import rootLogger from "./logger";
import { AppConfig } from "./utils";
import { PartialReport, TrackedCookie } from "./model";
import topics from "./topics";
import ApplicationController from "./controllers/application.controller";
import { URL } from "url";

export class TrackerFinderController {
    private _log = rootLogger(this.config).getChildLogger({
        name: "TrackerFinderController",
    });

    public _URLPrefixIndex: (Application_URL & {
        applicationVersion: Application_Version | null;
        domain: Domain;
    })[] = [];

    public applicationController: ApplicationController;

    constructor(private config: AppConfig, private prisma: PrismaClient) {

        this.applicationController = new ApplicationController(config, prisma);

        // Index version URL prefix
        this.updateURLIndexOnApplicationVersionUpdate();

        // Process incomming partial report in order to group and aggregate reports by URL
        this.handleIncommingReports(config);

        // Process sanitized reports to find if report match with a version
        this.handleIncommingSanitizedReports();

        // Process cookie doesn't match any application requirement
        this.handleDriftCookies();

        this.handleUnknowURL();
    }

    private handleUnknowURL() {
        topics.unknowURLSubject
            .pipe(
                windowTime(1000),
                switchMap(u => u)
            )
            .subscribe(async (u) => {
                this._log.debug(`Incomming unknow url: ${u}`);
                try {
                    await this.prisma.unknowURL.create({
                        data: {
                            url: u,
                            created: new Date()
                        }
                    })
                } catch (err) { }
            });
    }

    private handleDriftCookies() {
        topics.driftCookiesSubject.subscribe((drift) => {
            this.prisma.cookieInstance
                .create({
                    data: {
                        domain: drift.cookie.domain,
                        hostOnly: drift.cookie.hostOnly,
                        httpOnly: drift.cookie.httpOnly,
                        name: drift.cookie.name,
                        path: drift.cookie.path,
                        secure: drift.cookie.secure,
                        session: drift.cookie.session,
                        timestamp: new Date().getTime(),
                        url: drift.url,
                        applicationVersion: {
                            connect: {
                                id: drift.versionId,
                            },
                        },
                    },
                })
                .then((cookie) => {
                    this._log.debug(
                        `Save drift Cookie for version id(${drift.versionId}), with id(${cookie.id}) and name(${cookie.name})`
                    );
                }).catch(()=>{});
        });
    }

    private handleIncommingSanitizedReports() {
        topics.sanitizedPartialReportSubject
            .pipe(
                map(async (report) => {
                    var matchVersionIds = this._URLPrefixIndex
                        .filter((u) => u.applicationVersionId !== null)
                        .filter((u) => {
                            const matchURL = `https://${u.domain.name}${u.path}`;
                            if (u.type === "PREFIX") {
                                return report.url.startsWith(matchURL);
                            }
                            if (u.type === "EXACT") {
                                return report.url === matchURL;
                            }
                            return false;
                        })
                        .map((v) => v.applicationVersionId as number);

                    // Expand matchVersionIds with data from db
                    const matchVersions = await this.prisma.application_Version.findMany({
                        where: {
                            id: {
                                in: matchVersionIds,
                            },
                        },
                        include: {
                            cookieTemplates: true,
                            application: true,
                        },
                    });

                    const reportAndVersions: {
                        versions: (Application_Version & {
                            cookieTemplates: CookieTemplate[];
                            application: Application;
                        })[];
                        report: PartialReport;
                    } = {
                        versions: matchVersions,
                        report: report,
                    };
                    return reportAndVersions;
                }),
                concatMap((report) => report)
            )
            .subscribe(async (reportAndVersion) => {
                const versions = reportAndVersion.versions;
                if (!versions || versions.length == 0) {
                    this._log.warn(
                        `No version found for report URL ${reportAndVersion.report.url}`
                    );
                    topics.unknowURLSubject.next(reportAndVersion.report.url);
                } else {
                    versions.forEach((version) => {
                        reportAndVersion.report.cookies.forEach((cookieInstance) => {
                            var match = false;
                            version.cookieTemplates.forEach(
                                (cookieTemplate: CookieTemplate) => {
                                    const regex = new RegExp(cookieTemplate.nameRegex);
                                    if (cookieInstance.name.match(regex)) {
                                        match = true;
                                    }
                                }
                            );
                            if (!match) {
                                topics.driftCookiesSubject.next({
                                    appId: version.application.id,
                                    versionId: version.id,
                                    url: reportAndVersion.report.url,
                                    cookie: cookieInstance,
                                });
                            }
                        });
                    });
                }
            });
    }

    private handleIncommingReports(config: AppConfig) {
        topics.rawPartialReportSubject
            .pipe(
                tap((report) =>
                    this._log.debug(`Partial report received for URL : ${report.url}`)
                ),
                map((report) => this.removeURLParams(report)),
                windowCount(config.input_buffer),
                map((win) =>
                    win.pipe(
                        groupBy((report) => report.url),
                        mergeMap((group) => {
                            return of(new PartialReport(group.key, this.dedupCookies(group)));
                        })
                    )
                ),
                mergeAll()
            )
            .subscribe((sanitizedReport) => {
                topics.sanitizedPartialReportSubject.next(sanitizedReport);
            });
    }

    private updateURLIndexOnApplicationVersionUpdate() {
        topics.applicationVersionChanged.subscribe(async () => {
            this._URLPrefixIndex = [];

            const urls = await this.prisma.application_URL.findMany({
                where: {
                    applicationVersion: {
                        isNot: null,
                    },
                },
                include: {
                    applicationVersion: true,
                    domain: true,
                },
            });

            this._URLPrefixIndex = urls;
            this._log.debug(`Version cache updated`);
        });
    }

    public deleteCookieInstancesForVersion(versionID: number): Promise<number> {
        return this.prisma.cookieInstance
            .deleteMany({
                where: {
                    applicationVersion: {
                        id: versionID,
                    },
                },
            })
            .then((res) => res.count);
    }

    private dedupCookies(group: Observable<PartialReport>): TrackedCookie[] {
        const cookies: TrackedCookie[] = [];
        group.forEach((report) => {
            report.cookies.forEach((cookie) => {
                if (cookies.findIndex((c) => c.name === cookie.name) === -1) {
                    cookies.push(cookie);
                }
            });
        });
        return cookies;
    }

    private removeURLParams(report: PartialReport): PartialReport {
        const paramStartPost = report.url.indexOf("?");
        if (paramStartPost !== -1) {
            report.url = report.url.substring(0, paramStartPost);
        }
        return report;
    }

    async convertCookieInstanceToTemplate(versionId: number, categoryId: number, cookieInstanceId: number) {
        const cookieInstance = await this.prisma.cookieInstance.findUnique({
            where: {
                id: cookieInstanceId,
            },
        });

        if (cookieInstance) {
            return this.prisma.cookieTemplate.create({
                data: {
                    category: {
                        connect: {
                            id: categoryId,
                        },
                    },
                    nameRegex: cookieInstance.name,
                    domain: cookieInstance.domain,
                    hostOnly: cookieInstance.hostOnly,
                    path: cookieInstance.path,
                    secure: cookieInstance.secure,
                    httpOnly: cookieInstance.httpOnly,
                    session: cookieInstance.session,
                    applicationVersion: {
                        connect: {
                            id: versionId,
                        },
                    },
                },
            });
        }
        return null;
    }

    async createApplicationVersion(appId: number, versionName: string): Promise<Application_Version> {
        return await this.prisma.application_Version.create({
            data: {
                name: versionName,
                application: {
                    connect: {
                        id: appId,
                    },
                },
            },
        });
    }

    async linkUnknowURLToVersion(versionId: number, unknowURLId: number): Promise<Application_URL|null> {

        const unknowURL = await this.prisma.unknowURL.findUnique({
            where : {
                id : unknowURLId
            }
        });

        if(unknowURL){
            const url = new URL(unknowURL.url);
            const domain = await this.prisma.domain.findFirst({
                where : {
                    name : url.hostname
                }
            });

            if(domain){
               return await this.prisma.application_URL.create({
                    data : {
                        created : new Date(),
                        path : url.pathname,
                        type : "EXACT",
                        domain : {
                            connect : {
                                id : domain.id
                            }
                        },
                        applicationVersion : {
                            connect : {
                                id : versionId
                            }
                        }
                    }
                });
            }

        }
 
        return null;
    }

    async updateApplicationVersion(version: any): Promise<Application_Version> {

        const urlsData = version.urls
            .filter((u: any) => !u.disabled)
            .map((u: any) => {
                return {
                    where: {
                        id: parseInt(u.id, 10) || 0,
                    },
                    create: {
                        path: u.path,
                        type: u.type,
                        domainId: u.domainId,
                        created: new Date(),
                    },
                    update: {
                        path: u.path,
                        domainId: u.domainId,
                        type: u.type,
                    },
                };
            });

        const urlsToDelete = version.urls
            .filter((u: any) => u.disabled)
            .map((u: any) => {
                return {
                    id: parseInt(u.id, 10),
                };
            });

        const cookiesData = version.cookies
            .filter((u: any) => !u.disabled)
            .map((u: any) => {
                const data = {
                    nameRegex: u.nameRegex,
                    httpOnly: u.httpOnly,
                    domain: u.domain,
                    path: u.path,
                    hostOnly: u.hostOnly,
                    secure: u.secure,
                    session: u.session,
                    categoryId: u.category
                };
                return {
                    where: {
                        id: parseInt(u.id, 10) || 0,
                    },
                    create: data,
                    update: data,
                };
            });

        const cookiesToDelete = version.cookies
            .filter((u: any) => u.disabled)
            .map((u: any) => {
                return {
                    id: parseInt(u.id, 10),
                };
            });

        return this.prisma.application_Version.update({
            data: {
                name: version.name,
                enable: version.enable,
                urls: {
                    upsert: urlsData,
                    deleteMany: urlsToDelete,
                },
                cookieTemplates: {
                    upsert: cookiesData,
                    deleteMany: cookiesToDelete,
                },
            },
            where: {
                id: parseInt(version.id, 10),
            },
        }).then(u => {
            topics.applicationVersionChanged.next(u.id);
            return u;
        });
    }

    createCookieCategory(name: string) {
        if (name === undefined || name.length === 0) {
            throw new Error("name can't be null");
        }
        return this.prisma.cookieCategory.create({
            data: {
                name,
                enable: true
            },
        });
    }

    createDomain(domainName: string) {
        if (domainName === undefined || domainName.length === 0) {
            throw new Error("domainName can't be null");
        }
        return this.prisma.domain.create({
            data: {
                name: domainName,
                enable: true,
            },
        });
    }

    public updateDomain(domaineId: number, domainName: string, domainEnable: boolean) {
        const data: any = {};
        if (domainName !== undefined) {
            data.name = domainName;
        }
        if (domainEnable !== undefined) {
            data.enable = domainEnable;
        }
        return this.prisma.domain.update({
            where: {
                id: domaineId,
            },
            data,
        });
    }

    public async updateCookieCategory(cookieCategoryId: number, cookieCategoryName: string, cookieCategoryEnable: string): Promise<CookieCategory> {
        const data: any = {};
        if (cookieCategoryName !== undefined) {
            data.name = cookieCategoryName;
        }
        if (cookieCategoryEnable !== undefined) {
            data.enable = cookieCategoryEnable;
        }
        const cookie = await this.prisma.cookieCategory.update({
            where: {
                id: cookieCategoryId,
            },
            data,
        });

        return cookie;
    }
}
