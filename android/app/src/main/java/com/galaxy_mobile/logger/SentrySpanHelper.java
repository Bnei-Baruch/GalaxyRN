package com.galaxy_mobile.logger;

import android.util.Log;
import io.sentry.ISpan;
import io.sentry.Sentry;
import io.sentry.SpanStatus;

/**
 * Helper class for managing Sentry spans
 * Simplifies span creation, tracking, and completion
 */
public class SentrySpanHelper {
    private static final String TAG = "SentrySpanHelper";

    private ISpan span;
    private final String operation;

    private SentrySpanHelper(String operation) {
        this.operation = operation;
    }

    /**
     * Creates and starts a new Sentry span
     * 
     * @param operation The operation name for the span (e.g. "audio.manager.init")
     * @return SentrySpanHelper instance or null if span creation failed
     */
    public static SentrySpanHelper start(String operation) {
        try {
            SentrySpanHelper helper = new SentrySpanHelper(operation);
            ISpan parentSpan = Sentry.getSpan();

            if (parentSpan != null) {
                helper.span = parentSpan.startChild(operation);
                Log.v(TAG, "Started span: " + operation);
            } else {
                Log.v(TAG, "No parent span available, span not created: " + operation);
            }

            return helper;
        } catch (Exception e) {
            Log.e(TAG, "Failed to start span: " + operation, e);
            return new SentrySpanHelper(operation); // Return helper without span
        }
    }

    /**
     * Sets the description for this span
     * 
     * @param description Human-readable description of what this span does
     * @return This helper instance for chaining
     */
    public SentrySpanHelper setDescription(String description) {
        try {
            if (span != null) {
                span.setDescription(description);
                Log.v(TAG, "Set description for span '" + operation + "': " + description);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to set description for span: " + operation, e);
        }
        return this;
    }

    /**
     * Sets a tag on the span
     * 
     * @param key   The tag key
     * @param value The tag value
     * @return This helper instance for chaining
     */
    public SentrySpanHelper setTag(String key, String value) {
        try {
            if (span != null) {
                span.setTag(key, value);
                Log.v(TAG, "Set tag for span '" + operation + "': " + key + "=" + value);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to set tag for span: " + operation, e);
        }
        return this;
    }

    /**
     * Sets data on the span
     * 
     * @param key   The data key
     * @param value The data value
     * @return This helper instance for chaining
     */
    public SentrySpanHelper setData(String key, Object value) {
        try {
            if (span != null) {
                span.setData(key, value);
                Log.v(TAG, "Set data for span '" + operation + "': " + key + "=" + value);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to set data for span: " + operation, e);
        }
        return this;
    }

    /**
     * Sets a throwable on the span
     * 
     * @param throwable The exception that occurred
     * @return This helper instance for chaining
     */
    public SentrySpanHelper setThrowable(Throwable throwable) {
        try {
            if (span != null) {
                span.setThrowable(throwable);
                Log.v(TAG, "Set throwable for span '" + operation + "': " + throwable.getMessage());
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to set throwable for span: " + operation, e);
        }
        return this;
    }

    /**
     * Finishes the span with a status
     * 
     * @param status The final status of the span
     */
    public void finish(SpanStatus status) {
        try {
            if (span != null) {
                span.setStatus(status);
                span.finish();
                Log.v(TAG, "Finished span '" + operation + "' with status: " + status);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to finish span: " + operation, e);
        }
    }

    /**
     * Finishes the span with OK status
     */
    public void finishOk() {
        finish(SpanStatus.OK);
    }

    /**
     * Finishes the span with an error status and optional throwable
     * 
     * @param throwable The exception that caused the error (can be null)
     */
    public void finishWithError(Throwable throwable) {
        if (throwable != null) {
            setThrowable(throwable);
        }
        finish(SpanStatus.INTERNAL_ERROR);
    }

    /**
     * Checks if this helper has an active span
     * 
     * @return true if span is active, false otherwise
     */
    public boolean hasSpan() {
        return span != null;
    }
}
