import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/v2/recordings - Upload audio recording
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File;
    const evaluationId = formData.get("evaluationId") as string;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (!evaluationId) {
      return NextResponse.json({ error: "No evaluation ID provided" }, { status: 400 });
    }

    // Get file extension from mime type
    const mimeType = file.type;
    let extension = "webm";
    if (mimeType.includes("wav")) extension = "wav";
    else if (mimeType.includes("mp3")) extension = "mp3";
    else if (mimeType.includes("ogg")) extension = "ogg";

    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `recording-${evaluationId}-${timestamp}.${extension}`;

    // Ensure recordings directory exists
    const recordingsDir = path.join(process.cwd(), "public", "recordings");
    await mkdir(recordingsDir, { recursive: true });

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filePath = path.join(recordingsDir, filename);
    await writeFile(filePath, buffer);

    // Return the public URL
    const recordingUrl = `/recordings/${filename}`;
    
    console.log(`[Recordings API] ✅ Saved recording: ${filename} (${buffer.length} bytes)`);

    return NextResponse.json({ 
      success: true, 
      recordingUrl,
      filename,
      size: buffer.length
    });
  } catch (error) {
    console.error("[Recordings API] ❌ Error uploading recording:", error);
    return NextResponse.json({ error: "Failed to save recording" }, { status: 500 });
  }
}
