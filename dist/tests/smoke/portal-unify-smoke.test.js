import { describe, expect, it } from "vitest";
import { PortalMessageList } from "@/components/portals/PortalMessageList";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";
describe("portal unified components", () => {
    it("renders unified message list element tree", () => {
        const element = PortalMessageList({
            rows: [
                {
                    id: "m1",
                    title: "Welcome thread",
                    preview: "Preview body",
                    subtitle: "inbox",
                    updatedAt: new Date().toISOString(),
                },
            ],
            maxRows: 5,
        });
        expect(element).toBeTruthy();
    });
    it("renders unified schedule list element tree", () => {
        const element = PortalScheduleList({
            rows: [
                {
                    id: "s1",
                    blockDate: new Date().toISOString().slice(0, 10),
                    startTime: "10:00:00",
                    endTime: "10:30:00",
                    status: "scheduled",
                    room: "A",
                    blockType: "lesson",
                },
            ],
            maxRows: 5,
        });
        expect(element).toBeTruthy();
    });
});
