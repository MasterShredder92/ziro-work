function payloadOf(action) {
    return action.payload && typeof action.payload === "object" ? action.payload : {};
}
function asString(v) {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}
function asRecord(v) {
    return v && typeof v === "object" ? v : {};
}
function pathId(pathname, re) {
    var _a;
    const m = pathname.match(re);
    return (_a = m === null || m === void 0 ? void 0 : m[1]) !== null && _a !== void 0 ? _a : null;
}
function nextIsoMinutes(minsFromNow) {
    const d = new Date(Date.now() + minsFromNow * 60000);
    return d.toISOString();
}
function resolveActionKind(action, payload) {
    const explicit = asString(payload.domainAction);
    if (explicit)
        return explicit;
    const skill = asString(payload.skill);
    switch (skill) {
        case "scheduleFollowup":
            return "schedule.create";
        case "detectConflicts":
            return "schedule.edit";
        case "qualifyLead":
            return "crm.student.update";
        case "messageTeacher":
        case "messageFamily":
        case "messageStudent":
            return "messages.send";
        case "shareLinkMgmt":
            return "files.share.create";
        case "fileVersioning":
            return "files.permissions.update";
        case "invoiceAgingReport":
        case "listOutstanding":
            return "billing.payment.record";
        default:
            return null;
    }
}
export function resolveDomainActionSpec(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19;
    if (input.action.intent !== "custom")
        return null;
    const payload = payloadOf(input.action);
    const kind = resolveActionKind(input.action, payload);
    if (!kind)
        return null;
    const now = Date.now();
    switch (kind) {
        case "schedule.create": {
            const title = (_a = asString(payload.title)) !== null && _a !== void 0 ? _a : "Agent Follow-up Session";
            return {
                kind,
                detail: "Create schedule event",
                request: {
                    method: "POST",
                    path: "/api/schedule/events",
                    body: {
                        title,
                        kind: (_b = asString(payload.kind)) !== null && _b !== void 0 ? _b : "lesson",
                        status: (_c = asString(payload.status)) !== null && _c !== void 0 ? _c : "scheduled",
                        startTime: (_d = asString(payload.startTime)) !== null && _d !== void 0 ? _d : new Date(now + 60 * 60000).toISOString(),
                        endTime: (_e = asString(payload.endTime)) !== null && _e !== void 0 ? _e : new Date(now + 105 * 60000).toISOString(),
                        teacherId: asString(payload.teacherId),
                        studentId: asString(payload.studentId),
                        familyId: asString(payload.familyId),
                        roomId: asString(payload.roomId),
                        locationId: asString(payload.locationId),
                        notes: (_f = asString(payload.notes)) !== null && _f !== void 0 ? _f : "Created by AgentOS scheduling action.",
                    },
                },
            };
        }
        case "schedule.edit": {
            const eventId = (_h = (_g = asString(payload.eventId)) !== null && _g !== void 0 ? _g : pathId(input.pathname, /^\/schedule\/events\/([^/]+)$/)) !== null && _h !== void 0 ? _h : pathId(input.pathname, /^\/scheduling\/events\/([^/]+)$/);
            if (!eventId)
                return null;
            const patch = asRecord(payload.patch);
            const body = Object.keys(patch).length
                ? patch
                : {
                    notes: (_j = asString(payload.notes)) !== null && _j !== void 0 ? _j : "Updated by AgentOS scheduling action.",
                    status: (_k = asString(payload.status)) !== null && _k !== void 0 ? _k : "scheduled",
                };
            return {
                kind,
                detail: `Update schedule event ${eventId}`,
                request: {
                    method: "PATCH",
                    path: `/api/schedule/events/${eventId}`,
                    body,
                },
            };
        }
        case "crm.student.update": {
            const id = (_o = (_m = (_l = asString(payload.studentId)) !== null && _l !== void 0 ? _l : pathId(input.pathname, /^\/crm\/students\/([^/]+)/)) !== null && _m !== void 0 ? _m : pathId(input.pathname, /^\/students\/([^/]+)/)) !== null && _o !== void 0 ? _o : pathId(input.pathname, /^\/student\/([^/]+)/);
            if (!id)
                return null;
            const patch = asRecord(payload.patch);
            const body = Object.keys(patch).length
                ? patch
                : {
                    notes: (_p = asString(payload.notes)) !== null && _p !== void 0 ? _p : "Updated from AgentOS CRM action.",
                };
            return {
                kind,
                detail: `Update student ${id}`,
                request: { method: "PATCH", path: `/api/crm/students/${id}`, body },
            };
        }
        case "crm.family.update": {
            const id = (_s = (_r = (_q = asString(payload.familyId)) !== null && _q !== void 0 ? _q : pathId(input.pathname, /^\/crm\/families\/([^/]+)/)) !== null && _r !== void 0 ? _r : pathId(input.pathname, /^\/families\/([^/]+)/)) !== null && _s !== void 0 ? _s : pathId(input.pathname, /^\/family\/([^/]+)/);
            if (!id)
                return null;
            const patch = asRecord(payload.patch);
            const body = Object.keys(patch).length
                ? patch
                : {
                    scheduling_notes: (_t = asString(payload.scheduling_notes)) !== null && _t !== void 0 ? _t : "Updated from AgentOS CRM action.",
                };
            return {
                kind,
                detail: `Update family ${id}`,
                request: { method: "PATCH", path: `/api/crm/families/${id}`, body },
            };
        }
        case "crm.teacher.update": {
            const id = (_w = (_v = (_u = asString(payload.teacherId)) !== null && _u !== void 0 ? _u : pathId(input.pathname, /^\/crm\/teachers\/([^/]+)/)) !== null && _v !== void 0 ? _v : pathId(input.pathname, /^\/teachers\/([^/]+)/)) !== null && _w !== void 0 ? _w : pathId(input.pathname, /^\/teacher\/([^/]+)/);
            if (!id)
                return null;
            const patch = asRecord(payload.patch);
            const body = Object.keys(patch).length
                ? patch
                : {
                    director_notes: (_x = asString(payload.director_notes)) !== null && _x !== void 0 ? _x : "Updated from AgentOS CRM action.",
                };
            return {
                kind,
                detail: `Update teacher ${id}`,
                request: { method: "PATCH", path: `/api/crm/teachers/${id}`, body },
            };
        }
        case "messages.send": {
            const threadId = (_y = asString(payload.threadId)) !== null && _y !== void 0 ? _y : pathId(input.pathname, /^\/messages\/threads\/([^/]+)/);
            if (threadId) {
                return {
                    kind,
                    detail: `Send thread message ${threadId}`,
                    request: {
                        method: "POST",
                        path: `/api/messages/threads/${threadId}/messages`,
                        body: {
                            body: (_z = asString(payload.body)) !== null && _z !== void 0 ? _z : "AgentOS follow-up message.",
                            channelType: (_0 = asString(payload.channelType)) !== null && _0 !== void 0 ? _0 : "in_app",
                        },
                    },
                };
            }
            const participantIds = Array.isArray(payload.participantIds)
                ? payload.participantIds.filter((v) => typeof v === "string" && v.length > 0)
                : [];
            if (participantIds.length === 0)
                return null;
            return {
                kind,
                detail: "Create thread and send message",
                request: {
                    method: "POST",
                    path: "/api/messages/threads",
                    body: {
                        subject: (_1 = asString(payload.subject)) !== null && _1 !== void 0 ? _1 : "AgentOS message thread",
                        channelType: (_2 = asString(payload.channelType)) !== null && _2 !== void 0 ? _2 : "in_app",
                        participantIds,
                        contextType: asString(payload.contextType),
                        contextId: asString(payload.contextId),
                    },
                },
                followup: {
                    method: "POST",
                    pathTemplate: "/api/messages/threads/{threadId}/messages",
                    body: {
                        body: (_3 = asString(payload.body)) !== null && _3 !== void 0 ? _3 : "AgentOS follow-up message.",
                        channelType: (_4 = asString(payload.channelType)) !== null && _4 !== void 0 ? _4 : "in_app",
                    },
                },
            };
        }
        case "messages.thread.action": {
            const threadId = (_5 = asString(payload.threadId)) !== null && _5 !== void 0 ? _5 : pathId(input.pathname, /^\/messages\/threads\/([^/]+)/);
            if (!threadId)
                return null;
            return {
                kind,
                detail: `Thread action for ${threadId}`,
                request: {
                    method: "PATCH",
                    path: `/api/messages/threads/${threadId}`,
                    body: {
                        action: (_6 = asString(payload.threadAction)) !== null && _6 !== void 0 ? _6 : "markRead",
                        profileId: asString(payload.profileId),
                        participantId: asString(payload.participantId),
                    },
                },
            };
        }
        case "files.share.create": {
            const fileId = (_7 = asString(payload.fileId)) !== null && _7 !== void 0 ? _7 : pathId(input.pathname, /^\/files\/([^/]+)$/);
            const folderId = (_8 = asString(payload.folderId)) !== null && _8 !== void 0 ? _8 : pathId(input.pathname, /^\/files\/folder\/([^/]+)/);
            if (!fileId && !folderId)
                return null;
            return {
                kind,
                detail: "Create file share link",
                request: {
                    method: "POST",
                    path: "/api/files/share",
                    body: {
                        fileId,
                        folderId,
                        allowDownload: payload.allowDownload === true,
                        expiresInSeconds: typeof payload.expiresInSeconds === "number" ? payload.expiresInSeconds : 7 * 24 * 3600,
                        metadata: {
                            source: "agent-os",
                            createdAt: new Date().toISOString(),
                        },
                    },
                },
            };
        }
        case "files.permissions.update": {
            const fileId = (_9 = asString(payload.fileId)) !== null && _9 !== void 0 ? _9 : pathId(input.pathname, /^\/files\/([^/]+)$/);
            if (!fileId)
                return null;
            return {
                kind,
                detail: `Update file permissions for ${fileId}`,
                request: {
                    method: "PATCH",
                    path: `/api/files/${fileId}`,
                    body: {
                        visibility: (_10 = asString(payload.visibility)) !== null && _10 !== void 0 ? _10 : "tenant",
                        metadata: {
                            permissionUpdatedBy: "agent-os",
                            permissionUpdatedAt: new Date().toISOString(),
                        },
                        acl: Array.isArray(payload.acl) ? payload.acl : undefined,
                    },
                },
            };
        }
        case "billing.invoice.create": {
            return {
                kind,
                detail: "Create billing invoice",
                request: {
                    method: "POST",
                    path: "/api/billing/invoices",
                    body: {
                        family_id: asString(payload.familyId),
                        student_id: asString(payload.studentId),
                        description: (_11 = asString(payload.description)) !== null && _11 !== void 0 ? _11 : "AgentOS generated invoice",
                        due_at: (_12 = asString(payload.dueAt)) !== null && _12 !== void 0 ? _12 : nextIsoMinutes(7 * 24 * 60),
                        lineItems: [
                            {
                                description: (_13 = asString(payload.lineDescription)) !== null && _13 !== void 0 ? _13 : "Service charge",
                                quantity: typeof payload.quantity === "number" ? payload.quantity : 1,
                                unit_amount_cents: typeof payload.unitAmountCents === "number" ? payload.unitAmountCents : 7500,
                            },
                        ],
                    },
                },
            };
        }
        case "billing.payment.record": {
            const invoiceId = (_15 = (_14 = asString(payload.invoiceId)) !== null && _14 !== void 0 ? _14 : pathId(input.pathname, /^\/billing\/invoices\/([^/]+)/)) !== null && _15 !== void 0 ? _15 : pathId(input.pathname, /^\/invoices\/([^/]+)/);
            if (!invoiceId)
                return null;
            return {
                kind,
                detail: `Record invoice payment ${invoiceId}`,
                request: {
                    method: "POST",
                    path: `/api/billing/invoices/${invoiceId}/pay`,
                    body: {
                        amount_cents: typeof payload.amountCents === "number" ? payload.amountCents : 7500,
                        method: (_16 = asString(payload.method)) !== null && _16 !== void 0 ? _16 : "manual",
                        notes: (_17 = asString(payload.notes)) !== null && _17 !== void 0 ? _17 : "Recorded by AgentOS billing action.",
                        paid_at: (_18 = asString(payload.paidAt)) !== null && _18 !== void 0 ? _18 : new Date().toISOString(),
                        family_id: asString(payload.familyId),
                        student_id: asString(payload.studentId),
                    },
                },
            };
        }
        case "automation.workflow.trigger": {
            const workflowId = (_19 = asString(payload.workflowId)) !== null && _19 !== void 0 ? _19 : pathId(input.pathname, /^\/automation\/workflows\/([^/]+)/);
            if (!workflowId)
                return null;
            return {
                kind,
                detail: `Trigger workflow ${workflowId}`,
                request: {
                    method: "POST",
                    path: "/api/automation/run",
                    body: {
                        workflowId,
                        tenantId: input.tenantId,
                        payload: asRecord(payload.workflowPayload),
                        triggeredBy: "agent-os",
                    },
                },
            };
        }
        default:
            return null;
    }
}
