import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function Index() {
  // useEffect(() => {
  //   const createAppDir = async () => {
  //     const res = await StorageAccessFramework.makeDirectoryAsync(
  //       "content://com.android.externalstorage.documents/tree/primary",
  //       "MyApp"
  //     );
  //   };
  //   createAppDir().then((res) => {
  //       console.log("createAppDir", res);
  //     })
  //     .catch((err) => {
  //       console.log("createAppDir error", err);
  //     });
  // }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Link style={styles.button} href="/camera">
        Camera
      </Link>
      <Link style={styles.button} href="/filelist">
        Filelist
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    margin: 10,
    padding: 10,
    backgroundColor: "blue",
    color: "white",
  },
});
