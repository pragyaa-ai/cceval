import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readdir } from "fs/promises";
import path from "path";

// Directory for storing recordings (outside of public for dynamic access)
const RECORDINGS_DIR = path.join(process.cwd(), "data", "recordings");

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

    // Ensure recordings directory exists (outside of public)
    await mkdir(RECORDINGS_DIR, { recursive: true });

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filePath = path.join(RECORDINGS_DIR, filename);
    await writeFile(filePath, buffer);

    // Return the API URL for accessing the recording (not static file path)
    const recordingUrl = `/api/v2/recordings/${filename}`;
    
    console.log(`[Recordings API] ✅ Saved recording: ${filename} (${buffer.length} bytes) to ${filePath}`);

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

// GET /api/v2/recordings - List all recordings (for debugging)
export async function GET() {
  try {
    await mkdir(RECORDINGS_DIR, { recursive: true });
    const files = await readdir(RECORDINGS_DIR);
    return NextResponse.json({ recordings: files });
  } catch (error) {
    console.error("[Recordings API] ❌ Error listing recordings:", error);
    return NextResponse.json({ error: "Failed to list recordings" }, { status: 500 });
  }
}
