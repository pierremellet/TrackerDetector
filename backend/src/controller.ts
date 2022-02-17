import { Application, Application_URL, Application_Version, CookieCategory, CookieTemplate, Domain, PrismaClient, UnknowURL } from "@prisma/client";
import { bufferTime, concatMap, filter, groupBy, map, mergeAll, mergeMap, Observable, of, switchMap, tap, windowCount, windowTime, } from "rxjs";
import rootLogger from "./logger";
import { AppConfig } from "./utils";
import { PartialReport, TrackedCookie } from "./model";
import topics from "./topics";
import ApplicationController from "./controllers/application.controller";
import { URL } from "url";
import DomainController from "./controllers/domain.controller";
import ApplicationVersionController from "./controllers/applicationVersion.controller";
import CookieCategoryController from "./controllers/cookieCategory.controller";

export class TrackerFinderController {
    private _log = rootLogger(this.config).getChildLogger({
        name: "TrackerFinderController",
    });

    public _URLPrefixIndex: (Application_URL & {
        applicationVersion: Application_Version | null;
        domain: Domain;
    })[] = [];

    public applicationController: ApplicationController;
    public domainController: DomainController;
    public applicationVersionController: ApplicationVersionController;
    public cookieCategoryController: CookieCategoryController;

    constructor(private config: AppConfig, private prisma: PrismaClient) {

        this.applicationController = new ApplicationController(config, prisma);
        this.domainController = new DomainController(config, prisma);
        this.applicationVersionController = new ApplicationVersionController(config, prisma);
        this.cookieCategoryController = new CookieCategoryController(config, prisma);

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
            var duration = drift.cookie.expirationDate ?  drift.cookie.expirationDate - ((new Date().getTime())/1000) : 0;
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
                        duration: duration,
                        pageURL: drift.url,
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
                }).catch(() => { });
        });
    }


    private handleIncommingSanitizedReports() {
        topics.sanitizedPartialReportSubject
            .pipe(
                map(this.findRelevantVersion),
                concatMap((report) => report)
            )
            .subscribe(async (reportAndVersion) => {
                const versions = reportAndVersion.versions;
                if (!versions || versions.length == 0) {
                    this._log.warn(
                        `No version found for report URL ${reportAndVersion.report.pageURL}`
                    );
                    topics.unknowURLSubject.next(reportAndVersion.report.pageURL);
                } else {
                    versions.forEach((version) => {
                        reportAndVersion.report.cookies.forEach((cookieInstance) => {
                            var match = false;
                            version.cookieTemplates.forEach(
                                (cookieTemplate: CookieTemplate) => {
                                    const regex = new RegExp(cookieTemplate.nameRegex);
                                    if (cookieInstance.cookie.name.match(regex)) {
                                        match = true;
                                    }
                                }
                            );
                            if (!match) {
                                topics.driftCookiesSubject.next({
                                    appId: version.application.id,
                                    versionId: version.id,
                                    url: reportAndVersion.report.pageURL,
                                    cookie: cookieInstance.cookie,
                                });
                            }
                        });
                    });
                }
            });
    }


    private b64reportToJSON(b64: any): PartialReport {
        const buffer = Buffer.from(b64, 'base64');
        const stringReport = buffer.toString('ascii');
        return JSON.parse(stringReport);
    }

    private handleIncommingReports(config: AppConfig) {
        topics.rawPartialReportSubject
            .pipe(
                map(this.b64reportToJSON),
                tap((report) =>
                    this._log.debug(`Partial report received for URL : ${report.pageURL}`)
                ),
                map(this.removeURLParams)
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

    /*
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
    }*/

    private removeURLParams(report: PartialReport): PartialReport {
        const paramStartPost = report.pageURL.indexOf("?");
        if (paramStartPost !== -1) {
            report.pageURL = report.pageURL.substring(0, paramStartPost);
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


    async linkUnknowURLToVersion(versionId: number, unknowURLId: number): Promise<Application_URL | null> {

        const unknowURL = await this.prisma.unknowURL.findUnique({
            where: {
                id: unknowURLId
            }
        });

        if (unknowURL) {
            const url = new URL(unknowURL.url);
            const domain = await this.prisma.domain.findFirst({
                where: {
                    name: url.hostname
                }
            });

            if (domain) {
                return await this.prisma.application_URL.create({
                    data: {
                        created: new Date(),
                        path: url.pathname,
                        type: "EXACT",
                        domain: {
                            connect: {
                                id: domain.id
                            }
                        },
                        applicationVersion: {
                            connect: {
                                id: versionId
                            }
                        }
                    }
                });
            }

        }

        return null;
    }


    public findRelevantVersion = async (report: PartialReport): Promise<{
        versions: (Application_Version & {
            cookieTemplates: CookieTemplate[];
            application: Application;
        })[];
        report: PartialReport;
    }> => {
        const matchVersionIds = this._URLPrefixIndex
            .filter((u) => u.applicationVersionId !== null)
            .filter((u) => {
                const matchURL = `https://${u.domain.name}${u.path}`;
                if (u.type === "PREFIX") {
                    return report.pageURL.startsWith(matchURL);
                }
                if (u.type === "EXACT") {
                    return report.pageURL === matchURL;
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

        return {
            versions: matchVersions,
            report: report,
        }
    }
}
