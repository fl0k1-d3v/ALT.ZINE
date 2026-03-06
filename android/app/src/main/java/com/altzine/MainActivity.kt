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

      // We ONLY consume the BACK key to prevent the app from closing.
      // All other keys (DPAD, ENTER, DEL, NUMBERS) must be passed to the 
      // system so that the TextInput and other UI elements can handle them 
      // for cursor movement, typing, and deletion.
      if (keyCode == KeyEvent.KEYCODE_BACK) {
          return true
      }

      return super.dispatchKeyEvent(event)
  }
}
