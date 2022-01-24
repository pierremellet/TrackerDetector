import { BehaviorSubject, Subject } from "rxjs";
import { DriftCookie, PartialReport } from "./model";

export default {

    // Topic for received cookie pending processing
    rawPartialReportSubject: new Subject<PartialReport>(),

    // Topic for patial reports ready for processing
    sanitizedPartialReportSubject: new Subject<PartialReport>(),

    // Topic for observed cookies that doesn't correspond to the expectations of the version
    driftCookiesSubject: new Subject<DriftCookie>(),


    /**
     * Topic triggerd when application version is updated
     */
    applicationVersionChanged: new BehaviorSubject(null)
}