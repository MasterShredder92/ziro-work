import "server-only";
import { getServiceClient } from "@/lib/supabase";
import { listScheduleRooms } from "@data/scheduleRooms";
import { fetchLocationHours } from "@/lib/schedule/locationHours";
export async function loadWindowedScheduleData(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const { tenantId, locationId, start, end, includeRooms = false, includeStudents = true, } = input;
    const supabase = getServiceClient();
    let locationRow = null;
    const { data: byIsActive, error: byIsActiveError } = await supabase
        .from("locations")
        .select("id")
        .eq("id", locationId)
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .maybeSingle();
    if (!byIsActiveError && (byIsActive === null || byIsActive === void 0 ? void 0 : byIsActive.id)) {
        locationRow = { id: byIsActive.id };
    }
    if (!locationRow) {
        const { data: byActive, error: byActiveError } = await supabase
            .from("locations")
            .select("id")
            .eq("id", locationId)
            .eq("tenant_id", tenantId)
            .eq("active", true)
            .maybeSingle();
        if (!byActiveError && (byActive === null || byActive === void 0 ? void 0 : byActive.id)) {
            locationRow = { id: byActive.id };
        }
    }
    if (!locationRow) {
        return {
            teachers: [],
            students: [],
            families: [],
            availability: [],
            blocks: [],
            rooms: [],
            locationHours: {},
        };
    }
    const teacherIdsPromise = supabase
        .from("teacher_locations")
        .select("teacher_id")
        .eq("location_id", locationId);
    const studentsPromise = includeStudents
        ? supabase
            .from("students")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("location_id", locationId)
            .is("deactivated_at", null)
            .order("first_name", { ascending: true })
            .order("last_name", { ascending: true })
            .limit(1500)
        : Promise.resolve({ data: [], error: null });
    const availabilityPromise = supabase
        .from("teacher_availability")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("location_id", locationId)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(2000);
    const blocksPromise = supabase
        .from("schedule_blocks")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("location_id", locationId)
        .gte("block_date", start)
        .lte("block_date", end)
        .order("block_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(4000);
    const [teacherIdsRes, studentsRes, availabilityRes, blocksRes, rooms, locationHours] = await Promise.all([
        teacherIdsPromise,
        studentsPromise,
        availabilityPromise,
        blocksPromise,
        includeRooms ? listScheduleRooms(tenantId, { location_id: locationId, is_active: true }) : Promise.resolve([]),
        fetchLocationHours(locationId),
    ]);
    const teachersLocationError = teacherIdsRes.error;
    const studentsError = studentsRes.error;
    const availabilityError = availabilityRes.error;
    const blocksError = blocksRes.error;
    const teacherIds = Array.from(new Set(((_a = teacherIdsRes.data) !== null && _a !== void 0 ? _a : [])
        .map((row) => row.teacher_id)
        .filter((id) => typeof id === "string" && id.length > 0)));
    let teachers = [];
    if (teacherIds.length > 0) {
        const teachersRes = await supabase
            .from("teachers")
            .select("*")
            .eq("tenant_id", tenantId)
            .in("id", teacherIds)
            .eq("is_active", true)
            .order("first_name", { ascending: true })
            .order("last_name", { ascending: true });
        if (teachersRes.error) {
            teachers = [];
        }
        else {
            teachers = ((_b = teachersRes.data) !== null && _b !== void 0 ? _b : []);
        }
    }
    else {
        const teachersRes = await supabase
            .from("teachers")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("is_active", true)
            .order("first_name", { ascending: true })
            .order("last_name", { ascending: true })
            .limit(1500);
        if (teachersRes.error) {
            teachers = [];
        }
        else {
            teachers = ((_c = teachersRes.data) !== null && _c !== void 0 ? _c : []);
        }
    }
    let students = studentsError ? [] : ((_d = studentsRes.data) !== null && _d !== void 0 ? _d : []);
    if (includeStudents && students.length === 0) {
        const fallbackStudentsRes = await supabase
            .from("students")
            .select("*")
            .eq("tenant_id", tenantId)
            .is("deactivated_at", null)
            .order("first_name", { ascending: true })
            .order("last_name", { ascending: true })
            .limit(1500);
        students = fallbackStudentsRes.error ? [] : ((_e = fallbackStudentsRes.data) !== null && _e !== void 0 ? _e : []);
    }
    let families = [];
    if (students.length > 0) {
        const familyIds = Array.from(new Set(students
            .map((student) => student.family_id)
            .filter((id) => typeof id === "string" && id.length > 0)));
        if (familyIds.length > 0) {
            const familiesRes = await supabase
                .from("families")
                .select("*")
                .eq("tenant_id", tenantId)
                .in("id", familyIds)
                .limit(1500);
            families = familiesRes.error ? [] : ((_f = familiesRes.data) !== null && _f !== void 0 ? _f : []);
        }
    }
    if (teachersLocationError || availabilityError || blocksError) {
        console.warn("[schedule/windowedData] partial fallback", {
            teacherLocationsError: (_g = teachersLocationError === null || teachersLocationError === void 0 ? void 0 : teachersLocationError.message) !== null && _g !== void 0 ? _g : null,
            availabilityError: (_h = availabilityError === null || availabilityError === void 0 ? void 0 : availabilityError.message) !== null && _h !== void 0 ? _h : null,
            blocksError: (_j = blocksError === null || blocksError === void 0 ? void 0 : blocksError.message) !== null && _j !== void 0 ? _j : null,
            tenantId,
            locationId,
        });
    }
    return {
        teachers,
        students,
        families,
        availability: availabilityError ? [] : ((_k = availabilityRes.data) !== null && _k !== void 0 ? _k : []),
        blocks: blocksError ? [] : ((_l = blocksRes.data) !== null && _l !== void 0 ? _l : []),
        rooms,
        locationHours,
    };
}
