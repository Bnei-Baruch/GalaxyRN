package com.galaxy_mobile.logger;

import android.content.Context;
import android.util.Log;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Persistent rotating log file shared by JS (via SendLogsModule.appendLogs) and
 * native (via GxyLogger). All file I/O runs on a single background thread.
 *
 * Uses android.util.Log for its own diagnostics — never GxyLogger, to avoid
 * recursion.
 */
public final class LogFileWriter {
    private static final String TAG = "LogFileWriter";
    private static final String DIR_NAME = "logs";
    private static final String FILE_PREFIX = "gxy-";
    private static final String FILE_SUFFIX = ".log";
    private static final long MAX_FILE_BYTES = 1024 * 1024;
    private static final int MAX_FILES = 5;
    private static final long FLUSH_DELAY_MS = 1000;

    private static final ScheduledExecutorService executor =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "GxyLogFileWriter");
                t.setDaemon(true);
                return t;
            });

    private static volatile File dir;
    private static volatile long verboseUntil = 0;

    // Accessed only on the executor thread
    private static Writer writer;
    private static long currentSize;
    private static boolean flushScheduled;
    private static SimpleDateFormat dateFormat;

    private LogFileWriter() {
    }

    public static synchronized void init(Context context) {
        if (dir != null) return;
        File d = new File(context.getFilesDir(), DIR_NAME);
        if (!d.exists() && !d.mkdirs()) {
            Log.e(TAG, "Failed to create log dir " + d);
            return;
        }
        dir = d;
    }

    public static void setVerboseUntil(long until) {
        verboseUntil = until;
    }

    public static boolean isVerbose() {
        return System.currentTimeMillis() < verboseUntil;
    }

    /** Appends a native log line. */
    public static void appendLine(String level, String tag, String message, Throwable throwable) {
        if (dir == null) return;
        final long time = System.currentTimeMillis();
        executor.execute(() -> {
            StringBuilder line = new StringBuilder()
                    .append(formatTime(time)).append(' ')
                    .append(level).append(" [native:").append(tag).append("] ")
                    .append(message).append('\n');
            if (throwable != null) {
                line.append(Log.getStackTraceString(throwable)).append('\n');
            }
            write(line.toString());
        });
    }

    /** Appends pre-formatted text (newline-terminated lines) coming from JS. */
    public static void append(String text) {
        if (dir == null || text == null || text.isEmpty()) return;
        executor.execute(() -> write(text));
    }

    public interface ReadCallback {
        void onResult(String logs, Exception error);
    }

    /** Reads all log files, oldest first, after flushing pending writes. */
    public static void readAll(ReadCallback callback) {
        executor.execute(() -> {
            try {
                flushNow();
                StringBuilder sb = new StringBuilder();
                if (dir != null) {
                    for (int i = MAX_FILES - 1; i >= 0; i--) {
                        File f = fileAt(i);
                        if (f.exists()) sb.append(readFile(f));
                    }
                }
                callback.onResult(sb.toString(), null);
            } catch (Exception e) {
                callback.onResult(null, e);
            }
        });
    }

    private static void write(String text) {
        try {
            if (writer == null) openWriter();
            writer.write(text);
            currentSize += text.length();
            if (currentSize >= MAX_FILE_BYTES) {
                rotate();
            } else if (!flushScheduled) {
                flushScheduled = true;
                executor.schedule(LogFileWriter::flushNow, FLUSH_DELAY_MS, TimeUnit.MILLISECONDS);
            }
        } catch (IOException e) {
            Log.e(TAG, "Failed to write log file", e);
            closeWriter();
        }
    }

    private static void openWriter() throws IOException {
        File f = fileAt(0);
        currentSize = f.exists() ? f.length() : 0;
        writer = new BufferedWriter(
                new OutputStreamWriter(new FileOutputStream(f, true), StandardCharsets.UTF_8));
    }

    private static void flushNow() {
        flushScheduled = false;
        if (writer == null) return;
        try {
            writer.flush();
        } catch (IOException e) {
            Log.e(TAG, "Failed to flush log file", e);
            closeWriter();
        }
    }

    private static void closeWriter() {
        if (writer == null) return;
        try {
            writer.close();
        } catch (IOException e) {
            Log.e(TAG, "Failed to close log file", e);
        }
        writer = null;
    }

    private static void rotate() {
        closeWriter();
        File oldest = fileAt(MAX_FILES - 1);
        if (oldest.exists() && !oldest.delete()) {
            Log.w(TAG, "Failed to delete " + oldest);
        }
        for (int i = MAX_FILES - 2; i >= 0; i--) {
            File f = fileAt(i);
            if (f.exists() && !f.renameTo(fileAt(i + 1))) {
                Log.w(TAG, "Failed to rotate " + f);
            }
        }
        currentSize = 0;
    }

    private static File fileAt(int index) {
        return new File(dir, FILE_PREFIX + index + FILE_SUFFIX);
    }

    private static String readFile(File f) throws IOException {
        try (FileInputStream in = new FileInputStream(f)) {
            byte[] bytes = new byte[(int) f.length()];
            int offset = 0;
            while (offset < bytes.length) {
                int read = in.read(bytes, offset, bytes.length - offset);
                if (read < 0) break;
                offset += read;
            }
            return new String(bytes, 0, offset, StandardCharsets.UTF_8);
        }
    }

    private static String formatTime(long time) {
        if (dateFormat == null) {
            dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        }
        return dateFormat.format(new Date(time));
    }
}
