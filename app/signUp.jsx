import { StyleSheet, Text, View, Alert, Pressable } from 'react-native'
import React, { useState, useRef } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/theme'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from '../helpers/common'
import Icon from '../assets/icons'
import Input from '../components/Input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'

const SignUp = () => {
    const router = useRouter();
    const emailRef = useRef("");
    const nameRef = useRef("");
    const passwordRef = useRef("");
    const [loading, setLoading] = useState(false);

    const onsubmit = async () => {
        if (!emailRef.current || !passwordRef.current) {
            Alert.alert('Sign Up', "Please fill all fields");
            return;
        }

        let name = nameRef.current.trim();
        let email = emailRef.current.trim();
        let password = passwordRef.current.trim();

        setLoading(true);

        const {data: {session}, error} = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name
                }
            }
        });

        setLoading(false);

        if (error) {
            Alert.alert('Sign up', error.message);
        }
    }

    return (
        <ScreenWrapper bg="black">
            <View style={styles.container}>
                <BackButton router={router} />

                <View style={styles.header}>
                    <Text style={styles.welcomeText}>Let's Get</Text>
                    <Text style={[styles.welcomeText, styles.accentText]}>Started</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.subtitle}>Create your account to continue</Text>
                    
                    <Input
                        style={styles.input}
                        icon={<Icon name="user" size={26} strokewidth={1.6} />}
                        placeholder='Enter your Name'
                        placeholderTextColor="#FFFFFF"
                        onChangeText={value => { nameRef.current = value }}
                    />
                    
                    <Input
                        style={styles.input}
                        icon={<Icon name="mail" size={26} strokewidth={1.6} />}
                        placeholder='Enter your Email'
                        placeholderTextColor="#FFFFFF"
                        onChangeText={value => { emailRef.current = value }}
                    />
                    
                    <Input
                        style={styles.input}
                        icon={<Icon name="lock" size={26} strokewidth={1.6} />}
                        placeholder='Enter your password'
                        placeholderTextColor="#FFFFFF"
                        secureTextEntry
                        onChangeText={value => { passwordRef.current = value }}
                    />

                    <Button 
                        title={'Sign Up'} 
                        loading={loading} 
                        onPress={onsubmit} 
                        style={styles.button}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <Pressable onPress={() => router.push('login')}>
                        <Text style={styles.loginText}>Login</Text>
                    </Pressable>
                </View>
            </View>
        </ScreenWrapper>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(6),
        paddingTop: hp(4),
        backgroundColor: "#000"
    },
    header: {
        marginTop: hp(4),
        marginBottom: hp(6)
    },
    welcomeText: {
        fontSize: hp(5.5),
        fontWeight: '700',
        color: 'white',
        lineHeight: hp(5)
    },
    accentText: {
        color: theme.colors.primary
    },
    subtitle: {
        fontSize: hp(2.5),
        color: '#aaa',
        marginBottom: hp(3)
    },
    form: {
        gap: 25, // Reverted to original gap
    },
    input: {
        color: 'white',
        marginLeft: 10, // Original input style
        flex: 1
    },
    button: {
        marginTop: hp(2),
        backgroundColor: theme.colors.primary,
        borderRadius: 15,
        height: hp(6.5)
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(4),
        gap: wp(1.5)
    },
    footerText: {
        color: '#aaa',
        fontSize: hp(2.5)
    },
    loginText: {
        color: theme.colors.primary,
        fontSize: hp(2.5),
        fontWeight: '600'
    }
})

export default SignUp