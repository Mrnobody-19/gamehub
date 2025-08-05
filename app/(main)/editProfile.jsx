import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Header from '../../components/Header'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import { Image } from 'expo-image'
import { getUserImageSrc, uploadFile } from '../../services/imageService'
import { useAuth } from '../../contexts/AuthContext'
import { Pressable } from 'react-native'
import Icon from '../../assets/icons'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { updateUser } from '../../services/userServices'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'

const EditProfile = () => {
    const { user: currentUser, setUserData } = useAuth();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [user, setUser] = useState({
        name: '',
        phoneNumber: '',
        image: null,
        bio: '',
        address: '',
    })

    useEffect(() => {
        if (currentUser) {
            setUser({
                name: currentUser.name || '',
                phoneNumber: currentUser.phoneNumber || '',
                image: currentUser.image || '',
                address: currentUser.address || '',
                bio: currentUser.bio || '',
            });
        }
    }, [currentUser])

    const onPickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setUser({ ...user, image: result.assets[0] });
        }
    }

    const onSubmit = async () => {
        let userData = { ...user };
        let { name, phoneNumber, address, image, bio } = userData;
        if (!name || !phoneNumber || !address || !bio || !image) {
            Alert.alert('Profile', "Please fill all the fields");
            return;
        }
        setLoading(true);

        if (typeof image == 'object') {
            let imageRes = await uploadFile('profiles', image?.uri, true);
            if (imageRes.success) userData.image = imageRes.data;
            else userData.image = null;
        }

        const res = await updateUser(currentUser?.id, userData);
        setLoading(false);

        if (res.success) {
            setUserData({ ...currentUser, ...userData });
            router.back();
        }
    }

    let imageSource = user.image && typeof user.image == 'object' ? user.image.uri : getUserImageSrc(user.image);

    return (
        <ScreenWrapper bg="#000">
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Header title="Edit Profile" showBackButton={true} />

                    <View style={styles.form}>
                        <View style={styles.avatarContainer}>
                            <Image 
                                source={imageSource} 
                                style={styles.avatar}
                            />
                            <Pressable style={styles.cameraButton} onPress={onPickImage}>
                                <Icon name="camera" size={20} strokeWidth={2.5} color="white" />
                            </Pressable>
                        </View>

                        <Text style={styles.formDescription}>
                            Please fill in your profile details
                        </Text>

                        <Input
                            icon={<Icon name="user" color={theme.colors.roses} />}
                            placeholder='Enter your name'
                            placeholderTextColor="#666"
                            value={user.name}
                            onChangeText={value => setUser({ ...user, name: value })}
                            style={styles.input}
                        />
                        <Input
                            icon={<Icon name="call" color={theme.colors.roses} />}
                            placeholder='Enter your phone number'
                            placeholderTextColor="#666"
                            value={user.phoneNumber}
                            onChangeText={value => setUser({ ...user, phoneNumber: value })}
                            style={styles.input}
                        />
                        <Input
                            icon={<Icon name="location" color={theme.colors.roses} />}
                            placeholder='Enter your address'
                            placeholderTextColor="#666"
                            value={user.address}
                            onChangeText={value => setUser({ ...user, address: value })}
                            style={styles.input}
                        />
                        <Input
                            placeholder='Enter your bio'
                            placeholderTextColor="#666"
                            value={user.bio}
                            multiline={true}
                            containerStyle={styles.bioInput}
                            style={styles.bioText}
                            onChangeText={value => setUser({ ...user, bio: value })}
                        />

                        <Button 
                            title="Update Profile" 
                            loading={loading} 
                            onPress={onSubmit}
                            ButtonStyle={styles.submitButton}
                        />
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    )
}

export default EditProfile

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    scrollContainer: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(4),
    },
    form: {
        gap: 20,
        marginTop: 20,
    },
    avatarContainer: {
        height: hp(14),
        width: hp(14),
        alignSelf: 'center',
        position: 'relative',
        marginBottom: 10,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: hp(7),
        borderWidth: 2,
        borderColor: theme.colors.roses,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        padding: 10,
        borderRadius: 20,
        backgroundColor: theme.colors.roses,
        shadowColor: theme.colors.roses,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 7,
    },
    formDescription: {
        fontSize: hp(1.8),
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
        paddingVertical: 15,
        paddingHorizontal: 20,
        color: 'white',
    },
    bioInput: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
        padding: 15,
        height: hp(15),
    },
    bioText: {
        color: 'white',
        fontSize: hp(1.8),
        lineHeight: 22,
    },
    submitButton: {
        backgroundColor: theme.colors.roses,
        borderRadius: 12,
        height: hp(6),
        marginTop: 10,
    },
})