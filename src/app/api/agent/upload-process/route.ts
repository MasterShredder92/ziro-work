import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getAgentDefinition } from "@/lib/ziro/agents/definitions";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const dynamic = "force-dynamic";

/**
 * Universal File Upload Processor - SOVEREIGN SCHEMA
 *
 * Replaces the Sid-only Anthropic route.
 * Any agent can now process bulk file uploads via GPT-4o-mini.
 *
 * POST /api/agent/upload-process
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const content = formData.get("content") as string;
    const agentId = formData.get("agentId") as string;
    const contextStr = formData.get("context") as string;
    const context = contextStr ? JSON.parse(contextStr) : {};

    if (!content || !agentId) {
      return NextResponse.json(
        { error: "Missing content or agentId" },
        { status: 400 }
      );
    }

    const agentDef = getAgentDefinition(agentId);
    if (!agentDef) {
      return NextResponse.json(
        { error: "Unknown agent: " + agentId },
        { status: 400 }
      );
    }

    const tenantId = DEFAULT_TENANT_ID;
    const supabase = getServiceClient();

    // Get all students for this tenant to enable name matching
    const { data: allStudents, error: studentsError } = await supabase
      .from("students")
      .select("id, first_name, last_name, bio, goals")
      .eq("tenant_id", tenantId);

    if (studentsError) {
      return NextResponse.json(
        { error: "Failed to fetch students" },
        { status: 500 }
      );
    }

    const studentList = allStudents
      ?.map((s: any) => "- " + s.first_name + " " + s.last_name + " (ID: " + s.id + ")")
      .join("\n") || "No students found";

    const systemPrompt = agentDef.systemPrompt + "\n\nYou are processing a bulk file upload. Parse the data, match students by name, and return a valid JSON array of updates.";

    const parsePrompt = "You have received bulk student data from a file upload.\n\nYour job:\n1. Parse the data to identify which students are mentioned\n2. CATEGORIZE the information into the correct profile fields:\n   - Bio: Personality, musicianship style, dedication, character traits\n   - Goals: Aspirational learning objectives, performance dreams\n   - Prior Experience: Years of playing, previous instruments, formal training\n   - Notes: Practical observations, teacher feedback, behavioral notes\n3. For each field with content, generate a polished professional version\n4. Return a JSON array with the categorized and polished updates\n\nThe file content is:\n" + content + "\n\nHere are the students in the system:\n" + studentList + "\n\nReturn ONLY a valid JSON array (no markdown, no code blocks):\n[\n  {\n    \"studentId\": \"uuid-here\",\n    \"studentName\": \"First Last\",\n    \"bio\": \"Polished bio text or null\",\n    \"goals\": \"Polished goals text or null\",\n    \"prior_experience\": \"Polished prior experience or null\",\n    \"notes\": \"Practical notes or null\"\n  }\n]\n\nIf you cannot match a student, skip them. Use null for fields with no relevant information.";

    // THE AX FIX: Simplified for high availability and compiler compliance
    const { text: parseText } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: parsePrompt,
    } as any); // Cast to any to bypass the SDK v6 strict property check

    let updates: Array<{
      studentId: string;
      studentName: string;
      bio: string | null;
      goals: string | null;
      prior_experience: string | null;
      notes: string | null;
    }> = [];

    try {
      updates = JSON.parse(parseText);
    } catch {
      const jsonMatch = parseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        updates = JSON.parse(jsonMatch[0]);
      }
    }

    const results = [];
    for (const update of updates) {
      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (update.bio) updatePayload.bio = update.bio;
        if (update.goals) updatePayload.goals = update.goals;
        if (update.prior_experience) updatePayload.prior_experience = update.prior_experience;
        if (update.notes) updatePayload.notes = update.notes;

        const { error: updateError } = await supabase
          .from("students")
          .update(updatePayload)
          .eq("id", update.studentId)
          .eq("tenant_id", tenantId);

        if (updateError) {
          results.push({ student: update.studentName, status: "failed", error: updateError.message });
        } else {
          results.push({ student: update.studentName, status: "updated" });
        }
      } catch (err) {
        results.push({ student: update.studentName, status: "failed", error: String(err) });
      }
    }

    const successCount = results.filter((r) => r.status === "updated").length;
    const failureCount = results.filter((r) => r.status === "failed").length;
    const reply = successCount > 0
      ? "Done. Updated " + successCount + " student profile(s)." + (failureCount > 0 ? " " + failureCount + " update(s) failed." : "")
      : "No students were updated. Please check the file format and try again.";

    return NextResponse.json({ reply, results });

  } catch (error: any) {
    console.error("Upload process error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
