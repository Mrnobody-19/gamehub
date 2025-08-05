import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp, wp } from '../helpers/common'
import Avater from './Avater'
import moment from 'moment'
import Icon from '../assets/icons'

const CommentItem = ({
    item,
    canDelete = false,
    onDelete = () => {}
}) => {
    const createdAt = moment(item?.created_at).format('MMM D, h:mm A');

    const handleDelete = () => {
        Alert.alert('Confirm', "Delete this comment?", [
            {
                text: 'Cancel',
                style: 'cancel'
            },
            {
                text: 'Delete',
                onPress: () => onDelete(item),
                style: 'destructive'
            },
        ])
    }

    return (
        <View style={styles.container}>
            <Avater
                uri={item?.user?.image}
                size={hp(4.5)}
                style={styles.avatar}
            />
            
            <View style={styles.contentWrapper}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.name}>
                            {item?.user?.name}
                        </Text>
                        <Text style={styles.time}>
                            {createdAt}
                        </Text>
                    </View>
                    
                    <Text style={styles.commentText}>
                        {item?.text}
                    </Text>
                </View>

                {canDelete && (
                    <TouchableOpacity 
                        onPress={handleDelete}
                        style={styles.deleteButton}
                        activeOpacity={0.7}
                    >
                        <Icon name="delete" size={hp(2.2)} color="#888" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}

export default CommentItem

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: wp(2.5),
        marginBottom: hp(1.5),
    },
    avatar: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    contentWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: wp(2),
    },
    content: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        paddingHorizontal: wp(3.5),
        paddingVertical: hp(1.8),
        borderRadius: theme.radius.lg,
        borderTopLeftRadius: hp(0.8),
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(0.8),
    },
    name: {
        fontSize: hp(1.8),
        fontWeight: '600',
        color: '#f0f0f0',
    },
    time: {
        fontSize: hp(1.4),
        color: '#666',
    },
    commentText: {
        fontSize: hp(1.7),
        color: '#e0e0e0',
        lineHeight: hp(2.4),
    },
    deleteButton: {
        padding: wp(2),
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
})