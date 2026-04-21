import { NextRequest, NextResponse } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";
import { AGENT_DEFINITIONS } from "@/lib/agents/agentDefinitions";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

const client = new Anthropic();

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

    const agent = AGENT_DEFINITIONS[agentId];
    if (!agent) {
      return NextResponse.json(
        { error: `Unknown agent: ${agentId}` },
        { status: 400 }
      );
    }

    // Only Sid can process bulk student uploads
    if (agentId !== "sid") {
      return NextResponse.json(
        { error: "Only Sid can process bulk student data" },
        { status: 403 }
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

    // Call Claude to parse the file and generate updates
    const parsePrompt = `You are Sid, a student profile AI. You have received bulk student data (from a text file or voice transcription).

Your job:
1. Parse the data to identify which students are mentioned and what updates they need
2. For each student, generate a "spruced up" version of their bio and goals
3. Return a JSON array with the updates

The file content is:
${content}

Here are the students in the system:
${allStudents?.map((s: any) => `- ${s.first_name} ${s.last_name} (ID: ${s.id})`).join("\n")}

Return ONLY a valid JSON array like this (no markdown, no code blocks):
[
  {
    "studentId": "uuid-here",
    "studentName": "First Last",
    "bio": "Spruced up bio text here",
    "goals": "Spruced up goals text here"
  }
]

If you can't parse or match a student, skip them. Only return students you can confidently match.`;

    const parseResponse = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [{ role: "user", content: parsePrompt }],
    });

    const parseText =
      parseResponse.content[0].type === "text" ? parseResponse.content[0].text : "";

    // Extract JSON from the response
    let updates: Array<{
      studentId: string;
      studentName: string;
      bio: string;
      goals: string;
    }> = [];
    try {
      updates = JSON.parse(parseText);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = parseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        updates = JSON.parse(jsonMatch[0]);
      }
    }

    // Execute updates for each student
    const results = [];
    for (const update of updates) {
      try {
        const { error: updateError } = await supabase
          .from("students")
          .update({
            bio: update.bio,
            goals: update.goals,
            updated_at: new Date().toISOString(),
          })
          .eq("id", update.studentId)
          .eq("tenant_id", tenantId);

        if (updateError) {
          results.push({
            student: update.studentName,
            status: "failed",
            error: updateError.message,
          });
        } else {
          results.push({
            student: update.studentName,
            status: "updated",
          });
        }
      } catch (err) {
        results.push({
          student: update.studentName,
          status: "failed",
          error: String(err),
        });
      }
    }

    // Generate summary message
    const successCount = results.filter((r) => r.status === "updated").length;
    const failureCount = results.filter((r) => r.status === "failed").length;

    const reply =
      successCount > 0
        ? `Done! ✓ I've updated ${successCount} student profile${successCount !== 1 ? "s" : ""}. ${
            failureCount > 0
              ? `${failureCount} update${failureCount !== 1 ? "s" : ""} failed.`
              : ""
          }`
        : "No students were updated. Please check the file format and try again.";

    return NextResponse.json({ reply, results });
  } catch (error) {
    console.error("Upload process error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
