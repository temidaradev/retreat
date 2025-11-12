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
        
        // Enable edge-to-edge display for modern Android devices
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        } else if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            getWindow().getDecorView().setSystemUiVisibility(
                android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        }

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

        // Android WebView optimizations for better mobile experience
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        
        // Better text rendering
        settings.setTextZoom(100);
        
        // Enable smooth scrolling
        settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
        
        // Better performance
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        
        // Enable built-in zoom controls (if needed)
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        
        // Better keyboard handling
        settings.setSupportZoom(false);
        
        // Enable mixed content for development (if needed)
        // settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    }
}
