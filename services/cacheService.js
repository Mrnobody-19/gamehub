import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.log("Error saving cache:", error);
  }
};

export const loadCache = async (key) => {
  try {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.log("Error loading cache:", error);
    return null;}
};

export const clearCache = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log("Error clearing cache:", error);
  }
};
