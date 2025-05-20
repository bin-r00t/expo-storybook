import { Ionicons } from "@expo/vector-icons";
import {
  BarcodeScanningResult,
  CameraType,
  CameraView,
  PhotoResult,
  PictureRef,
  useCameraPermissions,
} from "expo-camera";
import * as FileSystem from "expo-file-system";
import { StorageAccessFramework } from "expo-file-system";
import { Image } from "expo-image";
import { useCallback, useRef, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CameraPage() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  const [barcode, setBarcode] = useState<string>("");
  const cameraRef = useRef<CameraView>(null);
  const [pic, setPic] = useState<PictureRef | null>(null);

  const handleBarcodeScan = useCallback(
    (result: BarcodeScanningResult) => {
      console.log("result", barcode, result);
      if (barcode) return;
      // 检测到二维码
      setBarcode(result?.data || "");
      setTimeout(() => {
        setBarcode("");
      }, 2000);
    },
    [barcode]
  );

  // const debouncedHandleBarcodeScan = useDebounce(handleBarcodeScan, 1000);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function saveFile(fileUri: string) {
    const PATH = "file:///storage/emulated/0/DCIM";
    const appGallaryPath = PATH + "zip-extractor";
    // await FileSystem.makeDirectoryAsync(appGallaryPath, {
    //   intermediates: true,
    // });
    console.log(
      "fileUri ---> ",
      fileUri,
      PATH + `/${fileUri.split("/").pop()}`
    );

    await FileSystem.copyAsync({
      from: fileUri,
      to: PATH + `/${fileUri.split("/").pop()}`,
    });

    console.log("saved...");
  }

  async function handleShutter() {
    const pic = await cameraRef.current?.takePictureAsync({
      pictureRef: true,
    });
    if (pic) {
      setPic(pic);
      const result: PhotoResult = await pic.savePictureAsync({
        quality: 1,
      });

      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        try {
          // 获取根目录 URI
          const rootUri = permissions.directoryUri;
          console.log("根目录 URI:", rootUri);
          
          // 创建 ZipExtractor 目录
          const zipExtractorUri = await StorageAccessFramework.makeDirectoryAsync(
            rootUri,
            "ZipExtractor"
          );
          console.log("ZipExtractor 目录 URI:", zipExtractorUri);

          // 生成文件名（使用时间戳确保唯一性）
          const timestamp = new Date().getTime();
          const fileName = `photo_${timestamp}.jpg`;

          // 在 ZipExtractor 目录中创建文件
          const fileUri = await StorageAccessFramework.createFileAsync(
            zipExtractorUri,
            fileName,
            "image/jpeg"
          );
          console.log("新文件 URI:", fileUri);

          // 将照片复制到新创建的文件
          const fileContent = await FileSystem.readAsStringAsync(result.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await StorageAccessFramework.writeAsStringAsync(
            fileUri,
            fileContent,
            {
              encoding: FileSystem.EncodingType.Base64,
            }
          );

          console.log("照片已保存到:", fileUri);
        } catch (error) {
          console.error("保存照片时出错:", error);
          // 显示更详细的错误信息
          if (error instanceof Error) {
            console.error("错误详情:", error.message);
            console.error("错误堆栈:", error.stack);
          }
        }
      }
    }
  }

  return (
    <View style={styles.container}>
      {barcode && (
        <View style={styles.barcodeContainer}>
          <Text style={styles.barcodeText}>{barcode}</Text>
          {barcode.includes("https://") && (
            <TouchableOpacity style={styles.barcodeButton}>
              <Text style={styles.barcodeButtonText}>打开</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {pic && (
        <View
          style={{
            position: "absolute",
            zIndex: 2,
            right: "5%",
            bottom: "15%",
            padding: 10,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={pic}
            style={{ width: pic.width / 20, height: pic.height / 20 }}
          />
          <TouchableOpacity
            style={{ position: "absolute", top: 12, right: 12 }}
            onPress={() => setPic(null)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScan}
      >
        <View style={styles.buttonContainer}>
          <View style={{ flex: 1 }}></View>
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <TouchableOpacity
              style={[styles.shutterButton]}
              onPress={handleShutter}
            >
              <Ionicons name="camera" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <TouchableOpacity
              style={[styles.switchButton]}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse" size={24} color="black" />
              <View
                style={[
                  styles.indicator,
                  { opacity: facing === "back" ? 0 : 1 },
                ]}
              ></View>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    backgroundColor: "white",
    position: "absolute",
    bottom: 0,
    height: 100,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    paddingBottom: 24,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    borderColor: "red",
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
  },
  shutterButton: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    borderRadius: 100,
    backgroundColor: "#30ca6e",
  },
  switchButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 64,
    height: 64,
  },
  indicator: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: "-50%" }],
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 100,
    backgroundColor: "#30ca6e",
  },
  // 二维码
  barcodeContainer: {
    position: "absolute",
    zIndex: 2,
    left: "10%",
    bottom: 240,
    margin: "auto",
    width: "80%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
  },
  barcodeText: {
    fontSize: 14,
    color: "white",
    textAlign: "center",
  },
  barcodeButton: {
    backgroundColor: "rgba(0, 0, 0)",
  },
  barcodeButtonText: {
    color: "red",
    fontSize: 12,
  },
});
