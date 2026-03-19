package com.altzine

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.NativeModule
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.zip.ZipInputStream

class MainActivity : ReactActivity() {

  private val PICK_FILE_REQUEST_CODE = 1001

  override fun getMainComponentName(): String = "AltZine"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
      val keyCode = event.keyCode
      val keyName = KeyEvent.keyCodeToString(keyCode)

      if (event.action == KeyEvent.ACTION_DOWN) {
          Log.d("ALTZINE", "Key Pressed: $keyName")
          try {
              val reactHost = (application as ReactApplication).reactHost
              val reactContext = reactHost?.currentReactContext
              if (reactContext != null) {
                  reactContext
                      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                      .emit("onKeyDown", keyName)
              }
          } catch (e: Exception) {
              Log.e("ALTZINE", "Failed to emit key event", e)
          }
      }

      if (keyCode == KeyEvent.KEYCODE_BACK) {
          return true
      }

      return super.dispatchKeyEvent(event)
  }

  fun openFilePicker() {
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
          addCategory(Intent.CATEGORY_OPENABLE)
          type = "*/*"
          val mimeTypes = arrayOf("text/plain", "application/epub+zip")
          putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes)
      }
      startActivityForResult(intent, PICK_FILE_REQUEST_CODE)
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
      super.onActivityResult(requestCode, resultCode, data)
      if (requestCode == PICK_FILE_REQUEST_CODE && resultCode == Activity.RESULT_OK) {
          data?.data?.let { uri ->
              readAndSendFile(uri)
          }
      }
  }

  private fun readAndSendFile(uri: Uri) {
      Thread {
          try {
              val fileName = getFileName(uri) ?: "New Book"
              val content = if (fileName.lowercase().endsWith(".epub")) {
                  extractEpubText(uri)
              } else {
                  readPlainText(uri)
              }

              runOnUiThread {
                  try {
                      val reactHost = (application as ReactApplication).reactHost
                      val reactContext = reactHost?.currentReactContext
                      if (reactContext != null) {
                          val params = Arguments.createMap().apply {
                              putString("title", fileName)
                              putString("content", content)
                              putString("id", uri.toString())
                          }
                          reactContext
                              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                              .emit("onBookUploaded", params)
                      }
                  } catch (e: Exception) {
                      Log.e("ALTZINE", "Error emitting book to JS", e)
                  }
              }
          } catch (e: Exception) {
              Log.e("ALTZINE", "Error reading file", e)
          }
      }.start()
  }

  private fun readPlainText(uri: Uri): String {
      val inputStream = contentResolver.openInputStream(uri)
      val reader = BufferedReader(InputStreamReader(inputStream))
      val stringBuilder = StringBuilder()
      var line: String? = reader.readLine()
      while (line != null) {
          stringBuilder.append(line).append("\n")
          line = reader.readLine()
      }
      inputStream?.close()
      return stringBuilder.toString()
  }

  private fun extractEpubText(uri: Uri): String {
      val stringBuilder = StringBuilder()
      val inputStream = contentResolver.openInputStream(uri)
      val zipInputStream = ZipInputStream(inputStream)
      
      var entry = zipInputStream.nextEntry
      while (entry != null) {
          // Look for HTML or XHTML files inside the EPUB zip
          if (entry.name.endsWith(".html") || entry.name.endsWith(".xhtml")) {
              val reader = BufferedReader(InputStreamReader(zipInputStream))
              var line: String? = reader.readLine()
              while (line != null) {
                  // Extremely basic HTML tag stripping
                  val cleanLine = line.replace(Regex("<[^>]*>"), "").trim()
                  if (cleanLine.isNotEmpty()) {
                      stringBuilder.append(cleanLine).append("\n\n")
                  }
                  line = reader.readLine()
              }
          }
          entry = zipInputStream.nextEntry
      }
      zipInputStream.close()
      return stringBuilder.toString()
  }

  private fun getFileName(uri: Uri): String? {
      var result: String? = null
      if (uri.scheme == "content") {
          val cursor = contentResolver.query(uri, null, null, null, null)
          try {
              if (cursor != null && cursor.moveToFirst()) {
                  val index = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                  if (index != -1) result = cursor.getString(index)
              }
          } finally {
              cursor?.close()
          }
      }
      if (result == null) {
          result = uri.path
          val cut = result?.lastIndexOf('/') ?: -1
          if (cut != -1) result = result?.substring(cut + 1)
      }
      return result
  }
}

class FilePickerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "FilePickerModule"

    @ReactMethod
    fun pickFile() {
        val activity = reactContext.currentActivity as? MainActivity
        activity?.openFilePicker()
    }
}

class FilePickerPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(FilePickerModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
