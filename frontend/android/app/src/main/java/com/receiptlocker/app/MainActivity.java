package com.receiptlocker.app;

import android.os.Bundle;
import android.graphics.Color;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Make status bar dark/translucent but let system handle the padding
        getWindow().setStatusBarColor(Color.parseColor("#282828"));

        // Configure WebView for Clerk authentication
        configureWebViewForAuth();
    }

    @Override
    public void onStart() {
        super.onStart();
        // Ensure cookies are enabled when app starts
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(
                getBridge().getWebView(), true);
    }

    private void configureWebViewForAuth() {
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();

        // Enable JavaScript (should already be enabled by Capacitor)
        settings.setJavaScriptEnabled(true);

        // Enable DOM storage for localStorage/sessionStorage
        settings.setDomStorageEnabled(true);

        // Enable database storage
        settings.setDatabaseEnabled(true);

        // Enable caching for better performance
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Configure cookie handling for authentication
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);

        // CRITICAL: Enable third-party cookies for Clerk OAuth
        // This is required for Clerk authentication to work properly
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // Allow file access from file URLs (if needed for local assets)
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);

        // Enable safe browsing
        settings.setSafeBrowsingEnabled(true);
    }
}
