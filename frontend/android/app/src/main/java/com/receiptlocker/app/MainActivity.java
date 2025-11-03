package com.receiptlocker.app;

import android.os.Bundle;
import android.graphics.Color;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Make status bar dark/translucent but let system handle the padding
        getWindow().setStatusBarColor(Color.parseColor("#282828"));
    }
}
