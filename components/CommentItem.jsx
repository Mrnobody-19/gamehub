import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import Avater from './Avater'
import moment from 'moment'
import Icon from '../assets/icons'

const CommentItem = ({
    item,
    canDelete =  false,
    onDelete = ()=>{}
}) => {
    const createdAt = moment(item?.created_at).format('MMM d');

    const handleDelete = ()=> {
        Alert.alert('Confirm',"Are you sure you want to delete this?",[
            {
              text: 'Cancel',
              onPress:()=> console.log('modal cancelled'),
              style: 'cancel'
            },
            {
                text: 'delete',
                onPress:()=> onDelete(item),
                style: 'destructive'
            },
          ])
    }
  return (
    <View style={styles.container}>
                <Avater
                    uri={item?.user?.image}
                />
            
            <View style={styles.content}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.text}>
                            {
                                item?.user?.name
                            }
                        </Text>
                        <Text style={styles.text}>
                            {
                                createdAt
                            }
                        </Text>
                    </View>
                    {
                        canDelete && (
                            <TouchableOpacity onPress={handleDelete}>
                                <Icon name="delete" size={20} color={theme.colors.roses}/>
                            </TouchableOpacity>
                        )
                    }
                   
                </View>
                <Text style={[styles.text, {fontWeight: 'normal'}]}>
                    {item?.text}
                </Text>
            </View>
    </View>
  )
}

export default CommentItem

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        gap: 7,
    },

    content:{
        backgroundColor: '#A8DCE7',
        flex: 1,
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.radius.md,
        borderCurve: 'continuous'
    },

    Highlight:{
        borderWidth: 0.2,
        backgroundColor: 'white',
        borderColor: theme.colors.grey,
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },

    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3
    },

    text:{
        fontSize: hp(1.6),
        fontWeight: theme.fonts.medium,
        
    }
})