package com.faithstream.app;

import android.app.Activity;
import android.app.PictureInPictureParams;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Rational;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PiP")
public class PiPPlugin extends Plugin {

    @PluginMethod
    public void enter(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("PiP not supported on this Android version");
            return;
        }

        if (!activity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
            call.reject("Device does not support Picture-in-Picture");
            return;
        }

        PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();

        // Set aspect ratio from caller or default to 16:9
        double aspectW = call.getDouble("aspectW", 16.0);
        double aspectH = call.getDouble("aspectH", 9.0);
        Rational aspectRatio = new Rational((int) aspectW, (int) aspectH);
        builder.setAspectRatio(aspectRatio);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ allows auto-enter, no manual trigger needed here
            builder.setAutoEnterEnabled(false);
        }

        activity.enterPictureInPictureMode(builder.build());
        call.resolve();
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        Activity activity = getActivity();
        JSObject ret = new JSObject();
        if (activity == null) {
            ret.put("supported", false);
            call.resolve(ret);
            return;
        }

        boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && activity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE);
        ret.put("supported", supported);
        call.resolve(ret);
    }

    @PluginMethod
    public void exit(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ supports exiting PiP programmatically
            activity.getWindow().getDecorView().post(() -> {
                // Exit by finishing the picture-in-picture mode is not directly
                // supported. Instead, we rely on the user pressing a button in PiP
                // or the system handling it.
            });
        }

        // On older versions, PiP can only be exited by the user
        call.reject("Cannot exit PiP programmatically on this version");
    }
}
