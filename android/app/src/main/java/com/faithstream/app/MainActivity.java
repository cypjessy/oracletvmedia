package com.faithstream.app;

import android.app.PictureInPictureParams;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    private WebView webView;
    private boolean jsInterfaceAdded = false;

    // Flag set by WebView JS — only true when the video player is actively open
    private static boolean pipVideoActive = false;

    /**
     * JavaScript interface for WebView to signal PiP readiness.
     */
    public static class PiPBridge {
        @JavascriptInterface
        public void setVideoActive(boolean active) {
            pipVideoActive = active;
        }

        @JavascriptInterface
        public boolean isVideoActive() {
            return pipVideoActive;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register the PiP plugin
        registerPlugin(PiPPlugin.class);
    }

    @Override
    public void onStart() {
        super.onStart();
        if (webView == null && getBridge() != null) {
            webView = getBridge().getWebView();
        }
        if (webView != null) {
            // Add JavaScript interface for PiP state tracking (only once)
            if (!jsInterfaceAdded) {
                webView.addJavascriptInterface(new PiPBridge(), "AndroidPiP");
                jsInterfaceAdded = true;
            }
            // Ensure media playback doesn't require user gesture after initial play
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Keep WebView timers running so audio continues in background
        if (webView != null) {
            webView.resumeTimers();
        }
    }

    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
        // Only enter PiP if the video player is actively open
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && pipVideoActive) {
            if (getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
                PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
                builder.setAspectRatio(new Rational(16, 9));
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    builder.setAutoEnterEnabled(true);
                }
                enterPictureInPictureMode(builder.build());
            }
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        if (webView != null) {
            // Notify the WebView about PiP mode change so the UI can adapt
            String script = String.format(
                "window.dispatchEvent(new CustomEvent('pip-mode-changed', { detail: { isInPip: %s } }))",
                isInPictureInPictureMode ? "true" : "false"
            );
            webView.post(() -> {
                if (webView != null) {
                    webView.evaluateJavascript(script, null);
                }
            });
        }
    }
}
