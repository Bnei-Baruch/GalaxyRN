package com.galaxyrn.logger;

import android.util.Log;
import android.content.Context;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import io.sentry.Sentry;
import io.sentry.Attachment;
import io.sentry.SentryLevel;

/**
 * Utility class for Sentry integration
 * Centralizes all Sentry-related functionality for the GalaxyRN application
 */
public class SentryUtils {

    private static final String TAG = "SentryUtils";

    public static void reportToSentry(SentryLevel level, String tag, String message, Throwable throwable) {
        Log.d(TAG, "reportToSentry: level=" + level + ", tag=" + tag + ", message=" + message);
        try {
            // Create a formatted message with tag
            String sentryMessage = String.format("[%s] %s", tag, message);
            Log.v(TAG, "Created formatted message for Sentry: " + sentryMessage);

            if (throwable != null) {
                Log.d(TAG, "Reporting exception to Sentry with message");
                // Report exception with message
                Sentry.withScope(scope -> {
                    scope.setTag("logger_tag", tag);
                    scope.setLevel(level);
                    scope.setExtra("formatted_message", sentryMessage);
                    Sentry.captureException(throwable);
                });
                Log.i(TAG, "Successfully reported exception to Sentry");
            } else {
                Log.d(TAG, "Reporting message-only to Sentry");
                // Report message only
                Sentry.withScope(scope -> {
                    scope.setTag("logger_tag", tag);
                    scope.setLevel(level);
                    Sentry.captureMessage(sentryMessage);
                });
                Log.i(TAG, "Successfully reported message to Sentry");
            }
        } catch (Exception e) {
            // Don't let Sentry errors break the logging
            Log.e(TAG, "Failed to report to Sentry", e);
        }
    }

    public static void reportCritical(String tag, String message, Throwable throwable) {
        Log.w(TAG, "reportCritical called: tag=" + tag + ", message=" + message);
        // Always log critical errors locally
        Log.e(tag, "CRITICAL: " + message, throwable);

        // Always report to Sentry, regardless of settings
        try {
            String criticalMessage = String.format("CRITICAL: [%s] %s", tag, message);
            Log.d(TAG, "Formatted critical message: " + criticalMessage);

            Sentry.withScope(scope -> {
                scope.setTag("logger_tag", tag);
                scope.setTag("severity", "critical");
                scope.setLevel(SentryLevel.FATAL);
                scope.setExtra("formatted_message", criticalMessage);
                if (throwable != null) {
                    Sentry.captureException(throwable);
                } else {
                    Sentry.captureMessage(criticalMessage);
                }
            });
            Log.i(TAG, "Successfully reported critical error to Sentry");
        } catch (Exception e) {
            Log.e(TAG, "Failed to report critical error to Sentry", e);
        }
    }

    public static void addBreadcrumb(String category, String message) {
        Log.d(TAG, "addBreadcrumb: category=" + category + ", message=" + message);
        try {
            Sentry.addBreadcrumb(message, category);
            Log.v(TAG, "Successfully added breadcrumb to Sentry");
        } catch (Exception e) {
            Log.e(TAG, "Failed to add breadcrumb to Sentry", e);
        }
    }

    public static File compressAndSendLogsToSentry(String rnLogDir, File cacheDir) {
        Log.i(TAG, "compressAndSendLogsToSentry started: rnLogDir=" + rnLogDir + ", cacheDir="
                + cacheDir.getAbsolutePath());
        File tempDir = null;
        try {
            // Create temporary directory
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault());
            String timestamp = dateFormat.format(new Date());
            tempDir = new File(cacheDir, "temp_logs_" + timestamp);
            Log.d(TAG, "Creating temporary directory: " + tempDir.getAbsolutePath());

            if (!tempDir.mkdirs()) {
                Log.e(TAG, "Failed to create temporary directory: " + tempDir.getAbsolutePath());
                return null;
            }

            Log.i(TAG, "Created temporary directory: " + tempDir.getAbsolutePath());

            // Copy RN logs to temp directory
            Log.d(TAG, "Processing RN logs from directory: " + rnLogDir);
            File rnLogDirectory = new File(rnLogDir);
            if (rnLogDirectory.exists() && rnLogDirectory.isDirectory()) {
                Log.d(TAG, "RN log directory exists, creating subdirectory");
                File rnLogsSubDir = new File(tempDir, "rn_logs");
                if (!rnLogsSubDir.mkdirs()) {
                    Log.e(TAG, "Failed to create RN logs subdirectory");
                    return null;
                }
                Log.d(TAG, "Copying RN logs to: " + rnLogsSubDir.getAbsolutePath());
                copyDirectoryContents(rnLogDirectory, rnLogsSubDir);
                Log.i(TAG, "Copied RN logs to temporary directory");
            } else {
                Log.w(TAG, "RN log directory does not exist or is not a directory: " + rnLogDir);
            }

            // Add Java logs to temp directory
            Log.d(TAG, "Adding Java logs to temporary directory");
            addJavaLogsToTempDirectory(tempDir);

            // Compress the temporary directory
            Log.d(TAG, "Starting compression of temporary directory");
            File compressedFile = compressLogDirectory(tempDir, cacheDir);
            if (compressedFile == null) {
                Log.e(TAG, "Failed to compress temporary log directory");
                return null;
            }
            Log.i(TAG, "Successfully compressed logs: " + compressedFile.getAbsolutePath());

            // Send to Sentry
            Log.d(TAG, "Sending compressed logs to Sentry");
            sendCompressedLogsToSentry(compressedFile);

            Log.i(TAG, "compressAndSendLogsToSentry completed successfully");
            return compressedFile;

        } catch (Exception e) {
            Log.e(TAG, "Failed to compress and send logs to Sentry", e);
            return null;
        } finally {
            // Clean up temporary directory
            if (tempDir != null && tempDir.exists()) {
                Log.d(TAG, "Cleaning up temporary directory: " + tempDir.getAbsolutePath());
                try {
                    deleteDirectoryRecursively(tempDir);
                    Log.i(TAG, "Cleaned up temporary directory");
                } catch (Exception e) {
                    Log.w(TAG, "Failed to clean up temporary directory: " + e.getMessage());
                }
            } else {
                Log.d(TAG, "No temporary directory to clean up");
            }
        }
    }

    private static void copyDirectoryContents(File sourceDir, File destDir) {
        Log.d(TAG, "copyDirectoryContents: " + sourceDir.getAbsolutePath() + " -> " + destDir.getAbsolutePath());
        try {
            File[] files = sourceDir.listFiles();
            if (files == null) {
                Log.w(TAG, "No files found in source directory: " + sourceDir.getAbsolutePath());
                return;
            }

            Log.d(TAG, "Found " + files.length + " files/directories to copy");
            for (File file : files) {
                File destFile = new File(destDir, file.getName());

                if (file.isDirectory()) {
                    Log.v(TAG, "Creating directory: " + destFile.getName());
                    if (destFile.mkdirs()) {
                        copyDirectoryContents(file, destFile);
                    } else {
                        Log.w(TAG, "Failed to create directory: " + destFile.getAbsolutePath());
                    }
                } else {
                    try {
                        Files.copy(file.toPath(), destFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                        Log.v(TAG, "Copied file: " + file.getName() + " (" + file.length() + " bytes)");
                    } catch (IOException e) {
                        Log.w(TAG, "Failed to copy file " + file.getName() + ": " + e.getMessage());
                    }
                }
            }
            Log.d(TAG, "Completed copying directory contents");
        } catch (Exception e) {
            Log.e(TAG, "Error copying directory contents", e);
        }
    }

    private static void addJavaLogsToTempDirectory(File tempDir) {
        Log.d(TAG, "addJavaLogsToTempDirectory: " + tempDir.getAbsolutePath());
        try {
            File javaLogsSubDir = new File(tempDir, "java_logs");
            Log.d(TAG, "Creating Java logs subdirectory: " + javaLogsSubDir.getAbsolutePath());
            if (!javaLogsSubDir.mkdirs()) {
                Log.e(TAG, "Failed to create Java logs subdirectory");
                return;
            }

            // Get log directory from GxyLoggerUtils
            String logDirPath = GxyLoggerUtils.getLogDir();
            Log.d(TAG, "Retrieved Java log directory path: " + logDirPath);
            if (logDirPath != null && !logDirPath.isEmpty()) {
                File logDirectory = new File(logDirPath);
                if (logDirectory.exists() && logDirectory.isDirectory()) {
                    Log.d(TAG, "Java log directory exists, copying files");
                    // Copy all files from GxyLogger log directory to compressed archive
                    copyDirectoryContents(logDirectory, javaLogsSubDir);
                    Log.i(TAG, "Copied all Java log files from directory: " + logDirPath);
                } else {
                    Log.w(TAG, "Java log directory does not exist or is not a directory: " + logDirPath);
                }
            } else {
                Log.i(TAG, "No Java log directory configured");
            }

            // Create a summary file with Java log information
            Log.d(TAG, "Creating Java logs summary file");
            File summaryFile = new File(javaLogsSubDir, "java_logs_info.txt");
            try (FileOutputStream fos = new FileOutputStream(summaryFile)) {
                String summary = "Java Logs Summary\n";
                summary += "==================\n";
                summary += "Generated: "
                        + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()) + "\n\n";

                String logFilesInfo = com.galaxyrn.logger.GxyLoggerUtils.getLogFilesInfo();
                summary += logFilesInfo != null ? logFilesInfo : "No log files information available";

                fos.write(summary.getBytes());
                Log.i(TAG, "Created Java logs summary file: " + summaryFile.getAbsolutePath());
            } catch (IOException e) {
                Log.w(TAG, "Failed to create Java logs summary file: " + e.getMessage());
            }

        } catch (Exception e) {
            Log.e(TAG, "Error adding Java logs to temporary directory", e);
        }
        Log.d(TAG, "addJavaLogsToTempDirectory completed");
    }

    private static void deleteDirectoryRecursively(File directory) {
        Log.v(TAG, "deleteDirectoryRecursively: " + directory.getAbsolutePath());
        if (directory.isDirectory()) {
            File[] files = directory.listFiles();
            if (files != null) {
                Log.v(TAG, "Deleting " + files.length + " files/directories");
                for (File file : files) {
                    deleteDirectoryRecursively(file);
                }
            }
        }
        boolean deleted = directory.delete();
        Log.v(TAG, "Deleted " + directory.getName() + ": " + deleted);
    }

    public static File compressLogDirectory(File sourceDir, File cacheDir) {
        Log.d(TAG, "compressLogDirectory: " + sourceDir.getAbsolutePath() + " -> " + cacheDir.getAbsolutePath());
        try {
            // Create output file with timestamp
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault());
            String timestamp = dateFormat.format(new Date());
            String fileName = "logs_" + timestamp + ".zip";
            Log.d(TAG, "Creating ZIP file: " + fileName);

            File outputFile = new File(cacheDir, fileName);

            try (FileOutputStream fos = new FileOutputStream(outputFile);
                    ZipOutputStream zos = new ZipOutputStream(fos)) {

                Log.d(TAG, "Starting recursive compression");
                compressDirectoryRecursively(sourceDir, sourceDir.getName(), zos);

                Log.i(TAG, "Successfully compressed logs to: " + outputFile.getAbsolutePath() + " ("
                        + outputFile.length() + " bytes)");
                return outputFile;

            } catch (IOException e) {
                Log.e(TAG, "Error creating ZIP file", e);
                return null;
            }

        } catch (Exception e) {
            Log.e(TAG, "Error compressing log directory", e);
            return null;
        }
    }

    private static void compressDirectoryRecursively(File sourceDir, String basePath, ZipOutputStream zos)
            throws IOException {
        Log.v(TAG, "compressDirectoryRecursively: " + sourceDir.getAbsolutePath() + " (basePath: " + basePath + ")");
        File[] files = sourceDir.listFiles();
        if (files == null) {
            Log.v(TAG, "No files in directory: " + sourceDir.getAbsolutePath());
            return;
        }

        Log.v(TAG, "Processing " + files.length + " files/directories");
        byte[] buffer = new byte[1024];

        for (File file : files) {
            if (file.isDirectory()) {
                // Recursively compress subdirectories
                String newBasePath = basePath + "/" + file.getName();
                Log.v(TAG, "Recursing into directory: " + file.getName());
                compressDirectoryRecursively(file, newBasePath, zos);
            } else {
                // Add file to ZIP
                String entryName = basePath + "/" + file.getName();
                ZipEntry zipEntry = new ZipEntry(entryName);
                zos.putNextEntry(zipEntry);

                try (FileInputStream fis = new FileInputStream(file)) {
                    int length;
                    long totalBytes = 0;
                    while ((length = fis.read(buffer)) > 0) {
                        zos.write(buffer, 0, length);
                        totalBytes += length;
                    }
                    Log.v(TAG, "Added file to ZIP: " + entryName + " (" + totalBytes + " bytes)");
                }

                zos.closeEntry();
            }
        }
    }

    public static void sendCompressedLogsToSentry(File compressedFile) {
        Log.i(TAG, "sendCompressedLogsToSentry: " + compressedFile.getAbsolutePath() + " (" + compressedFile.length()
                + " bytes)");
        try {
            // Save to external storage for easy access
            Log.d(TAG, "Saving to external storage");
            saveToExternalStorage(compressedFile);

            // Create Sentry attachment
            Log.d(TAG, "Creating Sentry attachment");
            Attachment attachment = new Attachment(
                    compressedFile.getAbsolutePath(),
                    "application/zip",
                    "full_logs_" + compressedFile.getName());

            // Send to Sentry with context
            Log.d(TAG, "Sending to Sentry with context");
            Sentry.withScope(scope -> {
                scope.setTag("log_type", "compressed_logs");
                scope.setTag("source", "android_logger_module");
                scope.setLevel(SentryLevel.INFO);
                scope.addAttachment(attachment);
                scope.setExtra("file_size", String.valueOf(compressedFile.length()));
                scope.setExtra("timestamp",
                        new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));

                String message = String.format("Compressed logs uploaded - File: %s, Size: %d bytes",
                        compressedFile.getName(), compressedFile.length());

                Sentry.captureMessage(message);
                Log.i(TAG, "Successfully sent compressed logs to Sentry: " + message);
            });

        } catch (Exception e) {
            Log.e(TAG, "Failed to send compressed logs to Sentry", e);
            throw e;
        }
    }

    private static void saveToExternalStorage(File compressedFile) {
        Log.d(TAG, "saveToExternalStorage: " + compressedFile.getName());
        try {
            String externalLogDir = GxyLoggerUtils.getExternalLogDir();
            Log.d(TAG, "External log directory: " + externalLogDir);
            File externalDir = new File(externalLogDir);

            File externalFile = new File(externalDir, compressedFile.getName());
            Log.d(TAG, "Copying to external file: " + externalFile.getAbsolutePath());
            Files.copy(compressedFile.toPath(), externalFile.toPath(), StandardCopyOption.REPLACE_EXISTING);

            Log.i(TAG, "Compressed logs saved to external storage: " + externalFile.getAbsolutePath() + " ("
                    + externalFile.length() + " bytes)");

        } catch (Exception e) {
            Log.w(TAG, "Failed to save compressed file to external storage: " + e.getMessage());
        }
    }
}