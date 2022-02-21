import { Application, Application_URL, Application_Version, CookieTemplate, Domain, PrismaClient } from "@prisma/client";
import { bufferTime, concatMap, map, Observable, switchMap, tap, windowTime, } from "rxjs";
import rootLogger from "./logger";
import { AppConfig, b64reportToJSON, removeURLParams } from "./utils";
import { PartialReport } from "./model";
import topics from "./topics";
import { URL } from "url";
import config from "./config";
import { findCookieInformationByName } from "./extCookieDatabase";

export class TrackerFinderController {
    private _log = rootLogger(config).getChildLogger({
        name: "TrackerFinderController",
    });

    public _URLPrefixIndex: (Application_URL & {
        applicationVersion: Application_Version | null;
        domain: Domain;
    })[] = [];


    constructor(private prisma: PrismaClient) {

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
                bufferTime(config.input_buffer),
                map(this.deduplicateURLs),
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

    private deduplicateURLs(deduplicate:  string[]): string[] {
        return deduplicate;
    }

    private handleDriftCookies() {
        topics.driftCookiesSubject.subscribe((drift) => {
            var duration = drift.cookie.expirationDate ? drift.cookie.expirationDate - ((new Date().getTime()) / 1000) : 0;
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
                        ressourceURLs: drift.ressourceURLs.map(x => JSON.stringify(x)),
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
                                const urls = cookieInstance.contextIds.map(id => reportAndVersion.report.contexts.filter(c => c.id == id)).flatMap(x => x);
                                topics.driftCookiesSubject.next({
                                    appId: version.application.id,
                                    versionId: version.id,
                                    url: reportAndVersion.report.pageURL,
                                    cookie: cookieInstance.cookie,
                                    ressourceURLs: urls
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
                map(b64reportToJSON),
                tap((report) =>
                    this._log.debug(`Partial report received for URL : ${report.pageURL}`)
                ),
                map(removeURLParams),
                bufferTime(config.input_buffer),
                map(this.deduplicatePartialReports),
                switchMap(x => x)
            )
            .subscribe((sanitizedReport) => {
                topics.sanitizedPartialReportSubject.next(sanitizedReport);
            });
    }

    private deduplicatePartialReports(deduplicatePartialReports: PartialReport[]): PartialReport[] {
        return deduplicatePartialReports;
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

    async convertCookieInstanceToTemplate(versionId: number, categoryId: number, cookieInstanceId: number) {
        const cookieInstance = await this.prisma.cookieInstance.findUnique({
            where: {
                id: cookieInstanceId,
            },
        });

        if (cookieInstance) {

            const cookieInformation = await findCookieInformationByName(cookieInstance.name);

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
                    description: cookieInformation?.Description,
                    expiration: cookieInformation?.["Retention period"],
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
