import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../constants';

// Get user image source
export const getUserImageSrc = imagePath => {
    if (imagePath) {
        return getSupabaseFileUrl(imagePath);
    } else {
        return require('../assets/images/defaultUser.jpg');
    }
};

// Get Supabase file URL
export const getSupabaseFileUrl = filePath => {
    if (filePath) {
        return { uri: `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}` };
    }
    return null;
};

// Download file from a URL
export const downloadFile = async (url) => {
    try {
        const { uri } = await FileSystem.downloadAsync(url, getLocalFilePath(url));
        return uri;
    } catch (error) {
        console.error('Download error:', error); // Log the error for debugging
        return null;
    }
};

// Get local file path
export const getLocalFilePath = filePath => {
    let fileName = filePath.split('/').pop();
    return `${FileSystem.documentDirectory}${fileName}`;
};

// Upload file to Supabase
export const uploadFile = async (folderName, fileuri, isImage = true) => {
    try {
        let fileName = getFilePath(folderName, isImage);
        const fileBase64 = await FileSystem.readAsStringAsync(fileuri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        let imageData = decode(fileBase64); // Convert base64 to array buffer
        let { data, error } = await supabase
            .storage
            .from('uploads')
            .upload(fileName, imageData, {
                cacheControl: '3600', // Fixed typo here
                upsert: false,
                contentType: isImage ? 'image/*' : 'video/*',
            });

        if (error) {
            console.error('File upload error:', error); // Log the error for debugging
            return { success: false, msg: 'Could not upload media' };
        }

        return { success: true, data: data.path };
    } catch (error) {
        console.error('Upload error:', error); // Log the error for debugging
        return { success: false, msg: 'Could not upload media' };
    }
};

// Get file path for uploads
export const getFilePath = (folderName, isImage) => {
    return `/${folderName}/${(new Date()).getTime()}${isImage ? '.png' : '.mp4'}`;
};
