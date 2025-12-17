import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

// Directory for storing recordings
const RECORDINGS_DIR = path.join(process.cwd(), "data", "recordings");

// GET /api/v2/recordings/[filename] - Serve a recording file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Security: Only allow specific file extensions and prevent path traversal
    const safeFilename = path.basename(filename);
    if (!safeFilename.match(/^[\w\-\.]+\.(webm|wav|mp3|ogg)$/)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(RECORDINGS_DIR, safeFilename);
    
    // Check if file exists
    try {
      await stat(filePath);
    } catch {
      console.error(`[Recordings API] File not found: ${filePath}`);
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(filePath);
    const fileStats = await stat(filePath);

    // Determine content type
    let contentType = "audio/webm";
    if (safeFilename.endsWith(".wav")) contentType = "audio/wav";
    else if (safeFilename.endsWith(".mp3")) contentType = "audio/mpeg";
    else if (safeFilename.endsWith(".ogg")) contentType = "audio/ogg";

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStats.size.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Content-Disposition": `inline; filename="${safeFilename}"`,
      },
    });
  } catch (error) {
    console.error("[Recordings API] ❌ Error serving recording:", error);
    return NextResponse.json({ error: "Failed to serve recording" }, { status: 500 });
  }
}
