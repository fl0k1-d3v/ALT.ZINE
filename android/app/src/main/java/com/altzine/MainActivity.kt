package com.altzine

import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "AltZine"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
      val keyCode = event.keyCode
      val keyName = KeyEvent.keyCodeToString(keyCode)

      // Only emit event to JS on ACTION_DOWN to avoid double-triggers
      if (event.action == KeyEvent.ACTION_DOWN) {
          Log.d("ALTZINE", "Key Pressed: $keyName")
          try {
              val reactContext = (application as ReactApplication).reactHost?.currentReactContext
              if (reactContext != null) {
                  reactContext
                      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                      .emit("onKeyDown", keyName)
              }
          } catch (e: Exception) {
              Log.e("ALTZINE", "Failed to emit key event", e)
          }
      }

      // Consume BOTH ACTION_DOWN and ACTION_UP for these keys to fully block system behavior
      // This specifically prevents the BACK key from exiting the app prematurely
      if (keyName.startsWith("KEYCODE_DPAD") || 
          keyName.startsWith("KEYCODE_NUMPAD") ||
          (keyCode >= KeyEvent.KEYCODE_0 && keyCode <= KeyEvent.KEYCODE_9) ||
          keyCode == KeyEvent.KEYCODE_DEL ||
          keyCode == KeyEvent.KEYCODE_ENTER ||
          keyCode == KeyEvent.KEYCODE_BACK) {
          return true
      }

      return super.dispatchKeyEvent(event)
  }
}
